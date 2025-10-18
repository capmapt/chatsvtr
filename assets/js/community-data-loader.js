/**
 * SVTR内容社区数据加载器
 * 从飞书数据源加载真实文章数据并渲染到页面
 */

class CommunityDataLoader {
  constructor() {
    this.articles = [];
    this.dataUrl = '/assets/data/community-articles-v3.json';
    this.currentPage = 1;
    this.itemsPerPage = 20;
    this.richRenderer = new RichContentRenderer(); // 富文本渲染器
  }

  /**
   * 显示加载状态
   */
  showLoading(containerSelector = '#contentGrid') {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    container.innerHTML = `
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p class="loading-text">正在加载精彩内容...</p>
      </div>
    `;
  }

  /**
   * 显示错误状态
   */
  showError(containerSelector = '#contentGrid', message = '加载失败') {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    container.innerHTML = `
      <div class="error-state">
        <div class="error-icon">⚠️</div>
        <h3>加载失败</h3>
        <p>${this.escapeHtml(message)}</p>
        <button class="retry-btn" onclick="location.reload()">重新加载</button>
      </div>
    `;
  }

  /**
   * 初始化加载数据
   */
  async init(containerSelector = '#contentGrid') {
    try {
      console.log('📊 加载SVTR内容社区数据...');

      // 显示加载状态
      this.showLoading(containerSelector);

      const response = await fetch(this.dataUrl);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      this.articles = data.articles || [];

      console.log(`✅ 成功加载 ${this.articles.length} 篇文章`);
      console.log('📈 分类统计:', data.categories);

      return true;
    } catch (error) {
      console.error('❌ 数据加载失败:', error);
      this.showError(containerSelector, error.message);
      this.articles = [];
      return false;
    }
  }

  /**
   * 渲染文章卡片
   */
  renderArticles(containerSelector = '#contentGrid') {
    const container = document.querySelector(containerSelector);
    if (!container) {
      console.error('❌ 找不到容器元素:', containerSelector);
      return;
    }

    if (this.articles.length === 0) {
      console.warn('⚠️  没有文章数据可渲染');
      return;
    }

    // 清空现有内容
    container.innerHTML = '';

    // 渲染每篇文章
    this.articles.forEach(article => {
      const card = this.createArticleCard(article);
      container.appendChild(card);
    });

    console.log(`✅ 已渲染 ${this.articles.length} 篇文章`);
  }

  /**
   * 创建文章卡片元素
   */
  createArticleCard(article) {
    const card = document.createElement('article');
    card.className = 'article-card';

    // 设置数据属性用于筛选
    card.dataset.category = article.category || 'analysis';
    card.dataset.contentType = article.contentType || 'analysis';
    if (article.stage) card.dataset.stage = article.stage;
    if (article.layer) card.dataset.layer = article.layer;
    if (article.investment) card.dataset.investment = article.investment;

    // 生成标签HTML
    const tagsHtml = this.renderTags(article);

    // 生成融资信息HTML
    const fundingHtml = this.renderFundingInfo(article.fundingInfo);

    // 生成卡片HTML
    card.innerHTML = `
      <img src="../assets/images/placeholder-article.webp"
           alt="${this.escapeHtml(article.title)}"
           class="article-image"
           onerror="this.style.display='none'">
      <div class="article-content">
        <div class="article-tags">
          ${tagsHtml}
        </div>
        <h3 class="article-title">${this.escapeHtml(article.title)}</h3>
        ${fundingHtml}
        <p class="article-excerpt">${this.escapeHtml(this.truncateText(article.excerpt, 150))}</p>
        <div class="article-meta">
          <div class="article-author">
            <div class="author-avatar">${article.author.avatar}</div>
            <span>${this.escapeHtml(article.author.name)}</span>
          </div>
          <div class="article-meta-right">
            <span class="article-date">${article.date}</span>
            ${article.readingTime ? `<span class="reading-time">📖 ${article.readingTime}分钟</span>` : ''}
          </div>
        </div>
      </div>
    `;

    // 添加点击事件
    card.addEventListener('click', () => this.handleArticleClick(article));

    return card;
  }

  /**
   * 渲染融资信息
   */
  renderFundingInfo(fundingInfo) {
    if (!fundingInfo) return '';

    const badges = [];
    if (fundingInfo.amount) {
      badges.push(`<span class="funding-badge amount">💰 ${this.escapeHtml(fundingInfo.amount)}</span>`);
    }
    if (fundingInfo.round) {
      badges.push(`<span class="funding-badge round">🎯 ${this.escapeHtml(fundingInfo.round)}</span>`);
    }
    if (fundingInfo.valuation) {
      badges.push(`<span class="funding-badge valuation">📊 ${this.escapeHtml(fundingInfo.valuation)}</span>`);
    }

    if (badges.length === 0) return '';

    return `<div class="funding-info">${badges.join('')}</div>`;
  }

