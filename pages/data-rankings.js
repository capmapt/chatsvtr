/**
 * SVTR AI创投数据榜单
 * 数据加载、可视化、交互功能
 */

class DataRankings {
    constructor() {
        this.allData = [];
        this.filteredData = [];
        this.currentPage = 1;
        this.itemsPerPage = 20;

        this.charts = {
            funding: null,
            category: null
        };

        this.init();
    }

    async init() {
        console.log('📊 初始化数据榜单...');

        // 设置认证监听器
        this.setupAuthListeners();

        // 加载数据
        await this.loadData();

        // 初始化Chart.js
        this.initCharts();

        // 绑定事件
        this.bindEvents();

        // 初始渲染
        this.applyFilters();
    }

    /**
     * 加载数据（从SVTR AI创投库）
     */
    async loadData() {
        try {
            const response = await fetch('/assets/data/startup-companies.json');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();
            const companies = result.data || [];

            // 转换为榜单格式
            this.allData = companies
                .filter(company => {
                    // 过滤出有融资金额的公司
                    const amount = company['金额\n（万美元）'] || company['金额（万美元）'];
                    return amount && amount.trim() !== '';
                })
                .map((company, index) => {
                    // 解析标签字符串
                    const rawTags = company['标签'] || '';
                    const parsedTags = rawTags ? rawTags.split(',').map(t => t.trim()).filter(t => t) : [];

                    return {
                        id: `company-${index}`,
                        rank: index + 1,
                        name: company['公司名称'] || '未知公司',
                        excerpt: company['主要业务'] || '',
                        category: company['二级分类'] || company['细分领域'] || '应用层',
                        fundingAmount: this.parseFundingAmount(company['金额\n（万美元）'] || company['金额（万美元）']),
                        fundingAmountDisplay: this.formatFundingDisplay(company['金额\n（万美元）'] || company['金额（万美元）']),
                        round: '未知',
                        date: company['成立时间'] || '',
                        location: company['成立地点'] || '',
                        valuation: company['估值\n（亿美元）'] || company['估值（亿美元）'] || '',
                        investors: company['投资方'] || '',
                        tags: [company['细分领域']].filter(Boolean),
                        verticalTags: [company['二级分类']].filter(Boolean),
                        keywords: parsedTags, // 添加关键词标签
                        weeklyReport: company['周报'] || '',
                        monthlyReport: company['月度'] || '',
                        quarterlyReport: company['季度'] || '',
                        yearlyReport: company['年度'] || '',
                        source: 'SVTR AI创投库',
                        ragScore: 0
                    };
                })
                .sort((a, b) => b.fundingAmount - a.fundingAmount)
                .map((item, index) => ({ ...item, rank: index + 1 }));

            console.log(`✅ 加载了 ${this.allData.length} 条融资数据（来自${companies.length}家公司）`);

            // 更新统计数据
            this.updateStats();

            // 生成动态筛选选项
            this.populateFilterOptions();

            // 更新最后更新时间
            document.getElementById('lastUpdate').textContent =
                new Date(result.summary?.lastUpdated || new Date()).toLocaleString('zh-CN');

        } catch (error) {
            console.error('❌ 数据加载失败:', error);
            this.showError('数据加载失败，请刷新页面重试');
        }
    }

    /**
     * 格式化融资金额显示
     */
    formatFundingDisplay(amount) {
        if (!amount || amount.trim() === '') return '未知';

        const numAmount = parseFloat(amount);
        if (isNaN(numAmount)) return amount;

        // 万美元转换为亿美元
        if (numAmount >= 10000) {
            return `${(numAmount / 10000).toFixed(2)}亿美元`;
        }
        return `${numAmount}万美元`;
    }

    /**
     * 映射分类
     */
    mapCategory(category) {
        const categoryMap = {
            'funding_news': '应用层',
            'company_profile': '应用层',
            'analysis': '综合分析',
            'infra': '基础层',
            'infrastructure': '基础层',
            'model': '模型层',
            'application': '应用层',
            'app': '应用层'
        };

        return categoryMap[category] || '应用层';
    }

