// 验证D1中Sheet数据的完整性
async function verifySheets() {
  console.log('🔍 验证D1数据库中的Sheet数据\n');

  const query = `
    SELECT 
      title,
      content_length,
      CASE
        WHEN content_length > 10000 THEN '✅ 非常完整'
        WHEN content_length > 1000 THEN '✅ 完整'
        WHEN content_length > 500 THEN '⚠️ 部分数据'
        ELSE '❌ 仅元数据'
      END as status
    FROM knowledge_base_nodes
    WHERE obj_type = 'sheet'
    ORDER BY content_length DESC;
  `;

  const cmd = `npx wrangler d1 execute svtr-production --remote --command="${query.replace(/\n/g, ' ')}"`;

  const { execSync } = require('child_process');
  const result = execSync(cmd, { encoding: 'utf8' });
  console.log(result);
}

verifySheets();