  /**
   * 渲染标签
   */
  renderTags(article) {
    const tags = [];

    // 优先显示内容类型标签(V2格式)
    if (article.contentTypeInfo) {
      tags.push({
        text: `${article.contentTypeInfo.icon} ${article.contentTypeInfo.name}`,
        class: 'tag-content-type',
        color: article.contentTypeInfo.color
      });
    } else if (article.category) {
      // 回退到旧分类标签
      const categoryLabels = {
        startups: '初创公司',
        public: '上市公司',
        analysis: '行业分析',
        investors: '投资机构'
      };
      tags.push({
        text: categoryLabels[article.category] || article.category,
        class: 'tag-primary'
      });
    }

    // 行业层次标签
    const layerLabels = {
      infrastructure: '基础层',
      model: '模型层',
      application: '应用层'
    };

    if (article.layer) {
      tags.push({
        text: layerLabels[article.layer] || article.layer,
        class: 'tag-secondary'
      });
    }

    // 细分赛道标签(V2格式优先)
    if (article.verticalTags && article.verticalTags.length > 0) {
      tags.push({
        text: article.verticalTags[0], // 取第一个细分赛道标签
        class: 'tag-vertical'
      });
    } else if (article.tags && article.tags.length > 0) {
      // 回退到旧技术标签
      tags.push({
        text: article.tags[0],
        class: 'tag-tech'
      });
    }

    // 阶段标签
    if (article.stage) {
      const stageLabels = {
        early: '早期阶段',
        growth: '成长期',
        unicorn: '独角兽',
        public: '上市'
      };

      tags.push({
        text: stageLabels[article.stage] || article.stage,
        class: 'tag-stage'
      });
    }

    // 生成标签HTML
    return tags
      .slice(0, 3) // 最多显示3个标签
      .map(tag => {
        const style = tag.color ? `style="background-color: ${tag.color}; color: white;"` : '';
        return `<span class="tag ${tag.class}" ${style}>${this.escapeHtml(tag.text)}</span>`;
      })
      .join('');
  }

  /**
   * 处理文章点击
   */
  handleArticleClick(article) {
    console.log('📖 打开文章:', article.title);

    // 显示文章详情模态框
    this.showArticleModal(article);
  }

  /**
   * 显示文章详情模态框
   */
  showArticleModal(article) {
    // 获取或创建模态框元素
    let modal = document.getElementById('articleModal');
    if (!modal) {
      modal = this.createArticleModal();
      document.body.appendChild(modal);
    }

    // 填充文章内容
    const modalTitle = modal.querySelector('.modal-article-title');
    const modalMeta = modal.querySelector('.modal-article-meta');
    const modalContent = modal.querySelector('.modal-article-content');
    const modalSource = modal.querySelector('.modal-article-source');

    modalTitle.textContent = article.title;

    // 元信息
    const categoryLabels = {
      startups: '初创公司',
      public: '上市公司',
      analysis: '行业分析',
      investors: '投资机构'
    };

    // 智能生成作者名称
    const authorName = this.generateAuthorName(article);

    modalMeta.innerHTML = `
      <span class="modal-category">${categoryLabels[article.category] || article.category}</span>
      <span class="modal-date">${article.date}</span>
      <span class="modal-author">作者: ${this.escapeHtml(authorName)}</span>
    `;

    // 文章正文 - 默认显示摘要版本
    let formattedContent;
    if (article.richBlocks && article.richBlocks.length > 0) {
      // 使用富文本blocks渲染,传入documentId用于获取图片
      const documentId = article.id || article.source?.url?.split('/').pop();
      formattedContent = this.richRenderer.render(article.richBlocks, documentId);
    } else {
      // 回退到旧的纯文本渲染
      formattedContent = this.formatArticleContent(article.content || article.excerpt);
    }
    modalContent.innerHTML = formattedContent;

    // 保存完整文章数据到模态框，供"查看完整版"功能使用
    modal.dataset.articleData = JSON.stringify(article);

    // 初始化懒加载
    setTimeout(() => {
      if (this.richRenderer && typeof this.richRenderer.initLazyLoad === 'function') {
        this.richRenderer.initLazyLoad();
      }
    }, 100);

    // 来源链接和完整版按钮
    if (article.source && article.source.url) {
      const hasRichMedia = article.richMeta && (article.richMeta.hasImages || article.richMeta.hasTables);
      const richMediaHint = hasRichMedia ?
        `<span class="rich-media-hint">📷 包含${article.richMeta.hasImages ? article.richBlocks.filter(b => b.block_type === 27).length + '张图片' : ''}${article.richMeta.hasImages && article.richMeta.hasTables ? '、' : ''}${article.richMeta.hasTables ? article.richBlocks.filter(b => b.block_type === 30).length + '个表格' : ''}</span>` : '';

      modalSource.innerHTML = `
        <div class="modal-source-actions">
          ${richMediaHint}
          <a href="${article.source.url}" target="_blank" rel="noopener noreferrer" class="btn-view-full">
            🔍 查看完整版(含图片和表格)
          </a>
        </div>
        <div style="margin-top: 12px; padding: 12px; background: #f8f9fa; border-radius: 8px; font-size: 0.85rem; color: #666;">
          💡 <strong>提示:</strong> 点击上方按钮在飞书中查看包含所有图片和表格的完整文章
        </div>
      `;
    } else {
      modalSource.innerHTML = '';
    }

    // 显示模态框
    modal.classList.add('show');
    document.body.style.overflow = 'hidden'; // 防止背景滚动
  }

