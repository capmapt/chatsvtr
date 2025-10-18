/**
 * 飞书富文本内容渲染器
 * 支持渲染段落、标题、列表、图片占位符、表格等
 */

class RichContentRenderer {
  constructor() {
    // 块类型映射
    this.BLOCK_TYPES = {
      1: 'page',         // 页面根节点
      2: 'text',         // 文本段落
      3: 'heading',      // 标题
      5: 'bullet',       // 无序列表项
      12: 'ordered',     // 有序列表项
      27: 'image',       // 图片
      30: 'table',       // 表格
      999: 'unknown'     // 未知类型
    };
  }

  /**
   * 渲染blocks为HTML
   * @param {Array} blocks - 飞书文档blocks数组
   * @param {String} documentId - 文档ID,用于获取图片
   */
  render(blocks, documentId = '') {
    if (!blocks || blocks.length === 0) {
      return '<p>暂无内容</p>';
    }

    this.documentId = documentId; // 保存documentId供图片渲染使用

    const htmlParts = [];
    let currentList = null; // 跟踪当前列表状态 {type: 'ul'|'ol', items: []}
    let imageCount = 0;
    let tableCount = 0;

    blocks.forEach((block, index) => {
      const type = this.BLOCK_TYPES[block.block_type] || 'unknown';

      // 处理列表结束
      if (type !== 'bullet' && type !== 'ordered' && currentList) {
        htmlParts.push(this.closeList(currentList));
        currentList = null;
      }

      switch (type) {
        case 'page':
          // 页面根节点,渲染标题
          if (block.page && block.page.elements) {
            const title = this.renderTextElements(block.page.elements);
            if (title) {
              htmlParts.push(`<h1 class="article-main-title">${title}</h1>`);
            }
          }
          break;

        case 'text':
          // 普通段落
          if (block.text && block.text.elements) {
            const content = this.renderTextElements(block.text.elements);
            if (content.trim()) {
              htmlParts.push(`<p>${content}</p>`);
            }
          }
          break;

        case 'heading':
          // 标题 (heading1-heading9)
          const headingLevel = this.getHeadingLevel(block);
          const headingKey = `heading${headingLevel}`;
          if (block[headingKey] && block[headingKey].elements) {
            const content = this.renderTextElements(block[headingKey].elements);
            const tag = `h${Math.min(headingLevel + 1, 6)}`; // h2-h6
            htmlParts.push(`<${tag}>${content}</${tag}>`);
          }
          break;

        case 'bullet':
          // 无序列表项
          if (!currentList || currentList.type !== 'ul') {
            if (currentList) htmlParts.push(this.closeList(currentList));
            currentList = { type: 'ul', items: [] };
          }
          if (block.bullet && block.bullet.elements) {
            const content = this.renderTextElements(block.bullet.elements);
            currentList.items.push(content);
          }
          break;

        case 'ordered':
          // 有序列表项
          if (!currentList || currentList.type !== 'ol') {
            if (currentList) htmlParts.push(this.closeList(currentList));
            currentList = { type: 'ol', items: [] };
          }
          if (block.ordered && block.ordered.elements) {
            const content = this.renderTextElements(block.ordered.elements);
            currentList.items.push(content);
          }
          break;

        case 'image':
          // 图片占位符
          imageCount++;
          const imageHtml = this.renderImagePlaceholder(block.image, imageCount);
          htmlParts.push(imageHtml);
          break;

        case 'table':
          // 表格占位符
          tableCount++;
          const tableHtml = this.renderTablePlaceholder(block.table, tableCount);
          htmlParts.push(tableHtml);
          break;

        default:
          // 未知类型,跳过
          break;
      }
    });

    // 关闭最后的列表
    if (currentList) {
      htmlParts.push(this.closeList(currentList));
    }

    // 添加图片/表格提示
    if (imageCount > 0 || tableCount > 0) {
      const notices = [];
      if (imageCount > 0) notices.push(`${imageCount}张图片`);
      if (tableCount > 0) notices.push(`${tableCount}个表格`);

      htmlParts.push(`
        <div class="rich-content-notice">
          <div class="notice-icon">📎</div>
          <div class="notice-content">
            <strong>本文包含${notices.join('、')}</strong>
            <p>点击下方"查看飞书原文"按钮以获得完整阅读体验</p>
          </div>
        </div>
      `);
    }

    return htmlParts.join('\n');
  }

