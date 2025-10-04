/**
 * 获取飞书文档的富文本内容(包括图片、表格、格式等)
 * 使用飞书文档 Blocks API
 */

const https = require('https');
const fs = require('fs');

// 飞书应用配置
const FEISHU_APP_ID = 'cli_a8e2014cbe7d9013';
const FEISHU_APP_SECRET = 'tysHBj6njxwafO92dwO1DdttVvqvesf0';

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

    console.log(`  已获取 ${allBlocks.length} 个块...`);
  }

  return allBlocks;
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log('🔑 获取访问令牌...');
    const token = await getTenantAccessToken();
    console.log('✅ 访问令牌获取成功\n');

    // 读取现有的文章数据
    const articlesData = JSON.parse(fs.readFileSync('./assets/data/community-articles-v2.json', 'utf-8'));

    console.log(`📚 共有 ${articlesData.articles.length} 篇文章需要获取富文本内容\n`);

    // 测试获取第一篇文章的富文本内容
    const testArticle = articlesData.articles[0];
    console.log(`\n📄 测试获取文章: ${testArticle.title}`);
    console.log(`   文档ID: ${testArticle.id}\n`);

    // 从source URL中提取文档ID
    if (testArticle.source && testArticle.source.url) {
      const urlMatch = testArticle.source.url.match(/\/docx\/([a-zA-Z0-9_-]+)/);
      if (urlMatch) {
        const docId = urlMatch[1];
        console.log(`   提取到文档ID: ${docId}`);

        console.log(`\n🔍 获取文档块...`);
        const blocks = await getAllBlocks(token, docId);

        console.log(`\n✅ 成功获取 ${blocks.length} 个块`);
        console.log('\n📊 块类型统计:');

        const blockTypes = {};
        blocks.forEach(block => {
          const type = block.block_type;
          blockTypes[type] = (blockTypes[type] || 0) + 1;
        });

        Object.entries(blockTypes).forEach(([type, count]) => {
          console.log(`   ${type}: ${count}`);
        });

        // 保存第一篇文章的富文本内容作为示例
        const output = {
          articleId: testArticle.id,
          title: testArticle.title,
          documentId: docId,
          blocksCount: blocks.length,
          blockTypes: blockTypes,
          blocks: blocks
        };

        fs.writeFileSync(
          './assets/data/sample-rich-content.json',
          JSON.stringify(output, null, 2)
        );

        console.log('\n💾 示例富文本内容已保存到 assets/data/sample-rich-content.json');
        console.log('\n📝 下一步:');
        console.log('   1. 检查 sample-rich-content.json 了解块结构');
        console.log('   2. 编写富文本渲染逻辑');
        console.log('   3. 批量获取所有文章的富文本内容');

      } else {
        console.log('❌ 无法从URL中提取文档ID');
      }
    } else {
      console.log('❌ 文章没有来源URL');
    }

  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  }
}

main();