  /**
   * 智能生成作者名称
   */
  generateAuthorName(article) {
    // 根据contentType生成更合适的作者名
    const contentTypeAuthors = {
      'funding_news': 'SVTR 融资观察',
      'company_profile': 'SVTR 研究团队',
      'analysis': 'SVTR 分析师',
      'ranking': 'SVTR 数据中心',
      'weekly': 'SVTR 编辑部',
      'research_report': 'SVTR 研究院'
    };

    // 优先使用contentType匹配
    if (article.contentType && contentTypeAuthors[article.contentType]) {
      return contentTypeAuthors[article.contentType];
    }

    // 根据标题关键词智能判断
    const title = article.title || '';
    if (title.includes('融资') || title.includes('获投') || title.includes('轮')) {
      return 'SVTR 融资观察';
    }
    if (title.includes('榜单') || title.includes('排行') || title.includes('Top')) {
      return 'SVTR 数据中心';
    }
    if (title.includes('周报') || title.includes('月报') || title.includes('季报')) {
      return 'SVTR 编辑部';
    }
    if (title.includes('分析') || title.includes('观察') || title.includes('趋势')) {
      return 'SVTR 分析师';
    }
    if (title.includes('公司') || title.includes('企业') || title.match(/[A-Z][a-z]+/)) {
      return 'SVTR 研究团队';
    }

    // 默认回退到原始作者名或SVTR编辑部
    return article.author?.name || 'SVTR 编辑部';
  }

