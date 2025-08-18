#!/usr/bin/env node

/**
 * 多平台内容转换引擎
 * 将飞书内容转换为各社交平台适合的格式
 */

const MetadataExtractor = require('./metadata-extractor');

class ContentTransformer {
  constructor() {
    this.metadataExtractor = new MetadataExtractor();
    
    // 各平台内容规格
    this.platformSpecs = {
      wechat: {
        titleMaxLength: 64,
        contentMaxLength: 20000,
        imageWidth: 900,
        imageHeight: 500,
        supportedFormats: ['jpg', 'png', 'gif']
      },
      linkedin: {
        titleMaxLength: 150,
        contentMaxLength: 3000,
        articleMaxLength: 125000,
        imageWidth: 1200,
        imageHeight: 627,
        supportedFormats: ['jpg', 'png']
      },
      twitter: {
        tweetMaxLength: 280,
        threadMaxTweets: 25,
        imageWidth: 1024,
        imageHeight: 512,
        supportedFormats: ['jpg', 'png', 'gif']
      },
      xiaohongshu: {
        titleMaxLength: 20,
        contentMaxLength: 1000,
        imageWidth: 1080,
        imageHeight: 1080,
        maxImages: 9
      }
    };
  }

  /**
   * 转换为微信公众号格式
   */
  async toWechatFormat(feishuContent) {
    console.log('📱 转换为微信公众号格式...');
    
    const metadata = this.metadataExtractor.extractMetadata(feishuContent);
    
    return {
      title: this.optimizeWechatTitle(metadata.title),
      content: this.convertToWechatHTML(feishuContent.content, metadata),
      summary: metadata.metaDescription,
      coverImage: await this.processCoverImage(feishuContent.images?.[0], 'wechat'),
      tags: metadata.tags.slice(0, 5).map(t => t.tag), // 微信最多5个标签
      category: metadata.category,
      publishTime: this.getOptimalWechatTime(),
      seo: {
        title: metadata.seoTitle,
        description: metadata.metaDescription,
        keywords: metadata.keywords.slice(0, 8)
      },
      social: {
        shareTitle: metadata.socialTitle,
        shareDescription: metadata.metaDescription.substring(0, 120)
      },
      metadata: {
        wordCount: metadata.wordCount,
        readingTime: metadata.estimatedReadingTime,
        originalId: feishuContent.node_token
      }
    };
  }

  /**
   * 优化微信公众号标题
   */
  optimizeWechatTitle(title) {
    let wechatTitle = title;
    
    // 微信标题优化策略
    const titleEnhancers = [
      // 添加吸引眼球的前缀
      { pattern: /^AI/, replacement: '🤖 AI' },
      { pattern: /^投资/, replacement: '💰 投资' },
      { pattern: /^创业/, replacement: '🚀 创业' },
      { pattern: /^分析/, replacement: '📊 深度分析' },
      { pattern: /^报告/, replacement: '📋 重磅报告' }
    ];

    titleEnhancers.forEach(enhancer => {
      if (enhancer.pattern.test(wechatTitle)) {
        wechatTitle = wechatTitle.replace(enhancer.pattern, enhancer.replacement);
      }
    });

    // 确保标题长度符合微信规范
    if (wechatTitle.length > this.platformSpecs.wechat.titleMaxLength) {
      wechatTitle = wechatTitle.substring(0, this.platformSpecs.wechat.titleMaxLength - 3) + '...';
    }

    return wechatTitle;
  }

