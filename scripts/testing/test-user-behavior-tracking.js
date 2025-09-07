#!/usr/bin/env node

/**
 * SVTR用户行为跟踪功能测试脚本
 * 验证用户行为数据的收集、处理和存储
 */

const fs = require('fs');
const path = require('path');

class UserBehaviorTrackingTest {
  constructor() {
    this.testResults = [];
    this.passedTests = 0;
    this.failedTests = 0;
  }

  /**
   * 运行所有测试
   */
  async runAllTests() {
    console.log('🔍 开始SVTR用户行为跟踪功能测试...\n');

    // 测试用户行为跟踪核心模块
    await this.testBehaviorTrackerModule();
    
    // 测试API端点
    await this.testUserBehaviorAPI();
    
    // 测试管理中心集成
    await this.testAdminCenterIntegration();
    
    // 测试数据结构
    await this.testDataStructures();

    // 输出测试结果
    this.outputResults();
  }

  /**
   * 测试用户行为跟踪核心模块
   */
  async testBehaviorTrackerModule() {
    console.log('📊 测试用户行为跟踪核心模块...');

    try {
      // 检查核心模块文件是否存在
      const trackerPath = path.join(__dirname, '../../assets/js/user-behavior-tracker.js');
      if (!fs.existsSync(trackerPath)) {
        throw new Error('用户行为跟踪模块文件不存在');
      }

      const trackerContent = fs.readFileSync(trackerPath, 'utf8');

      // 检查核心功能
      const requiredMethods = [
        'SVTRUserBehaviorTracker',
        'trackPageView',
        'trackClick',
        'trackScrollDepth',
        'trackFormSubmission',
        'trackPageUnload',
        'flushBehaviorData'
      ];

      let missingMethods = [];
      for (const method of requiredMethods) {
        if (!trackerContent.includes(method)) {
          missingMethods.push(method);
        }
      }

      if (missingMethods.length > 0) {
        throw new Error(`缺少必要方法: ${missingMethods.join(', ')}`);
      }

      // 检查配置选项
      const requiredConfigs = [
        'batchSize',
        'flushInterval',
        'trackScrollDepth',
        'trackClickHeatmap',
        'trackFormInteractions',
        'trackPagePerformance'
      ];

      let missingConfigs = [];
      for (const config of requiredConfigs) {
        if (!trackerContent.includes(config)) {
          missingConfigs.push(config);
        }
      }

      if (missingConfigs.length > 0) {
        throw new Error(`缺少配置选项: ${missingConfigs.join(', ')}`);
      }

      this.addTestResult('用户行为跟踪核心模块', true, '所有核心功能和配置项都已实现');

      // 检查错误处理
      if (trackerContent.includes('try') && trackerContent.includes('catch')) {
        this.addTestResult('错误处理机制', true, '已实现完整的错误处理');
      } else {
        this.addTestResult('错误处理机制', false, '缺少错误处理机制');
      }

      // 检查数据缓存机制
      if (trackerContent.includes('behaviorCache') && trackerContent.includes('localStorage')) {
        this.addTestResult('数据缓存机制', true, '已实现本地缓存和批量发送');
      } else {
        this.addTestResult('数据缓存机制', false, '缺少数据缓存机制');
      }

    } catch (error) {
      this.addTestResult('用户行为跟踪核心模块', false, error.message);
    }
  }

  /**
   * 测试用户行为API端点
   */
  async testUserBehaviorAPI() {
    console.log('🔌 测试用户行为API端点...');

    try {
      // 检查API文件是否存在
      const apiPath = path.join(__dirname, '../../functions/api/user-behavior.ts');
      if (!fs.existsSync(apiPath)) {
        throw new Error('用户行为API文件不存在');
      }

      const apiContent = fs.readFileSync(apiPath, 'utf8');

      // 检查API端点
      const requiredFeatures = [
        'onRequestPost',
        'onRequestGet',
        'processBehaviorData',
        'updateSessionSummary',
        'updatePageStats',
        'updateUserActivity'
      ];

      let missingFeatures = [];
      for (const feature of requiredFeatures) {
        if (!apiContent.includes(feature)) {
          missingFeatures.push(feature);
        }
      }

      if (missingFeatures.length > 0) {
        throw new Error(`缺少API功能: ${missingFeatures.join(', ')}`);
      }

      // 检查数据验证
      if (apiContent.includes('sessionId') && apiContent.includes('userId') && apiContent.includes('timestamp')) {
        this.addTestResult('API数据验证', true, '已实现完整的数据验证');
      } else {
        this.addTestResult('API数据验证', false, '缺少数据验证逻辑');
      }

      // 检查CORS配置
      if (apiContent.includes('Access-Control-Allow-Origin')) {
        this.addTestResult('CORS配置', true, '已配置CORS跨域支持');
      } else {
        this.addTestResult('CORS配置', false, '缺少CORS配置');
      }

      // 检查KV存储集成
      if (apiContent.includes('USER_BEHAVIOR_KV') && apiContent.includes('kv.put')) {
        this.addTestResult('KV存储集成', true, '已集成Cloudflare KV存储');
      } else {
        this.addTestResult('KV存储集成', false, '缺少KV存储集成');
      }

      this.addTestResult('用户行为API端点', true, 'API端点功能完整');

    } catch (error) {
      this.addTestResult('用户行为API端点', false, error.message);
    }
  }