  /**
   * 渲染文本元素(支持粗体、斜体、链接等格式)
   */
  renderTextElements(elements) {
    if (!elements || elements.length === 0) return '';

    return elements.map(element => {
      if (element.text_run) {
        const text = this.escapeHtml(element.text_run.content);
        const style = element.text_run.text_element_style;

        if (!style) return text;

        let html = text;

        // 应用样式
        if (style.bold) html = `<strong>${html}</strong>`;
        if (style.italic) html = `<em>${html}</em>`;
        if (style.underline) html = `<u>${html}</u>`;
        if (style.strikethrough) html = `<s>${html}</s>`;
        if (style.inline_code) html = `<code>${html}</code>`;

        // 处理链接
        if (element.text_run.link) {
          const url = this.escapeHtml(element.text_run.link.url);
          html = `<a href="${url}" target="_blank" rel="noopener noreferrer">${html}</a>`;
        }

        return html;
      }

      // 其他元素类型(如mention等)
      return '';
    }).join('');
  }

  /**
   * 获取标题级别
   */
  getHeadingLevel(block) {
    for (let i = 1; i <= 9; i++) {
      if (block[`heading${i}`]) return i;
    }
    return 1;
  }

  /**
   * 关闭列表
   */
  closeList(list) {
    const tag = list.type;
    const items = list.items.map(item => `  <li>${item}</li>`).join('\n');
    return `<${tag}>\n${items}\n</${tag}>`;
  }

  /**
   * 渲染图片占位符
   */
  renderImagePlaceholder(imageInfo, index) {
    if (!imageInfo) return '';

    const width = imageInfo.width || 800;
    const height = imageInfo.height || 600;
    const aspectRatio = Math.min(((height / width) * 100), 75).toFixed(2); // 最大高度75%避免太高
    const imageToken = imageInfo.token;

    // 显示友好的图片占位符
    // 注意: 飞书图片需要通过API认证访问,暂不直接加载
    return `
      <div class="rich-image-placeholder" style="position: relative; min-height: 200px; background: #f8f9fa; border-radius: 12px; padding: 30px; margin: 20px 0; border: 2px dashed #e0e0e0; text-align: center;">
        <div class="placeholder-content" style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px;">
          <div class="placeholder-icon" style="font-size: 3rem; opacity: 0.6;">🖼️</div>
          <div class="placeholder-text" style="color: #666;">
            <strong style="display: block; font-size: 1rem; margin-bottom: 4px;">图片 ${index}</strong>
            <span style="font-size: 0.875rem; color: #999;">${width} × ${height}px</span>
          </div>
          <p style="margin: 8px 0 0 0; font-size: 0.85rem; color: #888;">
            📷 图片包含在完整版文章中，点击下方"查看完整版"按钮查看
          </p>
        </div>
      </div>
    `;
  }

  /**
   * 初始化懒加载
   */
  initLazyLoad() {
    const images = document.querySelectorAll('.lazy-load');

    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.remove('lazy-load');
            observer.unobserve(img);
          }
        });
      }, {
        rootMargin: '50px' // 提前50px开始加载
      });

      images.forEach(img => imageObserver.observe(img));
    } else {
      // 不支持IntersectionObserver,直接加载所有图片
      images.forEach(img => {
        img.src = img.dataset.src;
        img.classList.remove('lazy-load');
      });
    }
  }

  /**
   * 渲染表格占位符或嵌入
   */
  renderTablePlaceholder(tableInfo, index) {
    if (!tableInfo) return '';

    const sheetToken = tableInfo.token;

    // 如果有sheet token,显示交互式提示
    if (this.documentId && sheetToken) {
      return `
        <div class="rich-table-container">
          <div class="table-header">
            <span class="table-icon">📊</span>
            <strong>表格 ${index}</strong>
          </div>
          <div class="table-preview">
            <p>此表格为飞书电子表格,包含复杂的数据和格式</p>
            <button
              class="btn-view-table"
              onclick="window.open('https://svtrglobal.feishu.cn/sheets/${sheetToken}', '_blank')"
            >
              🔗 在新标签页中打开表格
            </button>
          </div>
        </div>
      `;
    }

    // 回退到简单占位符
    return `
      <div class="rich-table-placeholder">
        <div class="placeholder-icon">📊</div>
        <div class="placeholder-text">
          <strong>表格 ${index}</strong>
          <span>请在飞书原文中查看</span>
        </div>
      </div>
    `;
  }

  /**
   * HTML转义
   */
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
}

// 导出为全局变量
if (typeof window !== 'undefined') {
  window.RichContentRenderer = RichContentRenderer;
}
