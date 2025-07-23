#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { promisify } = require('util');

const gzip = promisify(zlib.gzip);

const filesToCompress = [
  'assets/css/style-optimized.css',
  'assets/css/chat-optimized.css',
  'assets/js/main-optimized.js',
  'assets/js/chat-optimized.js',
  'assets/js/i18n-optimized.js',
  'assets/js/translations.js',
  'index.html'
];

async function createGzipFiles() {
  console.log('🗜️  创建预压缩Gzip文件...\n');
  
  for (const filePath of filesToCompress) {
    const fullPath = path.resolve(filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  跳过不存在的文件: ${filePath}`);
      continue;
    }
    
    try {
      const data = fs.readFileSync(fullPath);
      const compressed = await gzip(data, { level: 9 });
      const gzipPath = fullPath + '.gz';
      
      fs.writeFileSync(gzipPath, compressed);
      
      const originalSize = data.length;
      const compressedSize = compressed.length;
      const reduction = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
      
      console.log(`✅ ${filePath}`);
      console.log(`   原始: ${(originalSize / 1024).toFixed(1)}KB`);
      console.log(`   Gzip: ${(compressedSize / 1024).toFixed(1)}KB`);
      console.log(`   压缩率: ${reduction}%\n`);
      
    } catch (error) {
      console.error(`❌ 压缩失败 ${filePath}:`, error.message);
    }
  }
  
  console.log('🎉 Gzip预压缩文件创建完成！');
}

createGzipFiles().catch(console.error);