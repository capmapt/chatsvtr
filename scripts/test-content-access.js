#!/usr/bin/env node

/**
 * 飞书内容访问测试脚本
 * 专门测试能否获取真实的Wiki和文档内容
 */

require('dotenv').config();

class FeishuContentTester {
  constructor() {
    this.config = {
      appId: 'cli_a8e2014cbe7d9013',
      appSecret: 'tysHBj6njxwafO92dwO1DdttVvqvesf0',
      baseUrl: 'https://open.feishu.cn/open-apis',
      spaceId: '7321328173944340484',
      rootNodeToken: 'TB4nwFKSjiZybRkoZx7c7mBXnxd',
      objToken: 'DEzTdMe8qoLE3gxtnUHcZP83nNb',
      testNodes: [
        { token: 'E7wbw3r5Mi0ctEk6Q3acXBzCntg', name: 'SVTR.AI创投季度观察', objToken: 'PERPsZO0ph5nZztjBTSctDAdnYg' },
        { token: 'QZt5wuIvhigrTdkGdBjcFRsKnaf', name: 'SVTR AI创投库', objToken: 'CB2cdSdyzokFt7xi2wOchtP6nPb' },
        { token: 'TB4nwFKSjiZybRkoZx7c7mBXnxd', name: 'SVTR丨硅谷科技评论', objToken: 'DEzTdMe8qoLE3gxtnUHcZP83nNb' }
      ]
    };
    this.accessToken = null;
  }

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

  async safeJsonParse(response, endpointName) {
    try {
      const text = await response.text();
      
      // 检查是否是HTML响应
      if (text.trim().startsWith('<')) {
        return { 
          isHTML: true, 
          content: text, 
          error: 'API返回HTML而不是JSON，可能是权限问题或端点错误' 
        };
      }
      
      // 检查是否是空响应
      if (!text.trim()) {
        return { 
          isEmpty: true, 
          error: 'API返回空响应' 
        };
      }
      
      // 尝试解析JSON
      const data = JSON.parse(text);
      return { success: true, data, rawText: text };
      
    } catch (error) {
      const text = await response.text().catch(() => '无法读取响应内容');
      return { 
        parseError: true, 
        error: error.message, 
        rawText: text.substring(0, 500) 
      };
    }
  }

