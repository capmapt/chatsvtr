#!/usr/bin/env node

/**
 * 飞书内容元数据提取器
 * 从飞书文档中提取丰富的元数据信息，用于多平台内容分发
 */

class MetadataExtractor {
  constructor() {
    this.tagPatterns = {
      // 内容分类标签
      category: {
        'AI投资': /AI.*?(投资|风投|VC|融资)/gi,
        'AI技术': /AI.*?(技术|算法|模型|开发)/gi,
        '创业公司': /(创业|初创|startup|公司分析)/gi,
        '投资机构': /(投资机构|VC|基金|投资人)/gi,
        '市场分析': /(市场|分析|趋势|预测)/gi,
        '行业报告': /(报告|研究|调研|白皮书)/gi,
        '人物专访': /(专访|访谈|人物|创始人)/gi
      },
      
      // 技术标签  
      technology: {
        'GPT': /GPT|ChatGPT|大语言模型|LLM/gi,
        'Machine Learning': /(机器学习|ML|深度学习|神经网络)/gi,
        'Computer Vision': /(计算机视觉|CV|图像识别)/gi,
        'NLP': /(自然语言处理|NLP|文本分析)/gi,
        'Robotics': /(机器人|robotics|自动化)/gi,
        'Autonomous': /(自动驾驶|无人车|autonomous)/gi
      },
      
      // 地区标签
      region: {
        '硅谷': /(硅谷|Silicon Valley|旧金山|San Francisco)/gi,
        '中国': /(中国|北京|上海|深圳|杭州)/gi,
        '欧洲': /(欧洲|英国|德国|法国|荷兰)/gi,
        '以色列': /(以色列|特拉维夫)/gi
      }
    };
  }

  /**
   * 从文档内容中提取完整元数据
   */
  extractMetadata(documentData) {
    const { content = '', title = '', node_token = '', parent_node_token = '' } = documentData;
    
    return {
      // 基础信息
      documentId: node_token,
      title: this.cleanTitle(title),
      parentId: parent_node_token,
      
      // 内容统计
      wordCount: this.getWordCount(content),
      characterCount: content.length,
      estimatedReadingTime: this.estimateReadingTime(content),
      
      // 内容分析
      tags: this.extractTags(content, title),
      category: this.determineCategory(content, title),
      sentiment: this.analyzeSentiment(content),
      keyPoints: this.extractKeyPoints(content),
      
      // SEO信息
      seoTitle: this.generateSEOTitle(title),
      metaDescription: this.generateMetaDescription(content),
      keywords: this.extractKeywords(content),
      
      // 社交媒体适配
      socialTitle: this.generateSocialTitle(title),
      hashTags: this.generateHashTags(content, title),
      tweetThread: this.splitForTwitter(content),
      
      // 提取时间
      extractedAt: new Date().toISOString(),
      version: '1.0'
    };
  }

  /**
   * 清理和优化标题
   */
  cleanTitle(title) {
    return title
      .replace(/^\s+|\s+$/g, '') // 移除首尾空格
      .replace(/\s+/g, ' ') // 合并多个空格
      .replace(/[【】\[\]]/g, '') // 移除中英文方括号
      .substring(0, 100); // 限制长度
  }

  /**
   * 计算字数（中英文兼容）
   */
  getWordCount(content) {
    // 中文字符数
    const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
    // 英文单词数
    const englishWords = content.match(/[a-zA-Z]+/g)?.length || 0;
    
    return chineseChars + englishWords;
  }

  /**
   * 估算阅读时间（分钟）
   */
  estimateReadingTime(content) {
    const wordCount = this.getWordCount(content);
    // 中文阅读速度约300字/分钟，英文约200词/分钟
    const avgWordsPerMinute = 250;
    return Math.ceil(wordCount / avgWordsPerMinute);
  }

  /**
   * 提取内容标签
   */
  extractTags(content, title) {
    const tags = [];
    const text = `${title} ${content}`.toLowerCase();
    
    // 遍历所有标签模式
    Object.entries(this.tagPatterns).forEach(([category, patterns]) => {
      Object.entries(patterns).forEach(([tag, pattern]) => {
        if (pattern.test(text)) {
          tags.push({
            tag,
            category,
            confidence: this.calculateTagConfidence(text, pattern)
          });
        }
      });
    });
    
    return tags
      .sort((a, b) => b.confidence - a.confidence) // 按置信度排序
      .slice(0, 10); // 最多返回10个标签
  }

