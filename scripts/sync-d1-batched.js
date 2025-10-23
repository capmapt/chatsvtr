#!/usr/bin/env node

/**
 * 分批同步数据到D1数据库
 * 解决SQLITE_TOOBIG错误
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function syncInBatches() {
  console.log('📦 分批同步数据到D1数据库\n');

  const sqlFile = path.join(__dirname, '../database/sync-data-cleaned.sql');
  const content = fs.readFileSync(sqlFile, 'utf8');

  // 按INSERT语句分割
  const statements = content
    .split('\n\n')
    .filter(s => s.trim().length > 0);

  console.log(`总语句数: ${statements.length}`);
  console.log(`SQL文件大小: ${(fs.statSync(sqlFile).size / 1024 / 1024).toFixed(2)} MB\n`);

  // 分批大小（每批20个语句）
  const BATCH_SIZE = 20;
  const totalBatches = Math.ceil(statements.length / BATCH_SIZE);

  console.log(`将分 ${totalBatches} 批执行\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < totalBatches; i++) {
    const start = i * BATCH_SIZE;
    const end = Math.min((i + 1) * BATCH_SIZE, statements.length);
    const batchStatements = statements.slice(start, end);

    console.log(`📝 执行第 ${i + 1}/${totalBatches} 批 (${start + 1}-${end}/${statements.length})...`);

    // 创建临时批次SQL文件
    const batchFile = path.join(__dirname, `../database/batch-${i}.sql`);
    fs.writeFileSync(batchFile, batchStatements.join('\n\n'), 'utf8');

    try {
      const result = execSync(
        `npx wrangler d1 execute svtr-production --remote --file="${batchFile}"`,
        { encoding: 'utf8', stdio: 'pipe' }
      );

      if (result.includes('success')) {
        console.log(`   ✅ 成功`);
        successCount++;
      }
    } catch (error) {
      console.log(`   ❌ 失败: ${error.message.substring(0, 100)}`);
      errorCount++;
    } finally {
      // 删除临时文件
      try {
        fs.unlinkSync(batchFile);
      } catch (e) {}
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 同步结果:');
  console.log(`   成功批次: ${successCount}/${totalBatches}`);
  console.log(`   失败批次: ${errorCount}/${totalBatches}`);
  console.log('='.repeat(60));
}

syncInBatches().catch(console.error);