  /**
   * 转换内容为微信HTML格式
   */
  convertToWechatHTML(content, metadata) {
    let htmlContent = content;
    
    // Markdown到HTML转换
    htmlContent = this.markdownToHTML(htmlContent);
    
    // 微信公众号样式优化
    const wechatStyles = {
      h1: 'style="color: #2c3e50; font-size: 24px; font-weight: bold; margin: 20px 0 15px 0; border-bottom: 2px solid #3498db; padding-bottom: 5px;"',
      h2: 'style="color: #34495e; font-size: 20px; font-weight: bold; margin: 18px 0 12px 0;"',
      h3: 'style="color: #7f8c8d; font-size: 18px; font-weight: bold; margin: 15px 0 10px 0;"',
      p: 'style="line-height: 1.8; margin: 12px 0; color: #2c3e50; text-align: justify;"',
      ul: 'style="line-height: 1.8; margin: 12px 0; padding-left: 20px;"',
      ol: 'style="line-height: 1.8; margin: 12px 0; padding-left: 20px;"',
      blockquote: 'style="border-left: 4px solid #3498db; padding: 10px 15px; margin: 15px 0; background: #f8f9fa; color: #555;"',
      strong: 'style="color: #e74c3c; font-weight: bold;"',
      em: 'style="color: #f39c12; font-style: italic;"'
    };

    // 应用微信样式
    Object.entries(wechatStyles).forEach(([tag, style]) => {
      const regex = new RegExp(`<${tag}(.*?)>`, 'g');
      htmlContent = htmlContent.replace(regex, `<${tag} ${style}>`);
    });

    // 添加文章开头和结尾
    const articleHeader = `
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="https://svtr.ai/assets/images/wechat-header.jpg" alt="SVTR Logo" style="width: 100%; max-width: 600px;" />
      </div>
    `;
    
    const articleFooter = `
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
      <div style="text-align: center; color: #95a5a6; font-size: 14px;">
        <p>📢 <strong>硅谷科技评论 (SVTR)</strong></p>
        <p>专注全球AI创投生态系统</p>
        <p>🔗 官网: <a href="https://svtr.ai" style="color: #3498db;">svtr.ai</a></p>
        <p>💬 加入微信群获取更多AI投资资讯</p>
      </div>
    `;

    return articleHeader + htmlContent + articleFooter;
  }

  /**
   * 转换为LinkedIn文章格式
   */
  async toLinkedInFormat(feishuContent) {
    console.log('💼 转换为LinkedIn文章格式...');
    
    const metadata = this.metadataExtractor.extractMetadata(feishuContent);
    
    return {
      title: this.optimizeLinkedInTitle(metadata.title),
      content: this.convertToLinkedInContent(feishuContent.content, metadata),
      visibility: 'PUBLIC',
      publishedAt: null, // 立即发布
      lifecycleState: 'PUBLISHED',
      commentary: this.generateLinkedInCommentary(metadata),
      hashtags: this.generateLinkedInHashtags(metadata),
      mentions: [], // TODO: 提取@提及的人
      media: await this.processLinkedInMedia(feishuContent.images),
      analytics: {
        expectedEngagement: this.predictLinkedInEngagement(metadata),
        targetAudience: this.identifyLinkedInAudience(metadata)
      },
      metadata: {
        originalId: feishuContent.node_token,
        category: metadata.category,
        tags: metadata.tags.slice(0, 10)
      }
    };
  }

  /**
   * 优化LinkedIn标题
   */
  optimizeLinkedInTitle(title) {
    let linkedinTitle = title;
    
    // LinkedIn标题优化（更专业的语调）
    const professionalPrefixes = {
      'AI投资': 'AI Investment Insights:',
      '创业': 'Startup Analysis:',
      '分析': 'Market Analysis:',
      '报告': 'Industry Report:',
      '趋势': 'Trend Analysis:'
    };

    Object.entries(professionalPrefixes).forEach(([chinese, english]) => {
      if (linkedinTitle.includes(chinese)) {
        linkedinTitle = linkedinTitle.replace(chinese, english);
      }
    });

    // 确保标题长度符合LinkedIn规范
    if (linkedinTitle.length > this.platformSpecs.linkedin.titleMaxLength) {
      linkedinTitle = linkedinTitle.substring(0, this.platformSpecs.linkedin.titleMaxLength - 3) + '...';
    }

    return linkedinTitle;
  }

  /**
   * 转换为LinkedIn内容格式
   */
  convertToLinkedInContent(content, metadata) {
    let linkedinContent = content;
    
    // LinkedIn内容结构优化
    const sections = this.parseContentSections(linkedinContent);
    
    let formattedContent = '';
    
    // 添加引人注目的开头
    formattedContent += `🎯 ${metadata.keyPoints[0] || '关键洞察'}\n\n`;
    
    // 主要内容（保持专业语调）
    formattedContent += this.professionalizeContent(linkedinContent);
    
    // 添加行动呼吁
    formattedContent += '\n\n💭 What are your thoughts on this trend? Share your insights in the comments.\n\n';
    
    // 添加SVTR品牌标识
    formattedContent += '🔗 Read more AI venture capital insights at svtr.ai\n\n';
    
    // 添加话题标签
    const hashtags = metadata.hashTags.slice(0, 5).join(' ');
    formattedContent += hashtags;
    
    // 确保内容长度符合LinkedIn规范
    if (formattedContent.length > this.platformSpecs.linkedin.articleMaxLength) {
      formattedContent = formattedContent.substring(0, this.platformSpecs.linkedin.articleMaxLength - 50) + '...\n\n[Continue reading at svtr.ai]';
    }
    
    return formattedContent;
  }

