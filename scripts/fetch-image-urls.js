/**
 * 批量获取所有图片的下载URL
 * 从rich-blocks数据中提取image tokens,然后获取实际URL
 */

const https = require('https');
const fs = require('fs');

// 飞书应用配置
const FEISHU_APP_ID = 'cli_a8e2014cbe7d9013';
const FEISHU_APP_SECRET = 'tysHBj6njxwafO92dwO1DdttVvqvesf0';

// API限流配置
const DELAY_BETWEEN_REQUESTS = 100; // 每个请求间隔100ms

/**
 * 延迟函数
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 获取飞书 tenant_access_token
 */
async function getTenantAccessToken() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      app_id: FEISHU_APP_ID,
      app_secret: FEISHU_APP_SECRET
    });

    const options = {
      hostname: 'open.feishu.cn',
      port: 443,
      path: '/open-apis/auth/v3/tenant_access_token/internal',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.code === 0) {
            resolve(result.tenant_access_token);
          } else {
            reject(new Error(`获取token失败: ${result.msg}`));
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

/**
 * 获取图片临时下载URL
 */
async function getImageUrl(token, fileToken) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'open.feishu.cn',
      port: 443,
      path: `/open-apis/drive/v1/medias/${fileToken}/download`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      // 不自动跟随重定向,我们需要获取重定向的URL
      followRedirect: false
    };

    const req = https.request(options, (res) => {
      // 处理重定向 - 这是我们需要的图片URL!
      if (res.statusCode === 302 || res.statusCode === 301 || res.statusCode === 307 || res.statusCode === 308) {
        const redirectUrl = res.headers.location;
        if (redirectUrl) {
          resolve(redirectUrl);
        } else {
          reject(new Error('重定向但未找到location header'));
        }
        // 消费响应体以释放连接
        res.resume();
        return;
      }

      // 200状态码 - 直接返回的数据
      if (res.statusCode === 200) {
        // 飞书可能直接返回图片二进制数据,我们需要的是URL,不是数据本身
        // 这种情况下使用原始请求URL作为下载地址
        const downloadUrl = `https://open.feishu.cn/open-apis/drive/v1/medias/${fileToken}/download`;
        resolve(downloadUrl);
        // 消费响应体
        res.resume();
        return;
      }

      // 其他状态码,尝试读取JSON响应
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.code === 1254050) {
            // 文件不存在或已删除
            resolve(null);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${result.msg || '未知错误'}`));
          }
        } catch (error) {
          reject(new Error(`HTTP ${res.statusCode}: 无法解析响应`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

/**
 * 提取所有图片tokens
 */
function extractImageTokens(richBlocksData) {
  const imageTokens = new Set();
  const imageInfo = [];

  richBlocksData.articles.forEach(article => {
    const imageBlocks = article.blocks.filter(b => b.block_type === 27);

    imageBlocks.forEach(block => {
      if (block.image && block.image.token) {
        const token = block.image.token;
        imageTokens.add(token);

        imageInfo.push({
          articleId: article.id,
          articleTitle: article.title,
          token: token,
          width: block.image.width,
          height: block.image.height
        });
      }
    });
  });

  return {
    uniqueTokens: Array.from(imageTokens),
    imageInfo: imageInfo
  };
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log('📖 读取富文本blocks数据...');
    const richBlocksData = JSON.parse(
      fs.readFileSync('./assets/data/articles-rich-blocks.json', 'utf-8')
    );

    console.log('🔍 提取图片tokens...');
    const { uniqueTokens, imageInfo } = extractImageTokens(richBlocksData);

    console.log(`✅ 找到 ${uniqueTokens.length} 个唯一图片token (总计 ${imageInfo.length} 张图片引用)\n`);

    console.log('🔑 获取访问令牌...');
    const token = await getTenantAccessToken();
    console.log('✅ 访问令牌获取成功\n');

    console.log(`📥 开始批量获取图片URL (共 ${uniqueTokens.length} 个)...\n`);

    const imageUrlMap = {};
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < uniqueTokens.length; i++) {
      const fileToken = uniqueTokens[i];
      const progress = i + 1;

      try {
        process.stdout.write(`\r[${progress}/${uniqueTokens.length}] 获取中... ${fileToken.substring(0, 20)}...`);

        const url = await getImageUrl(token, fileToken);

        if (url) {
          imageUrlMap[fileToken] = url;
          successCount++;
        } else {
          imageUrlMap[fileToken] = null;
          failCount++;
        }

        // API限流延迟
        if (progress < uniqueTokens.length) {
          await sleep(DELAY_BETWEEN_REQUESTS);
        }

      } catch (error) {
        console.log(`\n  ❌ ${fileToken}: ${error.message}`);
        imageUrlMap[fileToken] = null;
        failCount++;
      }
    }

    console.log('\n');
    console.log('✨ 批量获取完成!');
    console.log(`📊 统计:`);
    console.log(`   ✅ 成功: ${successCount}个`);
    console.log(`   ❌ 失败/不存在: ${failCount}个`);

    // 保存结果
    const output = {
      timestamp: new Date().toISOString(),
      totalTokens: uniqueTokens.length,
      successCount: successCount,
      failCount: failCount,
      note: '飞书图片URL为临时URL,有效期约24小时,需定期刷新',
      imageUrlMap: imageUrlMap,
      imageInfo: imageInfo
    };

    const outputPath = './assets/data/image-urls.json';
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

    console.log(`💾 保存到: ${outputPath}`);

    console.log('\n⚠️  重要提示:');
    console.log('   飞书返回的图片URL是临时URL,有效期约24小时');
    console.log('   建议定期刷新或考虑下载到本地/CDN');

    console.log('\n📝 下一步:');
    console.log('   node scripts/create-rich-renderer.js');

  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  }
}

// 运行
main();
