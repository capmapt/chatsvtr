const https = require('https');

// 检查第一篇文章的完整数据
const nodeToken = 'SYdxw5P8kiYOGzklwXCcBt7mnSe';

console.log('🔍 检查文章在D1中的数据:\n');

// 1. 检查 published_articles 表
const checkPublishedArticles = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '1b644a13.chatsvtr.pages.dev',
      path: `/api/d1/query?table=published_articles&filters=node_token:${nodeToken}`,
      method: 'GET',
      headers: { 'User-Agent': 'Node.js' }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('📊 published_articles 表:');
          if (result.success && result.data.length > 0) {
            const article = result.data[0];
            console.log(`   ✅ 找到记录`);
            console.log(`   meta_title: ${article.meta_title}`);
            console.log(`   node_token: ${article.node_token}`);
            console.log(`   content_summary: ${article.content_summary?.substring(0, 100)}...`);
            console.log(`   full_content长度: ${article.full_content?.length || 0} 字符`);
            console.log(`   published_url: ${article.published_url}`);
            console.log('');
          } else {
            console.log('   ❌ 未找到记录');
          }
          resolve();
        } catch (e) {
          console.error('   ❌ 解析失败:', e.message);
          resolve();
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
};

// 2. 检查 knowledge_base_nodes 表
const checkKnowledgeBase = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '1b644a13.chatsvtr.pages.dev',
      path: `/api/d1/query?table=knowledge_base_nodes&filters=node_token:${nodeToken}`,
      method: 'GET',
      headers: { 'User-Agent': 'Node.js' }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('📚 knowledge_base_nodes 表:');
          if (result.success && result.data.length > 0) {
            const node = result.data[0];
            console.log(`   ✅ 找到记录`);
            console.log(`   title: ${node.title}`);
            console.log(`   node_token: ${node.node_token}`);
            console.log(`   obj_type: ${node.obj_type}`);
            console.log(`   obj_token: ${node.obj_token}`);
            console.log(`   full_content长度: ${node.full_content?.length || 0} 字符`);
            console.log(`   content_summary: ${node.content_summary?.substring(0, 100)}...`);
            console.log('');
          } else {
            console.log('   ❌ 未找到记录');
          }
          resolve();
        } catch (e) {
          console.error('   ❌ 解析失败:', e.message);
          resolve();
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
};

// 执行检查
(async () => {
  try {
    await checkPublishedArticles();
    await checkKnowledgeBase();

    console.log('💡 结论:');
    console.log('   - 如果两个表都有记录但full_content为空，说明内容未同步');
    console.log('   - 如果knowledge_base_nodes没有记录，说明node_token不匹配');
    console.log('   - Wiki页面需要从knowledge_base_nodes表获取full_content');
  } catch (e) {
    console.error('❌ 检查失败:', e.message);
  }
})();