  /**
   * 转换为Twitter线程格式
   */
  async toTwitterFormat(feishuContent) {
    console.log('🐦 转换为Twitter线程格式...');
    
    const metadata = this.metadataExtractor.extractMetadata(feishuContent);
    const threads = metadata.tweetThread;
    
    return {
      threadTweets: threads.map((thread, index) => ({
        content: this.optimizeTwitterContent(thread.content),
        threadPosition: thread.threadNumber,
        totalThreads: thread.totalThreads,
        media: index === 0 ? feishuContent.images?.[0] : null, // 只在首条推文添加图片
        hashtags: index === 0 ? metadata.hashTags.slice(0, 3) : [], // 首条推文添加话题标签
        replyToTweetId: index > 0 ? 'previous_tweet_id' : null,
        scheduledAt: this.getOptimalTwitterTime(index)
      })),
      summary: {
        totalTweets: threads.length,
        estimatedEngagement: this.predictTwitterEngagement(metadata),
        category: metadata.category,
        originalId: feishuContent.node_token
      }
    };
  }

  /**
   * 优化Twitter内容
   */
  optimizeTwitterContent(content) {
    let twitterContent = content;
    
    // Twitter内容优化
    twitterContent = twitterContent
      .replace(/。+/g, '.') // 统一句号
      .replace(/\s+/g, ' ') // 合并空格
      .trim();
    
    // 确保内容长度符合Twitter规范（留出标签和链接空间）
    const maxLength = this.platformSpecs.twitter.tweetMaxLength - 30;
    if (twitterContent.length > maxLength) {
      twitterContent = twitterContent.substring(0, maxLength - 3) + '...';
    }
    
    return twitterContent;
  }

  /**
   * 转换为小红书格式
   */
  async toXiaohongshuFormat(feishuContent) {
    console.log('📱 转换为小红书格式...');
    
    const metadata = this.metadataExtractor.extractMetadata(feishuContent);
    
    return {
      title: this.optimizeXiaohongshuTitle(metadata.title),
      content: this.convertToXiaohongshuContent(feishuContent.content, metadata),
      images: await this.processXiaohongshuImages(feishuContent.images),
      tags: this.generateXiaohongshuTags(metadata),
      location: null, // 可选地理位置
      visibility: 'PUBLIC',
      allowComment: true,
      allowShare: true,
      metadata: {
        category: metadata.category,
        originalId: feishuContent.node_token,
        expectedViews: this.predictXiaohongshuViews(metadata)
      }
    };
  }

