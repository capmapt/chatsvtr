#!/usr/bin/env node

/**
 * 分析飞书URL结构，找出正确的App Token
 */

function analyzeFeishuUrl() {
  console.log('🔗 飞书URL结构分析\n');

  const originalUrl = 'https://svtrglobal.feishu.cn/wiki/V2JnwfmvtiBUTdkc32rcQrXWn4g?from=from_copylink&sheet=GvCmOW';

  console.log('原始URL:', originalUrl);
  console.log();

  // 解析URL
  const url = new URL(originalUrl);
  console.log('URL组成部分:');
  console.log(`  - 协议: ${url.protocol}`);
  console.log(`  - 域名: ${url.hostname}`);
  console.log(`  - 路径: ${url.pathname}`);
  console.log(`  - 查询参数: ${url.search}`);
  console.log();

  // 分析路径
  const pathParts = url.pathname.split('/');
  console.log('路径分析:');
  pathParts.forEach((part, index) => {
    if (part) {
      console.log(`  [${index}] ${part}`);
    }
  });
  console.log();

  // 分析查询参数
  const searchParams = new URLSearchParams(url.search);
  console.log('查询参数:');
  for (const [key, value] of searchParams) {
    console.log(`  ${key}: ${value}`);
  }
  console.log();

  // 当前配置
  const currentConfig = {
    appToken: 'V2JnwfmvtiBUTdkc32rcQrXWn4g',
    tableId: 'GvCmOW'
  };

  console.log('当前配置:');
  console.log(`  App Token: ${currentConfig.appToken}`);
  console.log(`  Table ID: ${currentConfig.tableId}`);
  console.log();

  // 问题分析
  console.log('🤔 问题分析:');
  console.log('1. NOTEXIST 错误在应用级别出现');
  console.log('2. 这意味着 App Token 可能不正确');
  console.log('3. URL中的 V2JnwfmvtiBUTdkc32rcQrXWn4g 可能是:');
  console.log('   - Wiki空间ID');
  console.log('   - 页面ID');
  console.log('   - 而不是多维表格的App Token');
  console.log();

  console.log('💡 可能的解决方案:');
  console.log('1. 需要获取真正的多维表格App Token');
  console.log('2. Wiki页面和多维表格是不同的飞书产品');
  console.log('3. 需要直接访问多维表格获取正确的ID');
  console.log();

  console.log('🔍 下一步行动:');
  console.log('1. 访问飞书多维表格应用');
  console.log('2. 获取正确的App Token和Table ID');
  console.log('3. URL格式应该类似: https://xxx.feishu.cn/base/xxxAppTokenxxx');
}

analyzeFeishuUrl();