    /**
     * 解析融资金额（转换为数字，单位：亿美元）
     */
    parseFundingAmount(amountStr) {
        if (!amountStr) return 0;

        // 移除空格和中文字符
        const cleanStr = amountStr.replace(/[亿美元万]/g, '').trim();

        // 提取数字
        const match = cleanStr.match(/[\d.]+/);
        if (!match) return 0;

        const number = parseFloat(match[0]);

        // 判断单位
        if (amountStr.includes('亿')) {
            return number;
        } else if (amountStr.includes('万')) {
            return number / 10000;
        }

        return number;
    }

    /**
     * 更新统计数据
     */
    updateStats() {
        const totalFunding = this.allData.reduce((sum, item) => sum + item.fundingAmount, 0);
        const avgFunding = totalFunding / this.allData.length;
        const unicorns = this.allData.filter(item =>
            item.tags.some(tag => tag.includes('独角兽') || tag.includes('Unicorn'))
        ).length;

        document.getElementById('totalFunding').textContent = `${totalFunding.toFixed(0)} 亿美元`;
        document.getElementById('totalCompanies').textContent = this.allData.length;
        document.getElementById('avgFunding').textContent = `${avgFunding.toFixed(1)} 亿美元`;
        document.getElementById('unicorns').textContent = unicorns;
    }

    /**
     * 生成动态筛选选项
     */
    populateFilterOptions() {
        // 定义25个细分赛道
        const standardCategories = [
            '算力', '算法', '数据',
            '垂类模型', '大模型', '优化测评', '智能体', '开发平台',
            '生命科学', '企业服务', '金融服务', '安全合规', '机器人',
            '零售营销', '开发者', '效率工具', '社交文娱', '双碳环保',
            '垂类行业', '法律服务', '汽车物流', '教育培训', '国防安防',
            '地产科技', '工业制造', '智能硬件'
        ];

        // 生成细分赛道选项
        const subCategoryFilter = document.getElementById('subCategoryFilter');
        if (subCategoryFilter) {
            // 清除现有选项(保留"全部赛道")
            while (subCategoryFilter.options.length > 1) {
                subCategoryFilter.remove(1);
            }

            // 添加25个标准赛道选项
            standardCategories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                subCategoryFilter.appendChild(option);
            });

