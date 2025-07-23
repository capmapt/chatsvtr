#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ASSETS_DIR = path.join(__dirname, '../assets');
const BACKUP_DIR = path.join(__dirname, '../assets/backup');

// 确保备份目录存在
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const filesToProcess = [
  {
    type: 'css',
    input: 'assets/css/style.css',
    output: 'assets/css/style-optimized.css',
    backup: 'backup/style.css'
  },
  {
    type: 'css', 
    input: 'assets/css/chat.css',
    output: 'assets/css/chat-optimized.css',
    backup: 'backup/chat.css'
  },
  {
    type: 'js',
    input: 'assets/js/main.js',
    output: 'assets/js/main-optimized.js', 
    backup: 'backup/main.js'
  },
  {
    type: 'js',
    input: 'assets/js/chat.js',
    output: 'assets/js/chat-optimized.js',
    backup: 'backup/chat.js'
  },
  {
    type: 'js',
    input: 'assets/js/i18n.js',
    output: 'assets/js/i18n-optimized.js',
    backup: 'backup/i18n.js'
  }
];

function getFileSize(filePath) {
  if (fs.existsSync(filePath)) {
    return fs.statSync(filePath).size;
  }
  return 0;
}

function formatSize(bytes) {
  return (bytes / 1024).toFixed(1) + 'KB';
}

async function processFiles() {
  console.log('🔧 开始压缩CSS和JS文件...\n');
  
  let totalOriginalSize = 0;
  let totalMinifiedSize = 0;
  
  for (const file of filesToProcess) {
    const inputPath = path.resolve(file.input);
    const outputPath = path.resolve(file.output);
    const backupPath = path.resolve(path.join(ASSETS_DIR, file.backup));
    
    if (!fs.existsSync(inputPath)) {
      console.log(`⚠️  跳过不存在的文件: ${file.input}`);
      continue;
    }
    
    try {
      // 备份原始文件
      if (!fs.existsSync(backupPath)) {
        fs.copyFileSync(inputPath, backupPath);
        console.log(`✅ 已备份: ${file.input} → ${file.backup}`);
      }
      
      const originalSize = getFileSize(inputPath);
      totalOriginalSize += originalSize;
      
      if (file.type === 'css') {
        // 使用clean-css压缩CSS
        execSync(`npx cleancss -O2 --source-map --output "${outputPath}" "${inputPath}"`, {
          stdio: 'pipe'
        });
      } else if (file.type === 'js') {
        // 使用terser压缩JS
        execSync(`npx terser "${inputPath}" -o "${outputPath}" --compress --mangle --source-map`, {
          stdio: 'pipe'
        });
      }
      
      const minifiedSize = getFileSize(outputPath);
      totalMinifiedSize += minifiedSize;
      const reduction = ((originalSize - minifiedSize) / originalSize * 100).toFixed(1);
      
      console.log(`🎯 ${path.basename(file.input)} → ${path.basename(file.output)}`);
      console.log(`   原始大小: ${formatSize(originalSize)}`);
      console.log(`   压缩后: ${formatSize(minifiedSize)}`);
      console.log(`   减少: ${reduction}%\n`);
      
    } catch (error) {
      console.error(`❌ 压缩失败 ${file.input}:`, error.message);
    }
  }
  
  const totalReduction = ((totalOriginalSize - totalMinifiedSize) / totalOriginalSize * 100).toFixed(1);
  console.log('📊 总体压缩效果:');
  console.log(`   原始总大小: ${formatSize(totalOriginalSize)}`);
  console.log(`   压缩后总大小: ${formatSize(totalMinifiedSize)}`);
  console.log(`   总计减少: ${formatSize(totalOriginalSize - totalMinifiedSize)} (${totalReduction}%)`);
  console.log('\n🎉 CSS/JS压缩完成！');
}

processFiles().catch(console.error);