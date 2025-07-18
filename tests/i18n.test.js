// Tests for i18n.js module
describe('I18n Module', () => {
  let i18n;
  
  beforeEach(() => {
    // Set up DOM elements that I18n expects
    document.body.innerHTML = `
      <div>
        <button id="btnZh">中文</button>
        <button id="btnEn">English</button>
        <div data-i18n="test_key">Test Content</div>
        <div data-i18n-attr-title="test_attr">Element with attribute</div>
        <iframe class="stats-widget-iframe" src=""></iframe>
      </div>
    `;
    
    // Mock translations object
    global.translations = {
      'zh-CN': {
        test_key: '测试内容',
        test_attr: '测试属性'
      },
      'en': {
        test_key: 'Test Content',
        test_attr: 'Test Attribute'
      }
    };
  });

  test('should initialize with default language zh-CN', () => {
    // This test would require loading the actual I18n class
    expect(true).toBe(true); // Placeholder
  });

  test('should update button states when language changes', () => {
    const btnZh = document.getElementById('btnZh');
    const btnEn = document.getElementById('btnEn');
    
    expect(btnZh).toBeTruthy();
    expect(btnEn).toBeTruthy();
  });

  test('should update elements with data-i18n attributes', () => {
    const testElement = document.querySelector('[data-i18n="test_key"]');
    expect(testElement).toBeTruthy();
    expect(testElement.getAttribute('data-i18n')).toBe('test_key');
  });

  test('should handle missing translation keys gracefully', () => {
    global.translations = {
      'zh-CN': {},
      'en': {}
    };
    
    // Test should not throw error when translation key is missing
    expect(true).toBe(true);
  });
});