  /**
   * Markdown到HTML转换（简单版）
   */
  markdownToHTML(markdown) {
    return markdown
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/^\> (.*)$/gim, '<blockquote>$1</blockquote>')
      .replace(/\n\n/gim, '</p><p>')
      .replace(/^(.*)$/gim, '<p>$1</p>');
  }

  /**
   * 专业化内容语调
   */
  professionalizeContent(content) {
    return content
      .replace(/很/g, 'significantly')
      .replace(/非常/g, 'extremely')
      .replace(/应该/g, 'should consider')
      .replace(/可能/g, 'potentially');
  }

  /**
   * 获取最佳发布时间
   */
  getOptimalWechatTime() {
    // 微信公众号最佳发布时间：早上7-9点，晚上8-10点
    const now = new Date();
    const optimal = new Date(now);
    
    if (now.getHours() < 7) {
      optimal.setHours(8, 0, 0, 0);
    } else if (now.getHours() < 20) {
      optimal.setHours(20, 30, 0, 0);
    } else {
      // 明天早上8点
      optimal.setDate(optimal.getDate() + 1);
      optimal.setHours(8, 0, 0, 0);
    }
    
    return optimal.toISOString();
  }

  /**
   * 批量转换多个文档
   */
  async batchTransform(documents, platforms = ['wechat', 'linkedin', 'twitter']) {
    console.log(`🔄 开始批量转换 ${documents.length} 个文档到 ${platforms.length} 个平台...`);
    
    const results = [];
    
    for (const [index, doc] of documents.entries()) {
      console.log(`📄 (${index + 1}/${documents.length}) 处理文档: ${doc.title || 'Unknown'}`);
      
      const docResults = {
        originalId: doc.node_token,
        title: doc.title,
        platforms: {}
      };

      for (const platform of platforms) {
        try {
          let transformed;
          
          switch (platform) {
            case 'wechat':
              transformed = await this.toWechatFormat(doc);
              break;
            case 'linkedin':
              transformed = await this.toLinkedInFormat(doc);
              break;
            case 'twitter':
              transformed = await this.toTwitterFormat(doc);
              break;
            case 'xiaohongshu':
              transformed = await this.toXiaohongshuFormat(doc);
              break;
            default:
              throw new Error(`Unsupported platform: ${platform}`);
          }
          
          docResults.platforms[platform] = {
            success: true,
            content: transformed
          };
          
          console.log(`  ✅ ${platform} 转换成功`);
          
        } catch (error) {
          docResults.platforms[platform] = {
            success: false,
            error: error.message
          };
          
          console.error(`  ❌ ${platform} 转换失败:`, error.message);
        }
      }
      
      results.push(docResults);
    }
    
    // 生成转换报告
    const summary = this.generateTransformSummary(results, platforms);
    console.log('📊 批量转换完成:', summary);
    
    return {
      results,
      summary
    };
  }

  /**
   * 生成转换摘要报告
   */
  generateTransformSummary(results, platforms) {
    const totalDocs = results.length;
    const platformStats = {};
    
    platforms.forEach(platform => {
      const successful = results.filter(r => r.platforms[platform]?.success).length;
      const failed = totalDocs - successful;
      
      platformStats[platform] = {
        successful,
        failed,
        successRate: `${Math.round(successful / totalDocs * 100)}%`
      };
    });
    
    return {
      totalDocuments: totalDocs,
      platformStats,
      overallSuccessRate: `${Math.round(
        Object.values(platformStats).reduce((sum, stats) => sum + parseInt(stats.successRate), 0) / platforms.length
      )}%`
    };
  }

  // 预测模型（简化版本）
  predictLinkedInEngagement(metadata) {
    const baseScore = 50;
    let score = baseScore;
    
    // 基于内容类型调整
    if (metadata.category === 'AI投资') score += 20;
    if (metadata.category === '创业公司') score += 15;
    if (metadata.wordCount > 1000) score += 10;
    if (metadata.sentiment === 'positive') score += 5;
    
    return Math.min(100, Math.max(0, score));
  }

  predictTwitterEngagement(metadata) {
    const baseScore = 30;
    let score = baseScore;
    
    if (metadata.tweetThread.length > 1) score += 15; // 线程更容易获得互动
    if (metadata.hashTags.length > 3) score += 10;
    if (metadata.category === 'AI技术') score += 20;
    
    return Math.min(100, Math.max(0, score));
  }

  // 辅助方法
  generateLinkedInCommentary(metadata) {
    return `Insights from our latest analysis on ${metadata.category.toLowerCase()}. What are your thoughts on these trends?`;
  }

  generateLinkedInHashtags(metadata) {
    return metadata.hashTags.slice(0, 5);
  }

  identifyLinkedInAudience(metadata) {
    const audienceMap = {
      'AI投资': ['AI investors', 'VCs', 'startup founders'],
      'AI技术': ['AI engineers', 'tech leaders', 'researchers'],
      '创业公司': ['entrepreneurs', 'startup ecosystem', 'founders']
    };
    
    return audienceMap[metadata.category] || ['tech professionals'];
  }

  /**
   * 解析内容章节
   */
  parseContentSections(content) {
    const sections = [];
    const lines = content.split('\n');
    let currentSection = { title: '', content: '' };
    
    for (const line of lines) {
      if (line.startsWith('## ')) {
        if (currentSection.title || currentSection.content) {
          sections.push(currentSection);
        }
        currentSection = { title: line.replace('## ', ''), content: '' };
      } else if (line.trim()) {
        currentSection.content += line + '\n';
      }
    }
    
    if (currentSection.title || currentSection.content) {
      sections.push(currentSection);
    }
    
    return sections;
  }

  /**
   * 优化小红书标题
   */
  optimizeXiaohongshuTitle(title) {
    let xhsTitle = title;
    
    // 小红书标题通常更短更吸引人
    if (xhsTitle.length > this.platformSpecs.xiaohongshu.titleMaxLength) {
      xhsTitle = xhsTitle.substring(0, this.platformSpecs.xiaohongshu.titleMaxLength);
    }
    
    // 添加小红书风格emoji
    if (!xhsTitle.match(/^[📱💡🔥⭐️]/)) {
      xhsTitle = '📱 ' + xhsTitle;
    }
    
    return xhsTitle;
  }

  /**
   * 转换为小红书内容
   */
  convertToXiaohongshuContent(content, metadata) {
    let xhsContent = content;
    
    // 小红书内容特色：简短、社交化
    xhsContent = xhsContent
      .replace(/。/g, '~') // 使用波浪号替代句号，更有亲和力
      .replace(/首先|其次|最后/g, '✨') // 用emoji替代连接词
      .substring(0, this.platformSpecs.xiaohongshu.contentMaxLength);
    
    return xhsContent + '\n\n#SVTR #AI投资 #科技评论';
  }

  /**
   * 生成小红书标签
   */
  generateXiaohongshuTags(metadata) {
    return ['SVTR', 'AI投资', '科技评论', '创业', metadata.category];
  }

  /**
   * 预测小红书阅读量
   */
  predictXiaohongshuViews(metadata) {
    let baseViews = 1000;
    
    if (metadata.category === 'AI技术') baseViews *= 1.5;
    if (metadata.wordCount < 500) baseViews *= 1.3; // 短内容更受欢迎
    
    return Math.round(baseViews);
  }

  /**
   * 获取Twitter最佳发布时间
   */
  getOptimalTwitterTime(threadIndex = 0) {
    const now = new Date();
    const optimal = new Date(now);
    
    // Twitter线程发布间隔
    optimal.setMinutes(optimal.getMinutes() + threadIndex * 5);
    
    return optimal.toISOString();
  }

  // TODO: 实现图片处理方法
  async processCoverImage(imageUrl, platform) {
    // 这里应该实现图片下载、缩放、优化等功能
    return imageUrl;
  }

  async processLinkedInMedia(images) {
    // LinkedIn媒体处理
    return images || [];
  }

  async processXiaohongshuImages(images) {
    // 小红书图片处理（正方形格式）
    return images || [];
  }
}

