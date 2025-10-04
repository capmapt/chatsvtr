/**
 * 批量获取所有文章的富文本内容(Blocks数据)
 * 包括段落、标题、列表、图片、表格等
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// 飞书应用配置
const FEISHU_APP_ID = 'cli_a8e2014cbe7d9013';
const FEISHU_APP_SECRET = 'tysHBj6njxwafO92dwO1DdttVvqvesf0';

// API限流配置
const DELAY_BETWEEN_REQUESTS = 200; // 每个请求间隔200ms,避免触发限流

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
 * 获取文档的所有块(Blocks)
 */
async function getDocumentBlocks(token, documentId, pageToken = null) {
  return new Promise((resolve, reject) => {
    let path = `/open-apis/docx/v1/documents/${documentId}/blocks?page_size=500`;
    if (pageToken) {
      path += `&page_token=${pageToken}`;
    }

    const options = {
      hostname: 'open.feishu.cn',
      port: 443,
      path: path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.code === 0) {
            resolve(result.data);
          } else {
            reject(new Error(`获取文档块失败: ${result.msg}`));
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

/**
 * 递归获取所有块
 */
async function getAllBlocks(token, documentId) {
  const allBlocks = [];
  let pageToken = null;
  let hasMore = true;

  while (hasMore) {
    const data = await getDocumentBlocks(token, documentId, pageToken);
    allBlocks.push(...data.items);

    hasMore = data.has_more;
    pageToken = data.page_token;
  }

  return allBlocks;
}

/**
 * 从URL提取文档ID
 */
function extractDocIdFromUrl(url) {
  const match = url.match(/\/docx\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

/**
 * 统计块类型
 */
function countBlockTypes(blocks) {
  const counts = {};
  blocks.forEach(block => {
    const type = block.block_type;
    counts[type] = (counts[type] || 0) + 1;
  });
  return counts;
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log('🔑 获取访问令牌...');
    const token = await getTenantAccessToken();
    console.log('✅ 访问令牌获取成功\n');

    // 读取文章数据
    const articlesData = JSON.parse(
      fs.readFileSync('./assets/data/community-articles-v2.json', 'utf-8')
    );

    console.log(`📚 共有 ${articlesData.articles.length} 篇文章需要获取富文本内容\n`);

    const results = {
      timestamp: new Date().toISOString(),
      totalArticles: articlesData.articles.length,
      successCount: 0,
      failCount: 0,
      articles: []
    };

    // 批量获取
    for (let i = 0; i < articlesData.articles.length; i++) {
      const article = articlesData.articles[i];
      const articleNum = i + 1;

      console.log(`\n[${articleNum}/${articlesData.articles.length}] ${article.title}`);

      try {
        // 提取文档ID
        if (!article.source || !article.source.url) {
          console.log('  ⚠️  跳过: 没有来源URL');
          results.failCount++;
          continue;
        }

        const docId = extractDocIdFromUrl(article.source.url);
        if (!docId) {
          console.log('  ⚠️  跳过: 无法提取文档ID');
          results.failCount++;
          continue;
        }

        console.log(`  📄 文档ID: ${docId}`);

        // 获取文档blocks
        const blocks = await getAllBlocks(token, docId);
        const blockTypes = countBlockTypes(blocks);

        console.log(`  ✅ 获取成功: ${blocks.length}个块`);

        // 统计特殊块
        const imageCount = blockTypes[27] || 0;
        const tableCount = blockTypes[30] || 0;
        if (imageCount > 0) console.log(`     🖼️  ${imageCount}张图片`);
        if (tableCount > 0) console.log(`     📊 ${tableCount}个表格`);

        // 保存结果
        results.articles.push({
          id: article.id,
          title: article.title,
          documentId: docId,
          blocksCount: blocks.length,
          blockTypes: blockTypes,
          hasImages: imageCount > 0,
          hasTables: tableCount > 0,
          blocks: blocks
        });

        results.successCount++;

        // API限流延迟
        if (articleNum < articlesData.articles.length) {
          await sleep(DELAY_BETWEEN_REQUESTS);
        }

      } catch (error) {
        console.log(`  ❌ 失败: ${error.message}`);
        results.failCount++;
      }
    }

    // 保存结果
    const outputPath = './assets/data/articles-rich-blocks.json';
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

    console.log('\n\n✨ 批量获取完成!');
    console.log(`📊 统计:`);
    console.log(`   ✅ 成功: ${results.successCount}篇`);
    console.log(`   ❌ 失败: ${results.failCount}篇`);
    console.log(`   💾 保存到: ${outputPath}`);

    // 统计汇总
    const totalImages = results.articles.reduce((sum, a) => sum + (a.blockTypes[27] || 0), 0);
    const totalTables = results.articles.reduce((sum, a) => sum + (a.blockTypes[30] || 0), 0);
    const totalBlocks = results.articles.reduce((sum, a) => sum + a.blocksCount, 0);

    console.log(`\n📈 内容统计:`);
    console.log(`   📦 总块数: ${totalBlocks}`);
    console.log(`   🖼️  总图片: ${totalImages}张`);
    console.log(`   📊 总表格: ${totalTables}个`);

    console.log('\n📝 下一步:');
    console.log('   node scripts/fetch-image-urls.js');

  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  }
}

// 运行
main();
