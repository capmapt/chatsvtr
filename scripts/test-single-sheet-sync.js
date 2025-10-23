#!/usr/bin/env node

/**
 * 测试单个Sheet的IMPORTRANGE同步
 */

const EnhancedFeishuSyncV2 = require('./enhanced-feishu-sync-v3.js');

async function testSingleSheet() {
  console.log('🧪 测试单个Sheet的IMPORTRANGE同步\n');

  const syncer = new EnhancedFeishuSyncV2();

  // 先获取access token
  await syncer.getAccessToken();

  // 测试一个已知使用IMPORTRANGE的Sheet
  const objToken = 'PERPsZO0ph5nZztjBTSctDAdnYg';
  const title = 'AI创投季度观察';

  console.log(`📊 测试节点: ${title}\n`);

  const content = await syncer.getSheetContent(objToken, title);

  console.log('\n' + '='.repeat(60));
  console.log('📄 获取的内容长度:', content.length);
  console.log('='.repeat(60));

  const contentStr = typeof content === 'string' ? content : JSON.stringify(content, null, 2);

  if (contentStr.length > 500) {
    console.log('\n✅ 成功! 内容长度 > 500，说明获取到了实际数据');
    console.log('\n📋 内容预览 (前500字符):');
    console.log(contentStr.substring(0, 500));
    console.log('\n...');
  } else {
    console.log('\n❌ 失败: 内容长度 <= 500，仍然是fallback内容');
    console.log('\n完整内容:');
    console.log(contentStr);
  }
}

testSingleSheet().catch(console.error);
