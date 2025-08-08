#!/usr/bin/env node

/**
 * 飞书API权限测试脚本
 * 用于检查当前应用的权限范围和可用API端点
 */

require('dotenv').config();

class FeishuPermissionTester {
  constructor() {
    this.config = {
      appId: 'cli_a8e2014cbe7d9013',
      appSecret: 'tysHBj6njxwafO92dwO1DdttVvqvesf0',
      baseUrl: 'https://open.feishu.cn/open-apis',
      spaceId: '7321328173944340484',
      rootNodeToken: 'TB4nwFKSjiZybRkoZx7c7mBXnxd',
      testNodeTokens: [
        'E7wbw3r5Mi0ctEk6Q3acXBzCntg',  // SVTR.AI创投季度观察
        'QZt5wuIvhigrTdkGdBjcFRsKnaf',  // SVTR AI创投库
        'TB4nwFKSjiZybRkoZx7c7mBXnxd'   // SVTR丨硅谷科技评论
      ]
    };
    this.accessToken = null;
  }

  /**
   * 获取访问令牌
   */
  async getAccessToken() {
    const url = `${this.config.baseUrl}/auth/v3/tenant_access_token/internal`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_id: this.config.appId,
          app_secret: this.config.appSecret
        })
      });
      
      const data = await response.json();
      
      if (data.code === 0) {
        this.accessToken = data.tenant_access_token;
        console.log('✅ 飞书认证成功');
        return true;
      } else {
        console.error('❌ 认证失败:', data.msg);
        return false;
      }
    } catch (error) {
      console.error('❌ 认证错误:', error.message);
      return false;
    }
  }

  /**
   * 测试应用信息权限
   */
  async testApplicationInfo() {
    console.log('\n🔍 测试应用信息权限...');
    
    const url = `${this.config.baseUrl}/application/v6/applications/${this.config.appId}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.status === 200 && data.code === 0) {
        console.log('✅ 应用信息权限正常');
        console.log('📋 应用详情:');
        console.log(`   - 应用名称: ${data.data.app_name}`);
        console.log(`   - 应用状态: ${data.data.status}`);
        console.log(`   - 权限范围: ${data.data.scopes?.join(', ') || '未知'}`);
        return { success: true, data: data.data };
      } else {
        console.log('⚠️ 应用信息权限受限');
        console.log(`   - 状态码: ${response.status}`);
        console.log(`   - 错误: ${data.msg || data.error}`);
        return { success: false, error: data.msg };
      }
    } catch (error) {
      console.log('❌ 应用信息测试失败:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * 测试Wiki相关权限
   */
  async testWikiPermissions() {
    console.log('\n🔍 测试Wiki权限...');
    
    const tests = [
      {
        name: 'Wiki空间列表',
        url: `${this.config.baseUrl}/wiki/v2/spaces`,
        expectedPermission: 'wiki:read'
      },
      {
        name: 'Wiki节点列表', 
        url: `${this.config.baseUrl}/wiki/v2/spaces/${this.config.spaceId}/nodes`,
        expectedPermission: 'wiki:read'
      },
      {
        name: 'Wiki节点内容',
        url: `${this.config.baseUrl}/wiki/v2/nodes/${this.config.rootNodeToken}`,
        expectedPermission: 'wiki:read'
      }
    ];

    const results = [];
    
    for (const test of tests) {
      try {
        const response = await fetch(test.url, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        
        if (response.status === 200 && data.code === 0) {
          console.log(`✅ ${test.name}: 权限正常`);
          results.push({ test: test.name, success: true, permission: test.expectedPermission });
        } else if (response.status === 403 || data.code === 99991663) {
          console.log(`❌ ${test.name}: 权限不足`);
          console.log(`   - 需要权限: ${test.expectedPermission}`);
          results.push({ test: test.name, success: false, permission: test.expectedPermission, error: '权限不足' });
        } else {
          console.log(`⚠️ ${test.name}: ${data.msg || '未知错误'}`);
          results.push({ test: test.name, success: false, permission: test.expectedPermission, error: data.msg });
        }
        
        // 避免请求过快
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`❌ ${test.name}: ${error.message}`);
        results.push({ test: test.name, success: false, permission: test.expectedPermission, error: error.message });
      }
    }
    
    return results;
  }

  /**
   * 测试文档相关权限
   */
  async testDocPermissions() {
    console.log('\n🔍 测试文档权限...');
    
    // 从Wiki节点中获取实际的文档ID
    const docTests = [
      {
        name: '文档内容读取',
        url: `${this.config.baseUrl}/docx/v1/documents/DEzTdMe8qoLE3gxtnUHcZP83nNb/content`,
        expectedPermission: 'docs:read'
      },
      {
        name: '文档原始内容',
        url: `${this.config.baseUrl}/docx/v1/documents/DEzTdMe8qoLE3gxtnUHcZP83nNb/raw_content`,
        expectedPermission: 'docs:read'
      }
    ];

    const results = [];
    
    for (const test of docTests) {
      try {
        const response = await fetch(test.url, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        
        if (response.status === 200 && data.code === 0) {
          console.log(`✅ ${test.name}: 权限正常`);
          console.log(`   - 内容长度: ${JSON.stringify(data).length} 字符`);
          results.push({ test: test.name, success: true, permission: test.expectedPermission });
        } else if (response.status === 403 || data.code === 99991663) {
          console.log(`❌ ${test.name}: 权限不足`);
          console.log(`   - 需要权限: ${test.expectedPermission}`);
          results.push({ test: test.name, success: false, permission: test.expectedPermission, error: '权限不足' });
        } else {
          console.log(`⚠️ ${test.name}: ${data.msg || '未知错误'}`);
          results.push({ test: test.name, success: false, permission: test.expectedPermission, error: data.msg });
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`❌ ${test.name}: ${error.message}`);
        results.push({ test: test.name, success: false, permission: test.expectedPermission, error: error.message });
      }
    }
    
    return results;
  }

  /**
   * 测试多维表格权限
   */
  async testBitablePermissions() {
    console.log('\n🔍 测试多维表格权限...');
    
    // 基于已知的多维表格对象测试
    const bitableTests = [
      {
        name: '多维表格应用信息',
        url: `${this.config.baseUrl}/bitable/v1/apps/PERPsZO0ph5nZztjBTSctDAdnYg`,
        expectedPermission: 'bitable:read'
      },
      {
        name: '多维表格数据表列表',
        url: `${this.config.baseUrl}/bitable/v1/apps/PERPsZO0ph5nZztjBTSctDAdnYg/tables`,
        expectedPermission: 'bitable:read'
      }
    ];

    const results = [];
    
    for (const test of bitableTests) {
      try {
        const response = await fetch(test.url, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        
        if (response.status === 200 && data.code === 0) {
          console.log(`✅ ${test.name}: 权限正常`);
          results.push({ test: test.name, success: true, permission: test.expectedPermission });
        } else if (response.status === 403 || data.code === 99991663) {
          console.log(`❌ ${test.name}: 权限不足`);
          console.log(`   - 需要权限: ${test.expectedPermission}`);
          results.push({ test: test.name, success: false, permission: test.expectedPermission, error: '权限不足' });
        } else {
          console.log(`⚠️ ${test.name}: ${data.msg || '未知错误'}`);
          results.push({ test: test.name, success: false, permission: test.expectedPermission, error: data.msg });
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`❌ ${test.name}: ${error.message}`);
        results.push({ test: test.name, success: false, permission: test.expectedPermission, error: error.message });
      }
    }
    
    return results;
  }

  /**
   * 生成权限报告
   */
  generatePermissionReport(appInfo, wikiResults, docResults, bitableResults) {
    console.log('\n📊 权限测试报告');
    console.log('=' .repeat(50));
    
    // 应用基本信息
    console.log('\n🏢 应用信息:');
    if (appInfo.success) {
      console.log(`   ✅ 应用ID: ${this.config.appId}`);
      console.log(`   ✅ 应用名称: ${appInfo.data.app_name || '未知'}`);
      console.log(`   ✅ 状态: ${appInfo.data.status || '未知'}`);
    } else {
      console.log(`   ❌ 应用信息获取失败: ${appInfo.error}`);
    }
    
    // 汇总权限状态
    const allResults = [...wikiResults, ...docResults, ...bitableResults];
    const successCount = allResults.filter(r => r.success).length;
    const totalCount = allResults.length;
    
    console.log(`\n📈 权限通过率: ${successCount}/${totalCount} (${Math.round(successCount/totalCount*100)}%)`);
    
    // 需要申请的权限
    const failedPermissions = [...new Set(
      allResults.filter(r => !r.success).map(r => r.permission)
    )];
    
    if (failedPermissions.length > 0) {
      console.log('\n🔑 需要申请的权限:');
      failedPermissions.forEach(permission => {
        console.log(`   - ${permission}`);
      });
    }
    
    // 生成申请说明
    this.generateApplicationTemplate(failedPermissions);
  }

  /**
   * 生成权限申请模板
   */
  generateApplicationTemplate(missingPermissions) {
    console.log('\n📝 权限申请说明模板:');
    console.log('-' .repeat(50));
    
    const template = `
【飞书应用权限申请】

应用信息:
- 应用ID: ${this.config.appId}
- 应用名称: SVTR.AI知识库同步工具

申请权限:
${missingPermissions.map(p => `- ${p}`).join('\n')}

业务场景:
本应用用于SVTR.AI官网的知识库内容同步，需要读取飞书Wiki和文档内容，
自动同步到网站的RAG(检索增强生成)系统，为AI聊天机器人提供知识库支持。

具体用途:
1. 读取飞书Wiki页面内容，转换为结构化数据
2. 同步文档和多维表格中的AI创投数据  
3. 支持网站智能问答功能
4. 提升用户体验和内容时效性

权限使用说明:
- 只读取内容，不修改或删除任何数据
- 仅在授权的知识库空间内操作
- 数据仅用于官网展示，不对外泄露
- 遵循数据安全和隐私保护规范

申请人: [填写申请人姓名]
申请时间: ${new Date().toLocaleString()}
`;
    
    console.log(template);
  }

  /**
   * 运行完整测试
   */
  async runFullTest() {
    console.log('🚀 开始飞书API权限测试...\n');
    
    // 获取访问令牌
    if (!await this.getAccessToken()) {
      console.error('❌ 无法获取访问令牌，测试中止');
      return;
    }
    
    // 测试各种权限
    const appInfo = await this.testApplicationInfo();
    const wikiResults = await this.testWikiPermissions();
    const docResults = await this.testDocPermissions();
    const bitableResults = await this.testBitablePermissions();
    
    // 生成报告
    this.generatePermissionReport(appInfo, wikiResults, docResults, bitableResults);
    
    console.log('\n✅ 权限测试完成!');
  }
}

// 执行测试
if (require.main === module) {
  const tester = new FeishuPermissionTester();
  tester.runFullTest().catch(console.error);
}

module.exports = FeishuPermissionTester;