  /**
   * 计算标签置信度
   */
  calculateTagConfidence(text, pattern) {
    const matches = text.match(pattern) || [];
    const textLength = text.length;
    const matchLength = matches.join('').length;
    
    // 基于匹配频率和文本长度计算置信度
    return Math.min(0.95, (matches.length * 0.2) + (matchLength / textLength * 100));
  }

  /**
   * 确定主要分类
   */
  determineCategory(content, title) {
    const text = `${title} ${content}`.toLowerCase();
    const categoryScores = {};
    
    // 计算各类别得分
    Object.entries(this.tagPatterns.category).forEach(([category, pattern]) => {
      const matches = text.match(pattern) || [];
      categoryScores[category] = matches.length;
    });
    
    // 返回得分最高的类别
    const topCategory = Object.entries(categoryScores)
      .sort(([,a], [,b]) => b - a)[0];
    
    return topCategory ? topCategory[0] : 'General';
  }

  /**
   * 情感分析（简单版本）
   */
  analyzeSentiment(content) {
    const positiveWords = /(成功|优秀|突破|创新|领先|增长|机会|优势)/g;
    const negativeWords = /(失败|困难|挑战|问题|风险|下降|损失)/g;
    
    const positiveMatches = content.match(positiveWords)?.length || 0;
    const negativeMatches = content.match(negativeWords)?.length || 0;
    
    const score = (positiveMatches - negativeMatches) / (positiveMatches + negativeMatches + 1);
    
    if (score > 0.2) return 'positive';
    if (score < -0.2) return 'negative';
    return 'neutral';
  }

  /**
   * 提取关键要点
   */
  extractKeyPoints(content) {
    const sentences = content.split(/[。！？.!?]/).filter(s => s.trim().length > 10);
    
    // 寻找包含关键词的句子
    const keywordPatterns = [
      /(重要|关键|核心|主要|首先|其次|最后|总之|因此)/,
      /(数据显示|研究表明|报告指出|分析认为)/,
      /(^\d+[、.]|^[一二三四五六七八九十]+[、.]|^[1-9]\.|^第[一二三四五六七八九十]+)/
    ];
    
    const keyPoints = sentences
      .filter(sentence => 
        keywordPatterns.some(pattern => pattern.test(sentence)) ||
        sentence.length > 50 // 长句子通常包含更多信息
      )
      .slice(0, 5) // 最多5个要点
      .map(point => point.trim().substring(0, 200)); // 限制长度
    
    return keyPoints;
  }

  /**
   * 生成SEO标题
   */
  generateSEOTitle(title) {
    // 确保标题长度适合SEO（50-60字符）
    let seoTitle = title;
    
    if (seoTitle.length > 60) {
      seoTitle = seoTitle.substring(0, 57) + '...';
    }
    
    // 添加SVTR品牌标识
    if (!seoTitle.includes('SVTR')) {
      seoTitle += ' | SVTR';
    }
    
    return seoTitle;
  }

  /**
   * 生成META描述
   */
  generateMetaDescription(content) {
    const sentences = content.split(/[。！？.!?]/).filter(s => s.trim().length > 10);
    let description = sentences.slice(0, 3).join('。'); // 前3句
    
    // 限制长度到160字符以内（SEO最佳实践）
    if (description.length > 160) {
      description = description.substring(0, 157) + '...';
    }
    
    return description;
  }