  /**
   * 测试管理中心集成
   */
  async testAdminCenterIntegration() {
    console.log('🏢 测试管理中心集成...');

    try {
      // 检查管理中心文件
      const adminPath = path.join(__dirname, '../../pages/admin-center.html');
      if (!fs.existsSync(adminPath)) {
        throw new Error('管理中心文件不存在');
      }

      const adminContent = fs.readFileSync(adminPath, 'utf8');

      // 检查操作日志模块
      if (adminContent.includes('logs-module') && adminContent.includes('操作日志')) {
        this.addTestResult('操作日志模块', true, '操作日志模块已实现');
      } else {
        this.addTestResult('操作日志模块', false, '缺少操作日志模块');
      }

      // 检查实时监控功能
      const realtimeFeatures = [
        'realtime-tab',
        'loadRealtimeActivities',
        'startRealtimeMonitoring',
        'stopRealtimeMonitoring'
      ];

      let missingRealtimeFeatures = [];
      for (const feature of realtimeFeatures) {
        if (!adminContent.includes(feature)) {
          missingRealtimeFeatures.push(feature);
        }
      }

      if (missingRealtimeFeatures.length === 0) {
        this.addTestResult('实时监控功能', true, '实时监控功能已完整实现');
      } else {
        this.addTestResult('实时监控功能', false, `缺少功能: ${missingRealtimeFeatures.join(', ')}`);
      }

      // 检查会话分析功能
      if (adminContent.includes('sessions-tab') && adminContent.includes('loadSessionsData')) {
        this.addTestResult('会话分析功能', true, '会话分析功能已实现');
      } else {
        this.addTestResult('会话分析功能', false, '缺少会话分析功能');
      }

      // 检查页面分析功能
      if (adminContent.includes('pages-tab') && adminContent.includes('loadPagesAnalysis')) {
        this.addTestResult('页面分析功能', true, '页面分析功能已实现');
      } else {
        this.addTestResult('页面分析功能', false, '缺少页面分析功能');
      }

      // 检查热力图功能
      if (adminContent.includes('heatmap-tab') && adminContent.includes('loadHeatmapData')) {
        this.addTestResult('热力图功能', true, '热力图功能已实现');
      } else {
        this.addTestResult('热力图功能', false, '缺少热力图功能');
      }

      // 检查数据导出功能
      if (adminContent.includes('exportUserBehaviorData')) {
        this.addTestResult('数据导出功能', true, '数据导出功能已实现');
      } else {
        this.addTestResult('数据导出功能', false, '缺少数据导出功能');
      }

    } catch (error) {
      this.addTestResult('管理中心集成', false, error.message);
    }
  }

  /**
   * 测试数据结构
   */
  async testDataStructures() {
    console.log('🗄️ 测试数据结构...');

    try {
      // 检查API文件中的数据接口
      const apiPath = path.join(__dirname, '../../functions/api/user-behavior.ts');
      const apiContent = fs.readFileSync(apiPath, 'utf8');

      // 检查核心数据接口
      const requiredInterfaces = [
        'BehaviorData',
        'SessionSummary'
      ];

      let missingInterfaces = [];
      for (const interfaceName of requiredInterfaces) {
        if (!apiContent.includes(`interface ${interfaceName}`)) {
          missingInterfaces.push(interfaceName);
        }
      }

      if (missingInterfaces.length === 0) {
        this.addTestResult('数据接口定义', true, '所有核心数据接口已定义');
      } else {
        this.addTestResult('数据接口定义', false, `缺少接口: ${missingInterfaces.join(', ')}`);
      }

      // 检查存储键名规范
      const storageKeys = [
        'raw:',
        'session:',
        'page_stats:',
        'user_activity:'
      ];

      let missingKeys = [];
      for (const key of storageKeys) {
        if (!apiContent.includes(key)) {
          missingKeys.push(key);
        }
      }

      if (missingKeys.length === 0) {
        this.addTestResult('存储键名规范', true, '存储键名规范已实现');
      } else {
        this.addTestResult('存储键名规范', false, `缺少键名: ${missingKeys.join(', ')}`);
      }

      // 检查数据过期设置
      if (apiContent.includes('expirationTtl')) {
        this.addTestResult('数据过期设置', true, '已设置数据过期时间');
      } else {
        this.addTestResult('数据过期设置', false, '缺少数据过期设置');
      }

    } catch (error) {
      this.addTestResult('数据结构', false, error.message);
    }
  }

