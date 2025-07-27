/**
 * SVTR.AI Chat Demo Module
 * 智能演示模式模块
 */

import { CHAT_CONFIG } from './chat-config.js';

export class ChatDemo {
  constructor() {
    this.responses = CHAT_CONFIG.DEMO_RESPONSES;
  }

  getSmartDemoResponse(userMessage) {
    const lang = this.getCurrentLang();
    const responseType = this.matchResponseBySemantic(userMessage, lang);
    return this.getRelevantDemoResponse(userMessage, responseType, lang);
  }

  getCurrentLang() {
    return document.documentElement.lang === 'en' ? 'en' : 'zh';
  }

  matchResponseBySemantic(userMessage, lang) {
    const message = userMessage.toLowerCase();

    // AI创投相关关键词
    const aiVentureKeywords = lang === 'zh'
      ? ['ai创投', '人工智能', '投资', '融资', '估值', '创业', '独角兽', '风投', 'vc', '创投']
      : ['ai venture', 'artificial intelligence', 'investment', 'funding', 'valuation', 'startup', 'unicorn', 'vc', 'venture capital'];

    // SVTR相关关键词
    const svtrKeywords = lang === 'zh'
      ? ['svtr', '硅谷科技评论', '你是谁', '什么是svtr', '公司介绍', '关于']
      : ['svtr', 'silicon valley tech review', 'who are you', 'what is svtr', 'about', 'introduction'];

    if (aiVentureKeywords.some(keyword => message.includes(keyword))) {
      return 'ai_venture';
    } else if (svtrKeywords.some(keyword => message.includes(keyword))) {
      return 'svtr_info';
    }

    return 'general';
  }

  getRelevantDemoResponse(userMessage, responseType, lang) {
    const responses = this.responses[lang][responseType];

    // 基于消息哈希选择响应，确保一致性
    const hash = this.hashString(userMessage);
    const index = hash % responses.length;

    let response = responses[index];

    // 添加个性化元素
    if (responseType === 'general') {
      const timeGreeting = this.getTimeBasedGreeting(lang);
      response = `${timeGreeting} ${response}`;
    }

    return response;
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash);
  }

  getTimeBasedGreeting(lang) {
    const hour = new Date().getHours();
    if (lang === 'zh') {
      if (hour < 12) {
        return '早上好！';
      }
      if (hour < 18) {
        return '下午好！';
      }
      return '晚上好！';
    } else {
      if (hour < 12) {
        return 'Good morning!';
      }
      if (hour < 18) {
        return 'Good afternoon!';
      }
      return 'Good evening!';
    }
  }

  async simulateTyping(content, onUpdate, delay = CHAT_CONFIG.TYPING_DELAY) {
    let currentContent = '';
    const chars = content.split('');

    for (let i = 0; i < chars.length; i++) {
      currentContent += chars[i];
      onUpdate(currentContent);

      // 中文字符稍微快一些
      const charDelay = /[\u4e00-\u9fa5]/.test(chars[i]) ? delay * 0.7 : delay;
      await new Promise(resolve => setTimeout(resolve, charDelay));
    }
  }
}