  async testWikiNodeContent() {
    console.log('\n🔍 测试Wiki节点内容访问...');
    
    for (const node of this.config.testNodes) {
      console.log(`\n📄 测试节点: ${node.name}`);
      
      // 测试多种API端点
      const endpoints = [
        {
          name: 'Wiki节点详情',
          url: `${this.config.baseUrl}/wiki/v2/nodes/${node.token}`,
          method: 'GET'
        },
        {
          name: 'Wiki节点内容',
          url: `${this.config.baseUrl}/wiki/v2/nodes/${node.token}/content`,
          method: 'GET'
        },
        {
          name: '文档内容',
          url: `${this.config.baseUrl}/docx/v1/documents/${node.objToken}/content`,
          method: 'GET'
        },
        {
          name: '文档原始内容',
          url: `${this.config.baseUrl}/docx/v1/documents/${node.objToken}/raw_content`,
          method: 'GET'
        }
      ];
      
      for (const endpoint of endpoints) {
        try {
          console.log(`   🔗 尝试: ${endpoint.name}`);
          
          const response = await fetch(endpoint.url, {
            method: endpoint.method,
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          const result = await this.safeJsonParse(response, endpoint.name);
          
          if (result.success) {
            const data = result.data;
            if (data.code === 0) {
              console.log(`      ✅ 成功获取内容`);
              console.log(`      📊 数据大小: ${result.rawText.length} 字符`);
              
              // 显示内容预览
              if (data.data && typeof data.data === 'object') {
                console.log(`      📝 内容类型: ${typeof data.data}`);
                console.log(`      🔑 数据键: ${Object.keys(data.data).join(', ')}`);
                
                // 如果有文本内容，显示前100字符
                const content = data.data.content || data.data.document || data.data.text || JSON.stringify(data.data);
                if (typeof content === 'string' && content.length > 0) {
                  console.log(`      📖 内容预览: ${content.substring(0, 100)}...`);
                }
              }
            } else {
              console.log(`      ⚠️ API错误: ${data.msg} (code: ${data.code})`);
            }
          } else if (result.isHTML) {
            console.log(`      🌐 返回HTML页面 (${result.content.length}字符)`);
            // 提取title或其他有用信息
            const titleMatch = result.content.match(/<title>(.*?)<\/title>/i);
            if (titleMatch) {
              console.log(`      📰 页面标题: ${titleMatch[1]}`);
            }
          } else if (result.isEmpty) {
            console.log(`      📭 返回空响应`);
          } else if (result.parseError) {
            console.log(`      ❌ JSON解析错误: ${result.error}`);
            console.log(`      📄 原始响应 (前200字符): ${result.rawText.substring(0, 200)}`);
          }
          
          console.log(`      🔢 HTTP状态码: ${response.status}`);
          
        } catch (error) {
          console.log(`      ❌ 请求失败: ${error.message}`);
        }
        
        // 避免请求过快
        await new Promise(resolve => setTimeout(resolve, 800));
      }
    }
  }

  async testSuccessfulEndpoint() {
    console.log('\n🎯 重点测试已确认可用的端点...');
    
    const successfulUrl = `${this.config.baseUrl}/docx/v1/documents/${this.config.objToken}/raw_content`;
    
    try {
      const response = await fetch(successfulUrl, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await this.safeJsonParse(response, '文档原始内容');
      
      if (result.success && result.data.code === 0) {
        console.log('✅ 文档原始内容API确认可用！');
        console.log(`📊 响应大小: ${result.rawText.length} 字符`);
        
        const data = result.data.data;
        console.log('📋 可用数据字段:');
        Object.keys(data).forEach(key => {
          const value = data[key];
          const type = typeof value;
          const length = Array.isArray(value) ? value.length : (type === 'string' ? value.length : 0);
          console.log(`   - ${key}: ${type} (${length})`);
        });
        
        // 如果有content字段，显示更多详情
        if (data.content) {
          console.log('\n📄 文档内容分析:');
          console.log(`   - 内容类型: ${typeof data.content}`);
          
          if (typeof data.content === 'string') {
            console.log(`   - 内容长度: ${data.content.length} 字符`);
            console.log(`   - 内容预览: ${data.content.substring(0, 300)}...`);
          } else if (typeof data.content === 'object' && data.content.elements) {
            console.log(`   - 文档元素数量: ${data.content.elements.length}`);
            console.log(`   - 元素类型: ${data.content.elements.map(e => e.type).join(', ')}`);
          }
        }
        
        return { success: true, data: result.data };
      } else {
        console.log('❌ 无法获取文档内容');
        return { success: false, error: result };
      }
    } catch (error) {
      console.log(`❌ 测试失败: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  generateActionPlan(results) {
    console.log('\n📋 行动计划');
    console.log('=' .repeat(50));
    
    console.log('\n🎯 立即可做:');
    console.log('1. 文档原始内容API已可用，可以获取真实内容');
    console.log('2. 修改同步脚本使用可用的API端点');
    console.log('3. 实现内容解析和结构化处理');
    
    console.log('\n⚠️ 需要解决:');
    console.log('1. Wiki节点内容API权限问题');
    console.log('2. 多维表格访问权限');
    console.log('3. JSON解析错误处理');
    
    console.log('\n📝 建议的下一步:');
    console.log('1. 立即修改现有同步脚本使用可用API');
    console.log('2. 申请剩余权限以获取更多内容');
    console.log('3. 建立混合内容获取策略');
    
    console.log('\n🔧 技术方案:');
    console.log('- 优先使用已验证可用的端点');
    console.log('- 建立降级机制处理权限不足');
    console.log('- 实现智能内容解析和清理');
  }

  async runTest() {
    console.log('🚀 开始飞书内容访问测试...\n');
    
    if (!await this.getAccessToken()) {
      console.error('❌ 无法获取访问令牌，测试中止');
      return;
    }
    
    // 测试各种内容访问方式
    await this.testWikiNodeContent();
    
    // 重点测试已知可用的端点
    const successfulResult = await this.testSuccessfulEndpoint();
    
    // 生成行动计划
    this.generateActionPlan(successfulResult);
    
    console.log('\n✅ 内容访问测试完成！');
  }
}

if (require.main === module) {
  const tester = new FeishuContentTester();
  tester.runTest().catch(console.error);
}

module.exports = FeishuContentTester;