            console.log(`✅ 生成了 ${standardCategories.length} 个细分赛道选项`);
        }

        // 生成地域选项
        const locations = new Set();
        this.allData.forEach(item => {
            if (item.location && item.location.trim()) {
                locations.add(item.location.trim());
            }
        });

        const locationFilter = document.getElementById('locationFilter');
        const sortedLocations = Array.from(locations).sort();

        // 清除现有选项(保留"全部地域")
        while (locationFilter.options.length > 1) {
            locationFilter.remove(1);
        }

        // 添加地域选项
        sortedLocations.forEach(location => {
            const option = document.createElement('option');
            option.value = location;
            option.textContent = location;
            locationFilter.appendChild(option);
        });

        console.log(`✅ 生成了 ${sortedLocations.length} 个地域筛选选项`);
    }

    /**
     * 初始化Chart.js图表
     */
    initCharts() {
        try {
            console.log('📊 开始初始化图表...');
            this.initFundingChart();
            this.initCategoryChart();
            this.initLocationChart();
            this.initTimelineChart();
            this.initSubCategoryChart();
            this.initWeeklyChart();
            this.initFundingDateChart();
            this.initTagsChart();
            console.log('✅ 所有图表初始化完成');
        } catch (error) {
            console.error('❌ 图表初始化失败:', error);
            // 即使图表失败，也要继续显示表格
        }
    }

    /**
     * 融资额分布图
     */
    initFundingChart() {
        const ctx = document.getElementById('fundingChart');
        if (!ctx) return;

        // 按融资额分组
        const ranges = [
            { label: '< 1亿', min: 0, max: 1, count: 0 },
            { label: '1-5亿', min: 1, max: 5, count: 0 },
            { label: '5-10亿', min: 5, max: 10, count: 0 },
            { label: '10-50亿', min: 10, max: 50, count: 0 },
            { label: '> 50亿', min: 50, max: Infinity, count: 0 }
        ];

        this.allData.forEach(item => {
            const range = ranges.find(r => item.fundingAmount >= r.min && item.fundingAmount < r.max);
            if (range) range.count++;
        });

        this.charts.funding = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ranges.map(r => r.label),
                datasets: [{
                    label: '公司数量',
                    data: ranges.map(r => r.count),
                    backgroundColor: 'rgba(99, 102, 241, 0.6)',
                    borderColor: 'rgba(99, 102, 241, 1)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        labels: {
                            color: '#cbd5e1'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#f1f5f9',
                        bodyColor: '#cbd5e1',
                        borderColor: '#334155',
                        borderWidth: 1
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#94a3b8',
                            precision: 0
                        },
                        grid: {
                            color: 'rgba(51, 65, 85, 0.5)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#94a3b8'
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    /**
     * AI三层架构分布图
     */
    initCategoryChart() {
        const ctx = document.getElementById('categoryChart');
        if (!ctx) return;

        // 统计三层架构：基础层、模型层、应用层
        const layerCount = {
            '基础层': 0,
            '模型层': 0,
            '应用层': 0
        };

        this.allData.forEach(item => {
            const layer = item.tags && item.tags.length > 0 ? item.tags[0] : '';
            if (layerCount.hasOwnProperty(layer)) {
                layerCount[layer]++;
            } else if (layer.includes('基础')) {
                layerCount['基础层']++;
            } else if (layer.includes('模型')) {
                layerCount['模型层']++;
            } else {
                layerCount['应用层']++;
            }
        });

        const labels = Object.keys(layerCount);
        const data = Object.values(layerCount);

        this.charts.category = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.7)',   // 基础层 - 蓝色
                        'rgba(16, 185, 129, 0.7)',   // 模型层 - 绿色
                        'rgba(245, 158, 11, 0.7)'    // 应用层 - 橙色
                    ],
                    borderColor: [
                        'rgba(59, 130, 246, 1)',
                        'rgba(16, 185, 129, 1)',
                        'rgba(245, 158, 11, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#cbd5e1',
                            padding: 15,
                            font: {
                                size: 13,
                                weight: '500'
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#f1f5f9',
                        bodyColor: '#cbd5e1',
                        borderColor: '#334155',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value}家公司 (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * 地域分布图
     */
    initLocationChart() {
        const ctx = document.getElementById('locationChart');
        if (!ctx) return;

        // 统计各地域数量
        const locationCount = {};
        this.allData.forEach(item => {
            if (item.location && item.location.trim()) {
                const loc = item.location.trim();
                locationCount[loc] = (locationCount[loc] || 0) + 1;
            }
        });

        // 取前10个
        const sorted = Object.entries(locationCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        const labels = sorted.map(([loc]) => loc);
        const data = sorted.map(([, count]) => count);

        this.charts.location = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: '公司数量',
                    data: data,
                    backgroundColor: 'rgba(34, 197, 94, 0.6)',
                    borderColor: 'rgba(34, 197, 94, 1)',
                    borderWidth: 2
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        labels: {
                            color: '#cbd5e1'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#f1f5f9',
                        bodyColor: '#cbd5e1',
                        borderColor: '#334155',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            color: '#94a3b8',
                            precision: 0
                        },
                        grid: {
                            color: 'rgba(51, 65, 85, 0.5)'
                        }
                    },
                    y: {
                        ticks: {
                            color: '#94a3b8'
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    /**
     * 成立时间趋势图
     */
    initTimelineChart() {
        const ctx = document.getElementById('timelineChart');
        if (!ctx) return;

        // 统计各年份数量
        const yearCount = {};
        this.allData.forEach(item => {
            if (item.date && item.date.trim()) {
                const year = item.date.trim().substring(0, 4);
                if (year && year >= '2000' && year <= '2025') {
                    yearCount[year] = (yearCount[year] || 0) + 1;
                }
            }
        });

        // 排序
        const sorted = Object.entries(yearCount)
            .sort((a, b) => a[0].localeCompare(b[0]));

        const labels = sorted.map(([year]) => year);
        const data = sorted.map(([, count]) => count);

        this.charts.timeline = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: '成立公司数',
                    data: data,
                    borderColor: 'rgba(99, 102, 241, 1)',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 2,
                    pointRadius: 4,
                    pointBackgroundColor: 'rgba(99, 102, 241, 1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        labels: {
                            color: '#cbd5e1'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#f1f5f9',
                        bodyColor: '#cbd5e1',
                        borderColor: '#334155',
                        borderWidth: 1
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#94a3b8',
                            precision: 0
                        },
                        grid: {
                            color: 'rgba(51, 65, 85, 0.5)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#94a3b8'
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    /**
     * 25个细分赛道分布图
     */
    initSubCategoryChart() {
        const ctx = document.getElementById('subCategoryChart');
        if (!ctx) return;

        // 定义25个细分赛道的标准分类
        const standardCategories = {
            '基础层': ['算力', '算法', '数据'],
            '模型层': ['垂类模型', '大模型', '优化测评', '智能体', '开发平台'],
            '应用层': ['生命科学', '企业服务', '金融服务', '安全合规', '机器人',
                      '零售营销', '开发者', '效率工具', '社交文娱', '双碳环保',
                      '垂类行业', '法律服务', '汽车物流', '教育培训', '国防安防',
                      '地产科技', '工业制造', '智能硬件']
        };

        // 统计各细分领域数量
        const subCategoryCount = {};

        // 初始化所有25个赛道计数为0
        Object.values(standardCategories).flat().forEach(cat => {
            subCategoryCount[cat] = 0;
        });

        // 统计实际数据
        this.allData.forEach(item => {
            if (item.verticalTags && item.verticalTags.length > 0) {
                item.verticalTags.forEach(tag => {
                    if (tag && tag.trim()) {
                        const tagName = tag.trim();
                        // 尝试匹配到标准分类
                        let matched = false;
                        for (const cat of Object.values(standardCategories).flat()) {
                            if (tagName.includes(cat) || cat.includes(tagName)) {
                                subCategoryCount[cat]++;
                                matched = true;
                                break;
                            }
                        }
                        if (!matched) {
                            // 如果没有匹配，直接计数
                            subCategoryCount[tagName] = (subCategoryCount[tagName] || 0) + 1;
                        }
                    }
                });
            }
        });

        // 取所有非零的赛道，按数量排序
        const sorted = Object.entries(subCategoryCount)
            .filter(([, count]) => count > 0)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20); // 显示前20个

        const labels = sorted.map(([cat]) => cat);
        const data = sorted.map(([, count]) => count);

        // 根据赛道所属层级分配颜色
        const getLayerColor = (category) => {
            if (standardCategories['基础层'].includes(category)) {
                return ['rgba(59, 130, 246, 0.7)', 'rgba(59, 130, 246, 1)']; // 蓝色
            } else if (standardCategories['模型层'].includes(category)) {
                return ['rgba(16, 185, 129, 0.7)', 'rgba(16, 185, 129, 1)']; // 绿色
            } else {
                return ['rgba(245, 158, 11, 0.7)', 'rgba(245, 158, 11, 1)']; // 橙色
            }
        };

        const backgroundColors = labels.map(cat => getLayerColor(cat)[0]);
        const borderColors = labels.map(cat => getLayerColor(cat)[1]);

        this.charts.subCategory = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: '公司数量',
                    data: data,
                    backgroundColor: backgroundColors,
                    borderColor: borderColors,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#f1f5f9',
                        bodyColor: '#cbd5e1',
                        borderColor: '#334155',
                        borderWidth: 1
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#94a3b8',
                            precision: 0
                        },
                        grid: {
                            color: 'rgba(51, 65, 85, 0.5)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#94a3b8',
                            maxRotation: 45,
                            minRotation: 45
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    /**
     * 周报期数分布图
     */
    initWeeklyChart() {
        const ctx = document.getElementById('weeklyChart');
        if (!ctx) return;

        // 统计周报/月报/季报/年报分布
        const reportCount = {
            '周报': 0,
            '月报': 0,
            '季报': 0,
            '年报': 0,
            'Deal': 0,
            '其他': 0
        };

        this.allData.forEach(item => {
            const report = item.weeklyReport || '';
            if (report === 'Deal') {
                reportCount['Deal']++;
            } else if (item.weeklyReport) {
                reportCount['周报']++;
            } else if (item.monthlyReport) {
                reportCount['月报']++;
            } else if (item.quarterlyReport) {
                reportCount['季报']++;
            } else if (item.yearlyReport) {
                reportCount['年报']++;
            } else {
                reportCount['其他']++;
            }
        });

        const sorted = Object.entries(reportCount)
            .filter(([, count]) => count > 0)
            .sort((a, b) => b[1] - a[1]);

        const labels = sorted.map(([cat]) => cat);
        const data = sorted.map(([, count]) => count);

        this.charts.weekly = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: '公司数量',
                    data: data,
                    backgroundColor: 'rgba(147, 51, 234, 0.7)',
                    borderColor: 'rgba(147, 51, 234, 1)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#f1f5f9',
                        bodyColor: '#cbd5e1',
                        borderColor: '#334155',
                        borderWidth: 1
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#94a3b8',
                            precision: 0
                        },
                        grid: {
                            color: 'rgba(51, 65, 85, 0.5)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#94a3b8',
                            maxRotation: 45,
                            minRotation: 45
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    /**
     * 融资日期趋势图
     */
    initFundingDateChart() {
        const ctx = document.getElementById('fundingDateChart');
        if (!ctx) return;

        // 按年月统计融资事件
        const monthlyCount = {};
        this.allData.forEach(item => {
            if (item.date && item.date.trim()) {
                const year = item.date.substring(0, 4);
                if (year >= '2020' && year <= '2025') {
                    monthlyCount[year] = (monthlyCount[year] || 0) + 1;
                }
            }
        });

        const years = Object.keys(monthlyCount).sort();
        const data = years.map(year => monthlyCount[year]);

        this.charts.fundingDate = new Chart(ctx, {
            type: 'line',
            data: {
                labels: years,
                datasets: [{
                    label: '融资事件数',
                    data: data,
                    tension: 0.4,
                    fill: true,
                    borderColor: 'rgba(236, 72, 153, 1)',
                    backgroundColor: 'rgba(236, 72, 153, 0.1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(236, 72, 153, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        labels: {
                            color: '#cbd5e1'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#f1f5f9',
                        bodyColor: '#cbd5e1',
                        borderColor: '#334155',
                        borderWidth: 1
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#94a3b8',
                            precision: 0
                        },
                        grid: {
                            color: 'rgba(51, 65, 85, 0.5)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#94a3b8'
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    /**
     * 热门标签TOP30图表
     */
    initTagsChart() {
        const ctx = document.getElementById('tagsChart');
        if (!ctx) return;

        // 统计所有关键词标签
        const tagCount = {};
        this.allData.forEach(item => {
            if (item.keywords && item.keywords.length > 0) {
                item.keywords.forEach(tag => {
                    if (tag) {
                        tagCount[tag] = (tagCount[tag] || 0) + 1;
                    }
                });
            }
        });

        // 取TOP30
        const sorted = Object.entries(tagCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 30);

        const labels = sorted.map(([tag]) => tag);
        const data = sorted.map(([, count]) => count);

        // 生成渐变色
        const colors = labels.map((_, i) => {
            const hue = (i * 360 / 30);
            return `hsla(${hue}, 70%, 60%, 0.7)`;
        });

        this.charts.tags = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: '公司数量',
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#f1f5f9',
                        bodyColor: '#cbd5e1',
                        borderColor: '#334155',
                        borderWidth: 1
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#94a3b8',
                            precision: 0
                        },
                        grid: {
                            color: 'rgba(51, 65, 85, 0.5)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#94a3b8',
                            maxRotation: 90,
                            minRotation: 45,
                            font: {
                                size: 10
                            }
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 筛选器
        document.getElementById('categoryFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('subCategoryFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('locationFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('sortBy').addEventListener('change', () => this.applyFilters());
        document.getElementById('searchInput').addEventListener('input', (e) => {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => this.applyFilters(), 300);
        });

        // 重置按钮
        document.getElementById('resetFilters').addEventListener('click', () => this.resetFilters());

        // 分页
        document.getElementById('prevPage').addEventListener('click', () => this.changePage(-1));
        document.getElementById('nextPage').addEventListener('click', () => this.changePage(1));

        // 图表折叠
        document.querySelectorAll('.chart-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => this.toggleChart(e.currentTarget));
        });
    }

    /**
     * 应用筛选
     */
    applyFilters() {
        const category = document.getElementById('categoryFilter').value;
        const subCategory = document.getElementById('subCategoryFilter').value;
        const location = document.getElementById('locationFilter').value;
        const sortBy = document.getElementById('sortBy').value;
        const searchText = document.getElementById('searchInput').value.toLowerCase();

        // 筛选
        this.filteredData = this.allData.filter(item => {
            // 三层架构筛选（基础层、模型层、应用层）
            if (category !== 'all') {
                const itemLayer = item.tags && item.tags.length > 0 ? item.tags[0] : '';
                if (!itemLayer.includes(category)) {
                    return false;
                }
            }

            // 细分赛道筛选
            if (subCategory !== 'all') {
                const itemVerticalTags = item.verticalTags && item.verticalTags.length > 0
                    ? item.verticalTags.join(' ')
                    : '';
                if (!itemVerticalTags.includes(subCategory)) {
                    return false;
                }
            }

            // 地域筛选
            if (location !== 'all' && item.location !== location) {
                return false;
            }

            // 搜索筛选
            if (searchText) {
                const searchableText = `${item.name} ${item.tags.join(' ')} ${item.verticalTags.join(' ')} ${item.category}`.toLowerCase();
                if (!searchableText.includes(searchText)) {
                    return false;
                }
            }

            return true;
        });

        // 排序
        this.filteredData.sort((a, b) => {
            switch (sortBy) {
                case 'funding':
                    return b.fundingAmount - a.fundingAmount;
                case 'date':
                    // 处理成立时间排序
                    const dateA = a.date ? new Date(a.date) : new Date(0);
                    const dateB = b.date ? new Date(b.date) : new Date(0);
                    return dateB - dateA;
                case 'name':
                    // 按公司名称排序
                    return a.name.localeCompare(b.name, 'zh-CN');
                default:
                    return 0;
            }
        });

        // 重置到第一页
        this.currentPage = 1;

        // 渲染
        this.render();
    }

    /**
     * 重置筛选
     */
    resetFilters() {
        document.getElementById('categoryFilter').value = 'all';
        document.getElementById('subCategoryFilter').value = 'all';
        document.getElementById('locationFilter').value = 'all';
        document.getElementById('sortBy').value = 'funding';
        document.getElementById('searchInput').value = '';
        this.applyFilters();
    }

    /**
     * 渲染表格
     */
    render() {
        const loadingState = document.getElementById('loadingState');
        const tableContainer = document.getElementById('rankingsTable');
        const emptyState = document.getElementById('emptyState');

        // 隐藏加载状态
        loadingState.style.display = 'none';

        // 检查是否有数据
        if (this.filteredData.length === 0) {
            tableContainer.style.display = 'none';
            emptyState.style.display = 'block';
            document.getElementById('pagination').style.display = 'none';
            document.getElementById('resultCount').textContent = '未找到结果';
            return;
        }

        // 显示表格
        emptyState.style.display = 'none';
        tableContainer.style.display = 'block';

        // 分页
        const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const pageData = this.filteredData.slice(start, end);

        // 渲染表格行
        const tbody = document.getElementById('tableBody');
        tbody.innerHTML = pageData.map((item, index) => {
            const globalRank = start + index + 1;
            return this.renderTableRow(item, globalRank);
        }).join('');

        // 更新结果计数
        document.getElementById('resultCount').textContent =
            `显示 ${start + 1}-${Math.min(end, this.filteredData.length)} / 共 ${this.filteredData.length} 条`;

        // 更新分页
        this.updatePagination(totalPages);
    }

    /**
     * 渲染表格行
     */
    renderTableRow(item, rank) {
        const rankClass = rank === 1 ? 'top1' : rank === 2 ? 'top2' : rank === 3 ? 'top3' : 'other';
        const rankIcon = rank <= 3 ? '🏆' : '';

        const categoryClass = item.category === '基础层' ? 'infra' :
                            item.category === '模型层' ? 'model' : 'app';

        return `
            <tr>
                <td class="rank-col">
                    <div class="rank-badge ${rankClass}">
                        ${rankIcon} ${rank}
                    </div>
                </td>
                <td class="company-col">
                    <div class="company-info">
                        <div class="company-name">${this.escapeHtml(item.name)}</div>
                        ${item.excerpt ? `<div class="company-desc">${this.escapeHtml(item.excerpt.substring(0, 80))}...</div>` : ''}
                    </div>
                </td>
                <td class="category-col">
                    <span class="category-badge ${categoryClass}">${item.category}</span>
                </td>
                <td class="funding-col">
                    <div class="funding-amount">${item.fundingAmountDisplay}</div>
                </td>
                <td class="round-col">
                    <span class="round-badge">${item.round}</span>
                </td>
                <td class="date-col">
                    <span style="color: var(--text-muted)">${item.date}</span>
                </td>
                <td class="tags-col">
                    <div class="tags-group">
                        ${item.tags.slice(0, 3).map(tag =>
                            `<span class="tag">${this.escapeHtml(tag)}</span>`
                        ).join('')}
                    </div>
                </td>
                <td class="action-col">
                    <button class="view-btn" onclick="dataRankings.showCompanyDetail('${item.id}')">
                        查看详情
                    </button>
                </td>
            </tr>
        `;
    }

    /**
     * 显示公司详情弹窗
     */
    showCompanyDetail(companyId) {
        console.log('🔍 showCompanyDetail called with ID:', companyId);

        // 检查登录状态
        const isAuthenticated = this.checkAuthentication();
        console.log('🔐 Authentication status:', isAuthenticated);

        if (!isAuthenticated) {
            console.log('🚫 User not authenticated, showing login overlay...');
            this.showLoginOverlay();
            return;
        }

        const company = this.allData.find(item => item.id === companyId);
        if (!company) {
            console.log('⚠️ Company not found:', companyId);
            return;
        }
        console.log('✅ Company found, showing detail modal...');

        // 创建弹窗HTML
        const modalHTML = `
            <div class="modal-overlay" id="companyModal" onclick="if(event.target===this) dataRankings.closeModal()">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 class="modal-title">
                            <span class="modal-icon">🏢</span>
                            ${this.escapeHtml(company.name)}
                        </h2>
                        <button class="modal-close" onclick="dataRankings.closeModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="detail-grid">
                            <div class="detail-item">
                                <div class="detail-label">行业分类</div>
                                <div class="detail-value">
                                    <span class="category-badge ${company.category === '基础层' ? 'infra' : company.category === '模型层' ? 'model' : 'app'}">
                                        ${company.category}
                                    </span>
                                </div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">融资金额</div>
                                <div class="detail-value highlight">${company.fundingAmountDisplay}</div>
                            </div>
                            ${company.valuation ? `
                            <div class="detail-item">
                                <div class="detail-label">公司估值</div>
                                <div class="detail-value">${company.valuation}亿美元</div>
                            </div>
                            ` : ''}
                            ${company.date ? `
                            <div class="detail-item">
                                <div class="detail-label">成立时间</div>
                                <div class="detail-value">${company.date}</div>
                            </div>
                            ` : ''}
                            ${company.location ? `
                            <div class="detail-item">
                                <div class="detail-label">成立地点</div>
                                <div class="detail-value">${this.escapeHtml(company.location)}</div>
                            </div>
                            ` : ''}
                            ${company.investors ? `
                            <div class="detail-item full-width">
                                <div class="detail-label">投资方</div>
                                <div class="detail-value">${this.escapeHtml(company.investors)}</div>
                            </div>
                            ` : ''}
                        </div>
                        ${company.excerpt ? `
                        <div class="detail-section">
                            <div class="detail-label">主要业务</div>
                            <div class="detail-description">${this.escapeHtml(company.excerpt)}</div>
                        </div>
                        ` : ''}
                        ${company.tags && company.tags.length > 0 ? `
                        <div class="detail-section">
                            <div class="detail-label">相关标签</div>
                            <div class="tags-group">
                                ${company.tags.map(tag =>
                                    `<span class="tag">${this.escapeHtml(tag)}</span>`
                                ).join('')}
                            </div>
                        </div>
                        ` : ''}
                    </div>
                    <div class="modal-footer">
                        <div class="data-source-note">
                            <span class="note-icon">ℹ️</span>
                            数据来源: ${this.escapeHtml(company.source)}
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 添加到页面
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // 添加动画类
        setTimeout(() => {
            document.getElementById('companyModal').classList.add('active');
        }, 10);
    }

    /**
     * 关闭弹窗
     */
    closeModal() {
        const modal = document.getElementById('companyModal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        }
    }

    /**
     * 更新分页
     */
    updatePagination(totalPages) {
        const pagination = document.getElementById('pagination');
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');

        if (totalPages <= 1) {
            pagination.style.display = 'none';
            return;
        }

        pagination.style.display = 'flex';

        document.getElementById('currentPage').textContent = this.currentPage;
        document.getElementById('totalPages').textContent = totalPages;

        prevBtn.disabled = this.currentPage === 1;
        nextBtn.disabled = this.currentPage === totalPages;
    }

    /**
     * 翻页
     */
    changePage(delta) {
        this.currentPage += delta;
        this.render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * 切换图表显示
     */
    toggleChart(btn) {
        const chartCard = btn.closest('.chart-card');
        const chartBody = chartCard.querySelector('.chart-body');
        const icon = btn.querySelector('.toggle-icon');

        if (chartBody.style.display === 'none') {
            chartBody.style.display = 'block';
            icon.textContent = '−';
        } else {
            chartBody.style.display = 'none';
            icon.textContent = '+';
        }
    }

    /**
     * 显示错误
     */
    showError(message) {
        const loadingState = document.getElementById('loadingState');
        loadingState.innerHTML = `
            <div class="error-icon">⚠️</div>
            <h3 style="color: var(--danger-color); margin-bottom: 0.5rem;">加载失败</h3>
            <p style="color: var(--text-muted);">${this.escapeHtml(message)}</p>
            <button onclick="location.reload()" class="empty-btn" style="margin-top: 1rem;">
                重新加载
            </button>
        `;
    }

    /**
     * HTML转义
     */
    /**
     * 检查用户认证状态
     */
    checkAuthentication() {
        try {
            const userData = localStorage.getItem('svtr_user');
            const token = localStorage.getItem('svtr_token');
            console.log('📦 LocalStorage check - userData:', !!userData, 'token:', !!token);
            return !!(userData && token);
        } catch (error) {
            console.error('❌ 认证检查失败:', error);
            return false;
        }
    }

    /**
     * 显示登录覆盖层（直接使用首页的完整登录系统）
     */
    showLoginOverlay() {
        console.log('🔑 showLoginOverlay called');
        console.log('📱 window.svtrUserActions exists:', !!window.svtrUserActions);

        // 由于 user-actions.js 现在立即初始化，window.svtrUserActions 应该已经存在
        // 但为了保险，仍然检查一下
        if (!window.svtrUserActions) {
            console.error('❌ svtrUserActions not available! This should not happen.');

            // 快速重试一次（可能是脚本加载顺序问题）
            setTimeout(() => {
                if (window.svtrUserActions) {
                    console.log('✅ svtrUserActions available after retry');
                    window.svtrUserActions.showMemberLoginModal();
                } else {
                    alert('登录系统加载失败，请刷新页面重试。');
                }
            }, 100);
            return;
        }

        console.log('✅ Calling showMemberLoginModal (with Google, GitHub, LinkedIn login)...');

        // 直接调用首页的完整登录系统（包含 Google、GitHub、LinkedIn 登录）
        window.svtrUserActions.showMemberLoginModal();
    }

    /**
     * 设置认证监听器
     * 注意：登录弹窗的关闭由 user-actions.js 自动处理，这里只需要监听登录成功事件
     */
    setupAuthListeners() {
        // 监听storage事件(跨标签页同步) - 登录成功后可以执行额外操作
        const storageHandler = (e) => {
            if (e.key === 'svtr_user' || e.key === 'svtr_token') {
                if (this.checkAuthentication()) {
                    console.log('✅ 检测到登录状态，可以刷新数据或执行其他操作');
                    // user-actions.js 会自动关闭登录弹窗，这里不需要手动关闭
                }
            }
        };

        // 只添加一次监听器
        if (!this.authListenerAdded) {
            window.addEventListener('storage', storageHandler);
            this.authListenerAdded = true;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    window.dataRankings = new DataRankings();
});
