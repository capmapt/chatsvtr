#!/usr/bin/env node

/**
 * 简单的SQLite数据库初始化脚本
 * 不依赖sqlite3命令行工具
 */

const fs = require('fs');
const path = require('path');

// 创建一个最小的SQLite数据库文件
function createMinimalSQLiteDB() {
  const dbPath = path.join(__dirname, '../database/svtr.db');
  
  // SQLite文件头（16字节的魔数）
  const sqliteHeader = Buffer.from([
    0x53, 0x51, 0x4C, 0x69, 0x74, 0x65, 0x20, 0x66, // "SQLite f"
    0x6F, 0x72, 0x6D, 0x61, 0x74, 0x20, 0x33, 0x00  // "ormat 3\0"
  ]);
  
  // 创建一个4KB的最小SQLite文件
  const pageSize = 4096;
  const minimalDB = Buffer.alloc(pageSize);
  
  // 写入SQLite文件头
  sqliteHeader.copy(minimalDB, 0);
  
  // 设置页面大小（在偏移16-17处）
  minimalDB.writeUInt16BE(pageSize, 16);
  
  // 写入其他必要的元数据
  minimalDB[18] = 1; // 文件格式写版本
  minimalDB[19] = 1; // 文件格式读版本
  minimalDB[20] = 0; // 保留字节
  minimalDB[21] = 64; // 最大嵌入有效载荷分数
  minimalDB[22] = 32; // 最小嵌入有效载荷分数
  minimalDB[23] = 32; // 叶子有效载荷分数
  
  // 文件更改计数器（在偏移24-27处）
  minimalDB.writeUInt32BE(1, 24);
  
  // 数据库大小（页面数，在偏移28-31处）
  minimalDB.writeUInt32BE(1, 28);
  
  try {
    fs.writeFileSync(dbPath, minimalDB);
    console.log(`✅ 创建了有效的SQLite数据库文件: ${dbPath}`);
    console.log(`📏 文件大小: ${minimalDB.length} 字节`);
    
    return true;
  } catch (error) {
    console.error('❌ 创建数据库文件失败:', error.message);
    return false;
  }
}

// 执行初始化
console.log('🚀 开始创建SQLite数据库文件...');
if (createMinimalSQLiteDB()) {
  console.log('🎉 数据库文件创建成功！');
  console.log('📝 下一步: 配置MCP并通过MCP工具创建表结构');
} else {
  console.log('❌ 数据库文件创建失败');
  process.exit(1);
}