  /**
   * 格式化文章内容
   */
  formatArticleContent(content) {
    if (!content) return '<p>暂无内容</p>';

    // 将换行符转换为段落
    const paragraphs = content
      .split('\n')
      .filter(p => p.trim().length > 0)
      .map(p => {
        p = p.trim();

        // 检测图片引用 (image.png, xxx.jpg, etc.)
        if (p.match(/^[a-zA-Z0-9_\-]+\.(png|jpg|jpeg|gif|webp|svg)$/i)) {
          return `<div class="article-image-placeholder">📷 图片: ${this.escapeHtml(p)}</div>`;
        }

        // 检测Markdown图片语法 ![alt](url)
        if (p.match(/^!\[.*\]\(.*\)$/)) {
          const match = p.match(/!\[(.*?)\]\((.*?)\)/);
          if (match) {
            const alt = match[1] || '图片';
            return `<div class="article-image-placeholder">📷 ${this.escapeHtml(alt)}</div>`;
          }
        }

        // 检测标题（以#开头）
        if (p.startsWith('#')) {
          const level = p.match(/^#+/)[0].length;
          const text = p.replace(/^#+\s*/, '');
          return `<h${Math.min(level + 1, 6)}>${this.escapeHtml(text)}</h${Math.min(level + 1, 6)}>`;
        }

        // 检测列表项
        if (p.match(/^[•\-\*]\s/)) {
          return `<li>${this.escapeHtml(p.replace(/^[•\-\*]\s/, ''))}</li>`;
        }

        // 检测数字列表
        if (p.match(/^\d+[\.\)]\s/)) {
          return `<li>${this.escapeHtml(p.replace(/^\d+[\.\)]\s/, ''))}</li>`;
        }

        // 检测视频/媒体文件引用
        if (p.match(/\.(mp4|mov|avi|webm)$/i)) {
          return `<div class="article-media-placeholder">🎬 视频: ${this.escapeHtml(p)}</div>`;
        }

        // 普通段落 - 检测是否过短（可能是小标题但没有#）
        if (p.length < 50 && !p.includes('。') && !p.includes('.') && !p.match(/\d/)) {
          return `<h4>${this.escapeHtml(p)}</h4>`;
        }

        // 普通段落
        return `<p>${this.escapeHtml(p)}</p>`;
      })
      .join('');

    return paragraphs;
  }


  /**
   * 创建文章模态框
   */
  createArticleModal() {
    const modal = document.createElement('div');
    modal.id = 'articleModal';
    modal.className = 'article-modal';

    modal.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal-container">
        <div class="modal-header">
          <h2 class="modal-article-title"></h2>
          <button class="modal-close" aria-label="关闭">&times;</button>
        </div>
        <div class="modal-article-meta"></div>
        <div class="modal-body">
          <div class="modal-article-content"></div>
        </div>
        <div class="modal-footer">
          <div class="modal-article-source"></div>
        </div>
      </div>
    `;

    // 关闭按钮事件
    const closeBtn = modal.querySelector('.modal-close');
    const overlay = modal.querySelector('.modal-overlay');

    const closeModal = () => {
      modal.classList.remove('show');
      document.body.style.overflow = ''; // 恢复背景滚动
    };

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);

    // ESC键关闭
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('show')) {
        closeModal();
      }
    });

    return modal;
  }

  /**
   * 获取筛选后的文章
   */
  filterArticles(filters = {}) {
    return this.articles.filter(article => {
      // 分类筛选
      if (filters.category && filters.category !== 'all') {
        if (article.category !== filters.category) return false;
      }

      // 阶段筛选
      if (filters.stage) {
        if (article.stage !== filters.stage) return false;
      }

      // 层次筛选
      if (filters.layer) {
        if (article.layer !== filters.layer) return false;
      }

      // 投资类型筛选
      if (filters.investment) {
        if (article.investment !== filters.investment) return false;
      }

      // 搜索筛选
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const titleMatch = article.title.toLowerCase().includes(searchLower);
        const excerptMatch = article.excerpt.toLowerCase().includes(searchLower);
        const tagsMatch = article.tags && article.tags.some(tag =>
          tag.toLowerCase().includes(searchLower)
        );

        if (!titleMatch && !excerptMatch && !tagsMatch) return false;
      }

      return true;
    });
  }

  /**
   * 截断文本
   */
  truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;

    return text.substring(0, maxLength).trim() + '...';
  }

  /**
   * HTML转义
   */
  escapeHtml(text) {
    if (!text) return '';

    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 分页数据
   */
  paginateArticles(articles, page = 1, perPage = 20) {
    const start = (page - 1) * perPage;
    const end = start + perPage;
    return articles.slice(start, end);
  }

  /**
   * 获取总页数
   */
  getTotalPages(totalItems, perPage = 20) {
    return Math.ceil(totalItems / perPage);
  }

  /**
   * 渲染分页控件
   */
  renderPagination(totalItems, currentPage, containerSelector = '#pagination') {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const totalPages = this.getTotalPages(totalItems, this.itemsPerPage);

    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    let paginationHTML = '<div class="pagination">';

    // 上一页
    if (currentPage > 1) {
      paginationHTML += `<button class="page-btn" data-page="${currentPage - 1}">上一页</button>`;
    }

    // 页码
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 2 && i <= currentPage + 2)
      ) {
        const activeClass = i === currentPage ? 'active' : '';
        paginationHTML += `<button class="page-btn ${activeClass}" data-page="${i}">${i}</button>`;
      } else if (i === currentPage - 3 || i === currentPage + 3) {
        paginationHTML += '<span class="page-ellipsis">...</span>';
      }
    }

    // 下一页
    if (currentPage < totalPages) {
      paginationHTML += `<button class="page-btn" data-page="${currentPage + 1}">下一页</button>`;
    }

    paginationHTML += '</div>';
    container.innerHTML = paginationHTML;
  }

  /**
   * 获取统计数据
   */
  getStats() {
    return {
      total: this.articles.length,
      startups: this.articles.filter(a => a.category === 'startups').length,
      public: this.articles.filter(a => a.category === 'public').length,
      analysis: this.articles.filter(a => a.category === 'analysis').length,
      investors: this.articles.filter(a => a.category === 'investors').length,
      byLayer: {
        infrastructure: this.articles.filter(a => a.layer === 'infrastructure').length,
        model: this.articles.filter(a => a.layer === 'model').length,
        application: this.articles.filter(a => a.layer === 'application').length
      },
      byStage: {
        early: this.articles.filter(a => a.stage === 'early').length,
        growth: this.articles.filter(a => a.stage === 'growth').length,
        unicorn: this.articles.filter(a => a.stage === 'unicorn').length,
        public: this.articles.filter(a => a.stage === 'public').length
      }
    };
  }
}

// 导出为全局变量
if (typeof window !== 'undefined') {
  window.CommunityDataLoader = CommunityDataLoader;
}
