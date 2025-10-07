/**
 * Unit Tests for Funding Daily - extractStage()
 *
 * 目的: 防止正则表达式null reference错误再次发生
 * 日期: 2025-10-06
 * 相关: docs/post-mortem/2025-10-06-extractstage-null-safety.md
 */

const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

// 加载funding-daily.js
const fundingDailyPath = path.join(__dirname, '../../assets/js/funding-daily.js');
const fundingDailyCode = fs.readFileSync(fundingDailyPath, 'utf-8');

// 创建DOM环境
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  runScripts: 'dangerously'
});

global.window = dom.window;
global.document = dom.window.document;
global.console = console;

// 执行代码以加载extractStage函数
eval(fundingDailyCode);

describe('extractStage() - Null Safety Tests', () => {

  describe('Pre-Series 轮次提取', () => {

    test('应处理Pre-Series A SAFE', () => {
      const text = '完成1000万美元Pre-Series A SAFE融资';
      expect(() => extractStage(text)).not.toThrow();
      const result = extractStage(text);
      expect(result).toBe('Pre-A SAFE');
    });

    test('应处理小写pre-series', () => {
      const text = '完成pre-series B SAFE';
      expect(() => extractStage(text)).not.toThrow();
      const result = extractStage(text);
      expect(result).toBe('Pre-B SAFE');
    });

    test('应处理缺少字母的Pre-Series SAFE', () => {
      const text = '完成Pre-Series SAFE'; // 缺少A/B/C
      expect(() => extractStage(text)).not.toThrow();
      const result = extractStage(text);
      expect(result).toBe('SAFE'); // 应降级为SAFE
    });

    test('应处理异常空格', () => {
      const text = '完成Pre-Series    A    SAFE'; // 多个空格
      expect(() => extractStage(text)).not.toThrow();
    });

    test('应处理Pre-Series C', () => {
      const text = '完成Pre-Series C轮融资';
      expect(() => extractStage(text)).not.toThrow();
      const result = extractStage(text);
      expect(result).toBe('Pre-C');
    });
  });

  describe('标准轮次提取', () => {

    test('应处理天使轮', () => {
      const text = '完成500万美元天使轮融资';
      const result = extractStage(text);
      expect(result).toBe('天使轮');
    });

    test('应处理A轮', () => {
      const text = '完成1000万美元A轮融资';
      const result = extractStage(text);
      expect(result).toBe('A轮');
    });

    test('应处理B+轮', () => {
      const text = '完成3000万美元B+轮融资';
      const result = extractStage(text);
      expect(result).toBe('B+轮');
    });

    test('应处理E/F/G/H轮', () => {
      const texts = [
        { text: '完成E轮融资', expected: 'E轮' },
        { text: '完成F轮融资', expected: 'F轮' },
        { text: '完成G轮融资', expected: 'G轮' },
        { text: '完成H轮融资', expected: 'H轮' }
      ];

      texts.forEach(({ text, expected }) => {
        const result = extractStage(text);
        expect(result).toBe(expected);
      });
    });
  });

  describe('特殊轮次提取', () => {

    test('应处理种子轮', () => {
      const text = '完成种子轮融资';
      const result = extractStage(text);
      expect(result).toBe('种子轮');
    });

    test('应处理战略融资', () => {
      const text = '完成战略融资';
      const result = extractStage(text);
      expect(result).toBe('战略融资');
    });

    test('应处理IPO', () => {
      const text = '完成IPO上市';
      const result = extractStage(text);
      expect(result).toBe('IPO');
    });

    test('应处理并购', () => {
      const text = '被XX公司并购';
      const result = extractStage(text);
      expect(result).toBe('并购');
    });
  });

  describe('边界情况处理', () => {

    test('应处理空字符串', () => {
      expect(() => extractStage('')).not.toThrow();
      const result = extractStage('');
      expect(result).toBe('未知');
    });

    test('应处理null/undefined', () => {
      expect(() => extractStage(null)).not.toThrow();
      expect(() => extractStage(undefined)).not.toThrow();
    });

    test('应处理无融资信息的文本', () => {
      const text = '这是一家AI公司，专注于芯片研发';
      expect(() => extractStage(text)).not.toThrow();
      const result = extractStage(text);
      expect(result).toBe('未知');
    });

    test('应处理Unicode特殊字符', () => {
      const text = '完成Pre‑Series\u00A0A\u00A0SAFE'; // 非断连字符 + 非断空格
      expect(() => extractStage(text)).not.toThrow();
    });

    test('应处理大小写混合', () => {
      const texts = [
        '完成PRE-SERIES A SAFE',
        '完成Pre-Series A SAFE',
        '完成pre-series A SAFE'
      ];

      texts.forEach(text => {
        expect(() => extractStage(text)).not.toThrow();
      });
    });
  });

  describe('真实数据回归测试', () => {

    test('应处理Cerebras Systems (G轮)', () => {
      const text = 'Cerebras Systems，2015年成立于美国加利福尼亚州Sunnyvale，生产人工智能芯片和硬件系统并提供云服务。完成11亿美元G轮融资';
      const result = extractStage(text);
      expect(result).toBe('G轮');
    });

    test('应处理Nscale (pre-IPO)', () => {
      const text = 'Nscale，2024年成立于英国伦敦，建设面向AI的数据中心与算力基础设施。完成4.33亿美元pre-IPO融资';
      const result = extractStage(text);
      expect(result).toBe('Pre-IPO');
    });

    test('应处理Vercel (F轮)', () => {
      const text = 'Vercel，2015年成立于美国旧金山，为开发者提供以AI为中心的云与前端基础设施。完成3亿美元F轮融资';
      const result = extractStage(text);
      expect(result).toBe('F轮');
    });

    test('应处理Periodic Labs (种子轮)', () => {
      const text = 'Periodic Labs，2025 年在美国（硅谷 / 旧金山地区）成立，AI 驱动的材料科学自动化实验平台。完成5,000万美元种子轮融资';
      const result = extractStage(text);
      expect(result).toBe('种子轮');
    });

    test('应处理Rebellions (C轮)', () => {
      const text = 'Rebellions，2020年成立于韩国城南市，开发节能的AI推理芯片。完成2.5亿美元C轮融资';
      const result = extractStage(text);
      expect(result).toBe('C轮');
    });
  });

  describe('性能测试', () => {

    test('应在合理时间内处理大量数据', () => {
      const texts = Array(1000).fill('完成1000万美元A轮融资');

      const startTime = Date.now();
      texts.forEach(text => extractStage(text));
      const endTime = Date.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(1000); // 应少于1秒
    });
  });
});

describe('extractStage() - 正则表达式匹配顺序测试', () => {

  test('Pre-Series应优先于普通轮次', () => {
    const text = '完成Pre-Series A轮融资';
    const result = extractStage(text);
    expect(result).toMatch(/Pre-A|Pre-Series A/);
    expect(result).not.toBe('A轮'); // 不应匹配为普通A轮
  });

  test('具体轮次应优先于战略融资', () => {
    const text = '完成战略A轮融资';
    const result = extractStage(text);
    expect(result).toBe('A轮'); // 应匹配为A轮,而非战略融资
  });
});

console.log('✅ Funding Daily单元测试加载完成');