module.exports = ContentTransformer;

// 如果直接运行此脚本，执行测试
if (require.main === module) {
  const transformer = new ContentTransformer();
  
  // 测试数据
  const testDocument = {
    title: "AI投资趋势分析：2025年市场展望",
    content: `人工智能领域的投资在2024年达到了新的高度。根据最新的研究报告，AI创业公司获得的融资总额超过了500亿美元。

## 主要投资领域

首先，生成式AI领域表现突出，ChatGPT等大语言模型推动了整个行业的发展。其次，计算机视觉和自动驾驶技术也获得了大量投资。

## 重点投资机构

主要的投资机构包括红杉资本、a16z等知名VC，他们在AI领域的布局越来越深入。

## 市场展望

展望2025年，AI技术将在更多垂直领域得到应用，特别是在医疗健康、金融科技和教育等传统行业。`,
    node_token: "test_doc_001",
    images: ["https://example.com/test-image.jpg"]
  };
  
  async function runTest() {
    console.log('🧪 开始内容转换测试...\n');
    
    // 测试微信公众号转换
    console.log('=== 微信公众号格式测试 ===');
    const wechatResult = await transformer.toWechatFormat(testDocument);
    console.log('标题:', wechatResult.title);
    console.log('发布时间:', wechatResult.publishTime);
    console.log('标签:', wechatResult.tags);
    console.log('');
    
    // 测试LinkedIn转换
    console.log('=== LinkedIn格式测试 ===');
    const linkedinResult = await transformer.toLinkedInFormat(testDocument);
    console.log('标题:', linkedinResult.title);
    console.log('话题标签:', linkedinResult.hashtags);
    console.log('目标受众:', linkedinResult.analytics.targetAudience);
    console.log('');
    
    // 测试Twitter线程转换
    console.log('=== Twitter线程格式测试 ===');
    const twitterResult = await transformer.toTwitterFormat(testDocument);
    console.log('线程数量:', twitterResult.summary.totalTweets);
    console.log('首条推文:', twitterResult.threadTweets[0].content.substring(0, 100) + '...');
    console.log('');
    
    console.log('✅ 所有格式转换测试完成！');
  }
  
  runTest().catch(console.error);
}