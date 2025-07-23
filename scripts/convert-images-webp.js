#!/usr/bin/env node

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, '../assets/images');
const BACKUP_DIR = path.join(__dirname, '../assets/images/backup');

// 确保备份目录存在
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const images = [
  { input: 'banner.png', output: 'banner.webp' },
  { input: 'logo.jpg', output: 'logo.webp' },
  { input: 'qr-code.jpg', output: 'qr-code.webp' }
];

async function convertImages() {
  console.log('🖼️  开始转换图片为WebP格式...\n');
  
  for (const image of images) {
    const inputPath = path.join(IMAGES_DIR, image.input);
    const outputPath = path.join(IMAGES_DIR, image.output);
    const backupPath = path.join(BACKUP_DIR, image.input);
    
    try {
      // 备份原始文件
      if (fs.existsSync(inputPath) && !fs.existsSync(backupPath)) {
        fs.copyFileSync(inputPath, backupPath);
        console.log(`✅ 已备份: ${image.input} → backup/${image.input}`);
      }
      
      // 获取原始文件大小
      const originalStats = fs.statSync(inputPath);
      const originalSize = originalStats.size;
      
      // 转换为WebP
      await sharp(inputPath)
        .webp({ 
          quality: 85,  // 高质量，平衡文件大小和图片质量
          effort: 6     // 更好的压缩效果
        })
        .toFile(outputPath);
      
      // 获取WebP文件大小
      const webpStats = fs.statSync(outputPath);
      const webpSize = webpStats.size;
      const reduction = ((originalSize - webpSize) / originalSize * 100).toFixed(1);
      
      console.log(`🎯 ${image.input} → ${image.output}`);
      console.log(`   原始大小: ${(originalSize / 1024).toFixed(1)}KB`);
      console.log(`   WebP大小: ${(webpSize / 1024).toFixed(1)}KB`);
      console.log(`   减少: ${reduction}%\n`);
      
    } catch (error) {
      console.error(`❌ 转换失败 ${image.input}:`, error.message);
    }
  }
  
  console.log('🎉 图片转换完成！');
}

convertImages().catch(console.error);