  /**
   * 提取关键词
   */
  extractKeywords(content) {
    // 简单的关键词提取（基于词频）
    const words = content
      .replace(/[^\u4e00-\u9fa5a-zA-Z\s]/g, ' ') // 只保留中英文字符
      .split(/\s+/)
      .filter(word => word.length > 1)
      .map(word => word.toLowerCase());
    
    const wordFreq = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    
    return Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a) // 按频率排序
      .slice(0, 15) // 前15个高频词
      .map(([word]) => word)
      .filter(word => word.length > 2); // 过滤太短的词
  }

  /**
   * 生成社交媒体标题
   */
  generateSocialTitle(title) {
    // 社交媒体标题通常更短更吸引人
    let socialTitle = title;
    
    // 添加引人注目的前缀
    const prefixes = [
      '🔥 ',
      '💡 ',
      '🚀 ',
      '📊 ',
      '⚡ '
    ];
    
    // 根据内容类型选择前缀
    if (!socialTitle.match(/^[🔥💡🚀📊⚡]/)) {
      socialTitle = prefixes[Math.floor(Math.random() * prefixes.length)] + socialTitle;
    }
    
    return socialTitle;
  }

  /**
   * 生成话题标签
   */
  generateHashTags(content, title) {
    const text = `${title} ${content}`.toLowerCase();
    const hashTags = [];
    
    // 基于内容生成相关话题标签
    const hashTagMappings = {
      'AI': ['#AI', '#人工智能', '#ArtificialIntelligence'],
      '投资': ['#投资', '#VC', '#创投', '#Investment'],
      '创业': ['#创业', '#Startup', '#创新', '#Innovation'],
      '技术': ['#技术', '#Tech', '#Technology'],
      'SVTR': ['#SVTR', '#硅谷科技评论']
    };
    
    Object.entries(hashTagMappings).forEach(([keyword, tags]) => {
      if (text.includes(keyword.toLowerCase())) {
        hashTags.push(...tags);
      }
    });
    
    // 去重并限制数量
    return [...new Set(hashTags)].slice(0, 8);
  }

  /**
   * 将内容分割为Twitter线程
   */
  splitForTwitter(content) {
    const maxTweetLength = 250; // 留出一些字符给链接和标签
    const sentences = content.split(/[。！？.!?]/).filter(s => s.trim().length > 0);
    const threads = [];
    let currentThread = '';
    
    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      
      if (currentThread.length + trimmedSentence.length + 1 <= maxTweetLength) {
        currentThread += (currentThread ? '。' : '') + trimmedSentence;
      } else {
        if (currentThread) {
          threads.push(currentThread + '。');
        }
        currentThread = trimmedSentence;
      }
    }
    
    // 添加最后一个线程
    if (currentThread) {
      threads.push(currentThread + '。');
    }
    
    // 为每个线程添加序号标识
    return threads.map((thread, index) => ({
      content: thread,
      threadNumber: index + 1,
      totalThreads: threads.length,
      isFirst: index === 0,
      isLast: index === threads.length - 1
    }));
  }

  /**
   * 批量处理多个文档
   */
  batchExtractMetadata(documents) {
    console.log(`📊 开始批量提取 ${documents.length} 个文档的元数据...`);
    
    const results = documents.map((doc, index) => {
      try {
        const metadata = this.extractMetadata(doc);
        console.log(`✅ (${index + 1}/${documents.length}) 完成: ${metadata.title}`);
        return { success: true, metadata, original: doc };
      } catch (error) {
        console.error(`❌ (${index + 1}/${documents.length}) 失败: ${doc.title || 'Unknown'}`, error.message);
        return { success: false, error: error.message, original: doc };
      }
    });
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`📈 批量提取完成: ${successful.length} 成功, ${failed.length} 失败`);
    
    return {
      successful: successful.map(r => r.metadata),
      failed: failed,
      summary: {
        total: documents.length,
        successful: successful.length,
        failed: failed.length,
        successRate: `${Math.round(successful.length / documents.length * 100)}%`
      }
    };
  }
}

module.exports = MetadataExtractor;

// 如果直接运行此脚本，执行测试
if (require.main === module) {
  const MetadataExtractor = require('./metadata-extractor');
  
  // 测试数据
  const testDocument = {
    title: "AI投资趋势分析：2025年市场展望",
    content: `人工智能领域的投资在2024年达到了新的高度。根据最新的研究报告，AI创业公司获得的融资总额超过了500亿美元。

首先，生成式AI领域表现突出，ChatGPT等大语言模型推动了整个行业的发展。其次，计算机视觉和自动驾驶技术也获得了大量投资。

主要的投资机构包括红杉资本、a16z等知名VC，他们在AI领域的布局越来越深入。在中国市场，腾讯、阿里巴巴等互联网巨头也加大了对AI初创公司的投资力度。

展望2025年，AI技术将在更多垂直领域得到应用，特别是在医疗健康、金融科技和教育等传统行业。这为投资者提供了新的机会，但同时也带来了新的挑战。

总之，AI投资市场仍然充满活力，但投资者需要更加谨慎地评估技术风险和市场前景。`,
    node_token: "test_doc_001",
    parent_node_token: "parent_001"
  };
  
  const extractor = new MetadataExtractor();
  const metadata = extractor.extractMetadata(testDocument);
  
  console.log('📋 元数据提取测试结果:');
  console.log(JSON.stringify(metadata, null, 2));
}