#!/usr/bin/env node

/**
 * SVTR.AI SEO Analysis and Monitoring Script
 * 分析网站SEO状况并生成优化建议
 */

const fs = require('fs');
const path = require('path');

class SEOAnalyzer {
  constructor() {
    this.issues = [];
    this.recommendations = [];
    this.score = 0;
  }

  analyzeHTML(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);
    
    console.log(`🔍 分析 ${fileName}...`);
    
    // 检查基础SEO元素
    this.checkTitle(content, fileName);
    this.checkMetaDescription(content, fileName);
    this.checkHeadings(content, fileName);
    this.checkImages(content, fileName);
    this.checkLinks(content, fileName);
    this.checkStructuredData(content, fileName);
    this.checkPerformance(content, fileName);
    
    return {
      file: fileName,
      issues: this.issues,
      recommendations: this.recommendations,
      score: this.calculateScore()
    };
  }
  
  checkTitle(content, fileName) {
    const titleMatch = content.match(/<title[^>]*>(.*?)<\/title>/i);
    if (!titleMatch) {
      this.issues.push(`❌ ${fileName}: 缺少页面标题`);
    } else {
      const title = titleMatch[1];
      if (title.length < 30) {
        this.issues.push(`⚠️ ${fileName}: 标题过短 (${title.length}字符，建议30-60字符)`);
      } else if (title.length > 60) {
        this.issues.push(`⚠️ ${fileName}: 标题过长 (${title.length}字符，建议30-60字符)`);
      } else {
        this.score += 10;
      }
      
      // 检查是否包含关键词
      const aiKeywords = ['AI', '创投', 'SVTR', '人工智能', '投资'];
      const hasKeywords = aiKeywords.some(keyword => title.includes(keyword));
      if (hasKeywords) {
        this.score += 5;
      } else {
        this.recommendations.push(`💡 ${fileName}: 建议在标题中包含核心关键词`);
      }
    }
  }
  
  checkMetaDescription(content, fileName) {
    const descMatch = content.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i);
    if (!descMatch) {
      this.issues.push(`❌ ${fileName}: 缺少meta description`);
    } else {
      const desc = descMatch[1];
      if (desc.length < 120) {
        this.issues.push(`⚠️ ${fileName}: 描述过短 (${desc.length}字符，建议120-160字符)`);
      } else if (desc.length > 160) {
        this.issues.push(`⚠️ ${fileName}: 描述过长 (${desc.length}字符，建议120-160字符)`);
      } else {
        this.score += 10;
      }
    }
  }
  
  checkHeadings(content, fileName) {
    const h1Count = (content.match(/<h1[^>]*>/gi) || []).length;
    if (h1Count === 0) {
      this.issues.push(`❌ ${fileName}: 缺少H1标题`);
    } else if (h1Count > 1) {
      this.issues.push(`⚠️ ${fileName}: 多个H1标题 (${h1Count}个，建议只有1个)`);
    } else {
      this.score += 5;
    }
    
    // 检查标题层级结构
    const headings = content.match(/<h[1-6][^>]*>/gi) || [];
    if (headings.length > 0) {
      this.score += 5;
    }
  }
  
  checkImages(content, fileName) {
    const imgTags = content.match(/<img[^>]*>/gi) || [];
    let missingAlt = 0;
    
    imgTags.forEach(img => {
      if (!img.includes('alt=')) {
        missingAlt++;
      }
    });
    
    if (missingAlt > 0) {
      this.issues.push(`⚠️ ${fileName}: ${missingAlt}个图片缺少alt属性`);
    } else if (imgTags.length > 0) {
      this.score += 5;
    }
    
    // 检查WebP格式使用
    const webpCount = (content.match(/\.webp/gi) || []).length;
    if (webpCount > 0) {
      this.score += 3;
      this.recommendations.push(`✅ ${fileName}: 使用了${webpCount}个WebP图片，有利于性能`);
    }
  }
  
  checkLinks(content, fileName) {
    const externalLinks = content.match(/<a[^>]*href=["']https?:\/\/[^"']*["'][^>]*>/gi) || [];
    let noRelLinks = 0;
    
    externalLinks.forEach(link => {
      if (!link.includes('rel=')) {
        noRelLinks++;
      }
    });
    
    if (noRelLinks > 0) {
      this.recommendations.push(`💡 ${fileName}: ${noRelLinks}个外部链接建议添加rel属性`);
    }
  }
  
  checkStructuredData(content, fileName) {
    const jsonLdCount = (content.match(/<script[^>]*type=["']application\/ld\+json["']/gi) || []).length;
    if (jsonLdCount > 0) {
      this.score += 10;
      this.recommendations.push(`✅ ${fileName}: 包含${jsonLdCount}个结构化数据`);
    } else {
      this.recommendations.push(`💡 ${fileName}: 建议添加JSON-LD结构化数据`);
    }
    
    // 检查Open Graph
    const ogTags = (content.match(/<meta[^>]*property=["']og:[^"']*["']/gi) || []).length;
    if (ogTags > 0) {
      this.score += 5;
    } else {
      this.recommendations.push(`💡 ${fileName}: 建议添加Open Graph标签`);
    }
  }
  
  checkPerformance(content, fileName) {
    // 检查预加载资源
    const preloadCount = (content.match(/<link[^>]*rel=["']preload["']/gi) || []).length;
    if (preloadCount > 0) {
      this.score += 3;
    }
    
    // 检查压缩优化
    const minifiedCSS = content.includes('style-optimized.css');
    const minifiedJS = content.includes('chat-optimized.js');
    
    if (minifiedCSS || minifiedJS) {
      this.score += 5;
      this.recommendations.push(`✅ ${fileName}: 使用了优化压缩的资源`);
    }
  }
  
  calculateScore() {
    return Math.min(100, this.score);
  }
  
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalScore: this.calculateScore(),
        totalIssues: this.issues.length,
        totalRecommendations: this.recommendations.length
      },
      issues: this.issues,
      recommendations: this.recommendations,
      grading: this.getGrading(this.calculateScore())
    };
    
    return report;
  }
  
  getGrading(score) {
    if (score >= 90) return '🏆 优秀';
    if (score >= 80) return '🥇 良好';
    if (score >= 70) return '🥈 中等';
    if (score >= 60) return '🥉 及格';
    return '❌ 需要改进';
  }
}

// 主执行函数
function main() {
  console.log('🚀 SVTR.AI SEO分析开始...\n');
  
  const analyzer = new SEOAnalyzer();
  const htmlFiles = [
    'index.html',
    'pages/ai-weekly.html',
    'pages/trading-picks.html',
    'pages/ai-100.html',
    'pages/stats-widget.html',
    'pages/sync-dashboard.html'
  ];
  
  const results = [];
  
  htmlFiles.forEach(file => {
    const fullPath = path.join(__dirname, '..', file);
    if (fs.existsSync(fullPath)) {
      const result = analyzer.analyzeHTML(fullPath);
      results.push(result);
    } else {
      console.log(`⚠️ 文件不存在: ${file}`);
    }
  });
  
  // 生成总体报告
  const finalReport = analyzer.generateReport();
  
  console.log('\n📊 SEO分析报告');
  console.log('================');
  console.log(`总体评分: ${finalReport.summary.totalScore}/100 ${finalReport.grading}`);
  console.log(`发现问题: ${finalReport.summary.totalIssues}个`);
  console.log(`优化建议: ${finalReport.summary.totalRecommendations}个\n`);
  
  if (finalReport.issues.length > 0) {
    console.log('🚨 需要修复的问题:');
    finalReport.issues.forEach(issue => console.log(issue));
    console.log('');
  }
  
  if (finalReport.recommendations.length > 0) {
    console.log('💡 优化建议:');
    finalReport.recommendations.forEach(rec => console.log(rec));
  }
  
  // 保存报告
  const reportPath = path.join(__dirname, '..', 'seo-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(finalReport, null, 2));
  console.log(`\n📄 详细报告已保存至: ${reportPath}`);
  
  console.log('\n🎯 核心优化建议:');
  console.log('1. 确保所有页面都有独特的title和description');
  console.log('2. 添加完整的结构化数据(JSON-LD)');
  console.log('3. 优化图片alt属性和WebP格式');
  console.log('4. 实施多语言hreflang标记');
  console.log('5. 监控Core Web Vitals指标');
  console.log('6. 定期更新sitemap.xml');
}

if (require.main === module) {
  main();
}

module.exports = { SEOAnalyzer };