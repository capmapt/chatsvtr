/**
 * 创投日报功能模块
 * 负责加载、显示和管理融资信息
 */

(function() {
  'use strict';

  // 🏗️ 模拟融资数据 - 实际项目中应从API获取
  const mockFundingData = [
    {
      id: 'fd001',
      companyName: 'MindBridge AI',
      stage: 'Series A',
      amount: 25000000,
      currency: 'USD',
      description: '专注医疗AI诊断的创新公司，其AI影像识别技术已在多家三甲医院部署使用，准确率达95%以上。',
      tags: ['医疗AI', '影像识别', '诊断'],
      investedAt: '2025-01-17T15:30:00Z',
      investors: ['红杉资本中国', 'IDG资本']
    },
    {
      id: 'fd002',
      companyName: 'QuantumSecure',
      stage: 'Seed',
      amount: 8000000,
      currency: 'USD',
      description: '量子加密通信技术领军企业，为金融机构提供下一代安全通信解决方案。',
      tags: ['量子技术', '网络安全', '金融科技'],
      investedAt: '2025-01-17T11:20:00Z',
      investors: ['经纬中国', '真格基金']
    },
    {
      id: 'fd003',
      companyName: 'EcoLogistics Pro',
      stage: 'Series B',
      amount: 45000000,
      currency: 'USD',
      description: '智能物流平台，通过AI优化配送路线，已帮助客户降低30%物流成本，覆盖全国200+城市。',
      tags: ['智能物流', 'AI优化', '绿色配送'],
      investedAt: '2025-01-17T09:45:00Z',
      investors: ['高瓴资本', '顺为资本', '小米集团']
    },
    {
      id: 'fd004',
      companyName: 'BrainFlow Analytics',
      stage: 'Pre-A',
      amount: 12000000,
      currency: 'USD',
      description: '专业数据分析平台，为企业提供实时商业智能解决方案，客户包括多家Fortune 500公司。',
      tags: ['数据分析', '商业智能', '企业服务'],
      investedAt: '2025-01-16T16:15:00Z',
      investors: ['启明创投', '华创资本']
    },
    {
      id: 'fd005',
      companyName: 'NeuralCloud',
      stage: 'Series A',
      amount: 18000000,
      currency: 'USD',
      description: '云端AI推理平台，为中小企业提供低成本AI计算服务，已服务超过1000家企业客户。',
      tags: ['云计算', 'AI推理', '企业服务'],
      investedAt: '2025-01-16T14:20:00Z',
      investors: ['GGV纪源资本', '蓝驰创投']
    },
    {
      id: 'fd006',
      companyName: 'RoboFarm Tech',
      stage: 'Seed',
      amount: 6000000,
      currency: 'USD',
      description: '农业机器人技术公司，开发智能农业设备，提高农业生产效率，已在多个农业基地试点。',
      tags: ['农业科技', '机器人', '智能农业'],
      investedAt: '2025-01-16T10:30:00Z',
      investors: ['创新工场', '险峰长青']
    },
    {
      id: 'fd007',
      companyName: 'VoiceAI Pro',
      stage: 'Pre-A',
      amount: 9000000,
      currency: 'USD',
      description: '语音AI技术公司，专注多语言语音识别和合成，为客服、教育等行业提供解决方案。',
      tags: ['语音AI', '多语言', '客服'],
      investedAt: '2025-01-15T16:45:00Z',
      investors: ['五源资本', '源码资本']
    }
  ];

  // 🌊 瀑布流相关变量
  let currentDisplayCount = 3; // 当前显示的数量
  let isLoadingMore = false; // 是否正在加载更多

  // 🎨 融资阶段标签映射
  const stageLabels = {
    'Pre-Seed': '种子前',
    'Seed': '种子轮',
    'Pre-A': 'Pre-A轮',
    'Series A': 'A轮',
    'Series B': 'B轮',
    'Series C': 'C轮',
    'Series D': 'D轮',
    'IPO': 'IPO'
  };

  // 💰 格式化金额显示
  function formatAmount(amount, currency = 'USD') {
    const amountInM = amount / 1000000;
    const symbol = currency === 'USD' ? '$' : '¥';

    if (amountInM >= 1000) {
      return `${symbol}${(amountInM / 1000).toFixed(1)}B`;
    } else if (amountInM >= 1) {
      return `${symbol}${amountInM.toFixed(1)}M`;
    } else {
      return `${symbol}${(amount / 1000).toFixed(0)}K`;
    }
  }

  // ⏰ 格式化时间显示
  function formatTimeAgo(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now - time) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return '刚刚';
    } else if (diffInHours < 24) {
      return `${diffInHours}小时前`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}天前`;
    }
  }

  // 🏗️ 生成融资信息卡片HTML
  function createFundingItemHTML(item) {
    const formattedAmount = formatAmount(item.amount, item.currency);
    const stageLabel = stageLabels[item.stage] || item.stage;
    const timeAgo = formatTimeAgo(item.investedAt);
    const tagsHTML = item.tags.map(tag => `<span class="funding-tag">${tag}</span>`).join('');

    return `
      <div class="funding-item" data-funding-id="${item.id}">
        <div class="funding-company">
          <h3 class="company-name">${item.companyName}</h3>
          <span class="company-stage">${stageLabel}</span>
        </div>

        <div class="funding-amount">
          <span class="amount-currency">${item.currency}</span>
          ${formattedAmount}
        </div>

        <p class="funding-description">${item.description}</p>

        <div class="funding-meta">
          <div class="funding-tags">${tagsHTML}</div>
          <span class="funding-time">${timeAgo}</span>
        </div>
      </div>
    `;
  }

  // 📊 加载融资数据
  async function loadFundingData(reset = true) {
    const container = document.getElementById('fundingHighlights');

    if (!container) {
      console.warn('创投日报容器未找到');
      return;
    }

    try {
      // 如果是重置，显示加载状态
      if (reset) {
        container.innerHTML = `
          <div class="funding-loading">
            <span class="loading-icon">⏳</span>
            <span data-i18n="funding_loading">正在加载最新融资信息...</span>
          </div>
        `;

        // 重置显示数量
        currentDisplayCount = 3;
      }

      // 从飞书API获取真实数据
      let fundingData = [];

      try {
        const response = await fetch('/api/funding-daily-sync');
        const result = await response.json();

        if (result.success && result.data) {
          fundingData = result.data;
          console.log(`✅ 从${result.source}获取到 ${result.count} 条融资数据`);
        } else {
          throw new Error(result.message || '数据获取失败');
        }
      } catch (apiError) {
        console.warn('⚠️ API数据获取失败，使用备用数据:', apiError);
        // 如果API失败，fallback到模拟数据
        fundingData = mockFundingData;
      }

      // 按时间排序并截取当前显示数量
      const recentFunding = fundingData.slice(0, currentDisplayCount);

      if (recentFunding.length === 0) {
        container.innerHTML = `
          <div class="funding-empty">
            <span>📋</span>
            <p>暂无最新融资信息</p>
          </div>
        `;
        return;
      }

      // 生成HTML
      const fundingHTML = recentFunding.map(createFundingItemHTML).join('');

      // 添加加载更多按钮（如果还有更多数据）
      const loadMoreHTML = currentDisplayCount < fundingData.length ? `
        <div class="funding-load-more">
          <button class="load-more-btn" onclick="window.fundingDaily.loadMoreFunding()">
            <span class="load-more-icon">➕</span>
            <span data-i18n="funding_load_more">查看更多融资信息</span>
          </button>
        </div>
      ` : '';

      // 将当前数据存储到全局变量，供loadMoreFunding使用
      window.currentFundingData = fundingData;

      container.innerHTML = fundingHTML + loadMoreHTML;

      // 添加点击事件
      addFundingItemClickHandlers();

      console.log(`✅ 创投日报加载完成，显示 ${recentFunding.length} 条融资信息`);

    } catch (error) {
      console.error('❌ 创投日报加载失败:', error);
      container.innerHTML = `
        <div class="funding-error">
          <span>⚠️</span>
          <p>加载失败，请稍后重试</p>
          <button onclick="window.fundingDaily.loadFundingData()" class="retry-btn">重新加载</button>
        </div>
      `;
    }
  }

  // 🌊 加载更多融资信息
  async function loadMoreFunding() {
    if (isLoadingMore) return;

    isLoadingMore = true;
    const loadMoreBtn = document.querySelector('.load-more-btn');

    if (loadMoreBtn) {
      loadMoreBtn.innerHTML = `
        <span class="loading-icon">⏳</span>
        <span>加载中...</span>
      `;
      loadMoreBtn.disabled = true;
    }

    try {
      // 模拟加载延迟
      await new Promise(resolve => setTimeout(resolve, 800));

      // 使用当前存储的数据或fallback到模拟数据
      const availableData = window.currentFundingData || mockFundingData;

      // 增加显示数量
      currentDisplayCount = Math.min(currentDisplayCount + 3, availableData.length);

      // 重新渲染（不重置）
      await loadFundingData(false);

    } catch (error) {
      console.error('❌ 加载更多融资信息失败:', error);
    } finally {
      isLoadingMore = false;
    }
  }

  // 🖱️ 添加融资卡片点击事件
  function addFundingItemClickHandlers() {
    const fundingItems = document.querySelectorAll('.funding-item');

    fundingItems.forEach(item => {
      item.addEventListener('click', function() {
        const fundingId = this.dataset.fundingId;
        handleFundingItemClick(fundingId);
      });

      // 增强可访问性
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
      item.setAttribute('aria-label', `查看 ${item.querySelector('.company-name').textContent} 的融资详情`);

      // 键盘支持
      item.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.click();
        }
      });
    });
  }

  // 📱 融资卡片点击处理
  function handleFundingItemClick(fundingId) {
    // 使用当前存储的数据或fallback到模拟数据
    const availableData = window.currentFundingData || mockFundingData;
    const fundingItem = availableData.find(item => item.id === fundingId);

    if (!fundingItem) {
      console.error('未找到融资信息:', fundingId);
      return;
    }

    // 简单的详情显示 - 实际项目中可能跳转到详情页
    const message = `
🏢 ${fundingItem.companyName}
💰 ${formatAmount(fundingItem.amount, fundingItem.currency)} (${stageLabels[fundingItem.stage] || fundingItem.stage})
📝 ${fundingItem.description}
💼 投资方: ${fundingItem.investors.join(', ')}
    `.trim();

    // 显示详情（可以改为模态框或跳转页面）
    if (confirm(`${message}\n\n是否查看完整日报？`)) {
      // 跳转到完整日报页面
      window.location.href = 'pages/funding-daily.html';
    }
  }

  // 🔄 刷新数据
  function refreshFundingData() {
    console.log('🔄 刷新创投日报数据...');
    currentDisplayCount = 3; // 重置为3条
    loadFundingData(true);
  }

  // 🚀 初始化函数
  function initializeFundingDaily() {
    console.log('🚀 初始化创投日报模块...');

    // 检查必要元素是否存在
    const container = document.getElementById('fundingHighlights');
    if (!container) {
      console.warn('⚠️ 创投日报容器未找到，跳过初始化');
      return;
    }

    // 立即加载数据
    loadFundingData(true);

    // 设置定时刷新（每30分钟）
    const refreshInterval = 30 * 60 * 1000; // 30分钟
    setInterval(refreshFundingData, refreshInterval);

    console.log('✅ 创投日报初始化完成');
  }

  // 🌐 暴露公共接口
  window.fundingDaily = {
    loadFundingData,
    loadMoreFunding,
    refreshFundingData,
    initialize: initializeFundingDaily
  };

  // 📱 DOM就绪时初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFundingDaily);
  } else {
    // DOM已经加载完成
    initializeFundingDaily();
  }

})();