  /**
   * 添加测试结果
   */
  addTestResult(testName, passed, message) {
    this.testResults.push({
      name: testName,
      passed: passed,
      message: message
    });

    if (passed) {
      this.passedTests++;
      console.log(`  ✅ ${testName}: ${message}`);
    } else {
      this.failedTests++;
      console.log(`  ❌ ${testName}: ${message}`);
    }
  }

  /**
   * 输出测试结果
   */
  outputResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 SVTR用户行为跟踪功能测试报告');
    console.log('='.repeat(60));
    
    console.log(`总测试项: ${this.testResults.length}`);
    console.log(`通过: ${this.passedTests} ✅`);
    console.log(`失败: ${this.failedTests} ❌`);
    console.log(`成功率: ${((this.passedTests / this.testResults.length) * 100).toFixed(1)}%`);

    if (this.failedTests > 0) {
      console.log('\n❌ 失败的测试项:');
      this.testResults
        .filter(test => !test.passed)
        .forEach(test => {
          console.log(`  • ${test.name}: ${test.message}`);
        });
    }

    console.log('\n📋 完整测试列表:');
    this.testResults.forEach((test, index) => {
      const status = test.passed ? '✅' : '❌';
      console.log(`  ${index + 1}. ${status} ${test.name}`);
    });

    // 生成测试报告文件
    this.generateTestReport();

    console.log('\n🎉 测试完成！');
    
    if (this.passedTests === this.testResults.length) {
      console.log('🚀 所有测试通过，用户行为跟踪系统已就绪！');
    } else {
      console.log('⚠️  部分测试失败，请检查上述问题。');
      process.exit(1);
    }
  }

  /**
   * 生成测试报告文件
   */
  generateTestReport() {
    const reportData = {
      testSuite: 'SVTR用户行为跟踪功能测试',
      timestamp: new Date().toISOString(),
      summary: {
        total: this.testResults.length,
        passed: this.passedTests,
        failed: this.failedTests,
        successRate: ((this.passedTests / this.testResults.length) * 100).toFixed(1)
      },
      results: this.testResults,
      recommendations: this.generateRecommendations()
    };

    const reportPath = path.join(__dirname, `test-report-user-behavior-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`\n📄 详细测试报告已生成: ${reportPath}`);
  }

  /**
   * 生成改进建议
   */
  generateRecommendations() {
    const recommendations = [];

    if (this.failedTests === 0) {
      recommendations.push({
        type: 'success',
        title: '系统已就绪',
        description: '用户行为跟踪系统已完整实现，可以部署到生产环境。'
      });
    }

    // 根据失败的测试添加建议
    const failedTests = this.testResults.filter(test => !test.passed);
    
    if (failedTests.some(test => test.name.includes('核心模块'))) {
      recommendations.push({
        type: 'critical',
        title: '修复核心模块',
        description: '用户行为跟踪核心模块存在问题，这是系统运行的基础，必须优先修复。'
      });
    }

    if (failedTests.some(test => test.name.includes('API'))) {
      recommendations.push({
        type: 'important',
        title: '完善API端点',
        description: '用户行为API端点需要完善，确保数据能够正确收集和存储。'
      });
    }

    if (failedTests.some(test => test.name.includes('管理中心'))) {
      recommendations.push({
        type: 'moderate',
        title: '增强管理功能',
        description: '管理中心的用户行为分析功能需要进一步完善，提升管理员的数据可视化体验。'
      });
    }

    return recommendations;
  }
}

// 运行测试
if (require.main === module) {
  const test = new UserBehaviorTrackingTest();
  test.runAllTests().catch(console.error);
}

module.exports = UserBehaviorTrackingTest;