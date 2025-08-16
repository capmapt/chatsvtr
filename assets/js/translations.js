// Translation configuration
const translations = {
  'zh-CN': {
    title: 'SVTR - 硅谷科技评论 | AI创投生态系统专业分析平台',
    description: 'SVTR是专业的AI创投生态分析平台，追踪10,761+家全球AI公司和121,884+投资人，提供AI周报、投资分析、市场洞察和实时创投数据。',
    keywords: 'AI创投,人工智能投资,创业公司,投资机构,SVTR,硅谷科技评论,AI融资,创投数据,投资分析,AI独角兽',
    sidebar_title: '硅谷科技评论',
    nav_ai100: 'AI 100',
    nav_ai_weekly: 'AI周报',
    nav_trading_picks: 'AI交易',
    nav_ranking: 'AI创投榜',
    sub_financing: '融资概览',
    sub_industries: '赛道概览',
    sub_startups: '公司概览',
    sub_investors: '机构概览',
    sub_people: '人员概览',
    // Navigation group headers
    nav_data_analytics: '📊 数据分析',
    nav_community_hub: '🤝 社区中心', 
    nav_premium_services: '💎 专业服务',
    nav_about_us: 'ℹ️ 关于我们',
    
    // Navigation items
    nav_database: 'AI创投库',
    nav_group: 'AI创投群',
    nav_meetup: 'AI创投会',
    nav_camp: 'AI创投营',
    nav_about: '🏢 关于我们',
    nav_contact: '联系我们',
    
    // Premium services
    nav_consulting: '投资咨询',
    nav_project_matching: '项目对接',
    nav_custom_reports: '定制报告',
    sub_email: '📧 邮箱联系',
    sub_linkedin: '💼 LinkedIn',
    sub_twitter: '🐦 Twitter',
    sub_github: '⚡ GitHub',
    sub_daily_helper: '📰 AI日报助手',
    sidebar_qr_title: '扫码加群',
    sidebar_qr_text: '添加好友，进群交流',
    discord_join_button: '加入Discord社群',
    demo_subtitle: '根据用户语言偏好智能显示最合适的社群入口',
    design_concept: '基于用户语言偏好和使用习惯，智能展示最合适的社群入口方式：',
    current_mode: '当前模式',
    community_entrance: '社群入口',
    banner_title: '硅谷科技评论',
    banner_subtitle: 'SVTR',
    banner_tagline_left: '洞察全球资本',
    banner_tagline_right: '成就AI创业者',
    notice_1: '100K+',
    link_community: '社区成员',
    notice_2: '10K+',
    link_alliance: '创业公司与投资机构',
    notice_3: '1K+',
    link_members: '权益会员',
    chat_header: '与 <a href="https://svtr.ai" target="_blank">凯瑞 (Kerry)</a> 对话',
    tag_database_text: 'AI创投库',
    tag_meetup_text: 'AI创投会', 
    tag_camp_text: 'AI创投营',
    // 优化的标签图标 - 与widget风格一致
    tag_data_analytics_text: '数据分析',
    tag_community_hub_text: '社区中心',
    tag_premium_services_text: '专业服务',
    menu_toggle_aria_label: '打开/关闭菜单',
    close_sidebar_aria_label: '关闭侧边栏',
    logo_alt_text: 'SVTR 商标',
    qr_alt_text: '添加好友二维码',
    join_btn: '加入候补名单',
    input_placeholder: '请输入你的问题...',
    send_btn: '发送',
    footer_text: '© 2025 SVTR. All rights reserved.',
    // Chat bot translations
    chat_input_placeholder: '问我关于AI创投的任何问题...',
    chat_welcome_title: '您好！我是凯瑞(Kerry)，硅谷科技评论的AI助手，专注于AI创投生态系统分析。',
    chat_welcome_content: `我可以为您提供：
• 最新AI创投市场动态
• 投资机构和初创公司分析  
• 行业趋势和技术评估
• 专业投资建议

请问您想了解什么？`,
    chat_user_name: '您',
    chat_ai_name: '凯瑞 (Kerry)',
    chat_thinking: '正在分析',
    chat_share_btn: '分享',
    chat_clear_btn: '清空',
    // Smart sidebar UX translations
    sidebar_auto_close_hint: '侧边栏将在几秒后自动收起，方便您查看内容',
    keep_open: '保持打开',
    close_now: '立即收起',
    auto_close_setting: '智能收起',
    swipe_to_close: '向左滑动收起'
  },
  'en': {
    title: 'SVTR - Silicon Valley Tech Review | Professional AI VC Ecosystem Analysis Platform',
    description: 'SVTR is a professional AI venture capital ecosystem analysis platform, tracking 10,761+ global AI companies and 121,884+ investors, providing AI weekly reports, investment analysis, market insights and real-time VC data.',
    keywords: 'AI venture capital,artificial intelligence investment,startups,venture capital firms,SVTR,Silicon Valley Tech Review,AI funding,VC data,investment analysis,AI unicorns',
    sidebar_title: 'SVTR',
    nav_ai100: 'AI 100',
    nav_ai_weekly: 'AI Weekly',
    nav_trading_picks: 'AI Trading',
    nav_ranking: 'AI Ranking',
    sub_financing: 'Financing',
    sub_industries: 'Industries',
    sub_startups: 'Startups',
    sub_investors: 'Investors',
    sub_people: 'People',
    // Navigation group headers
    nav_data_analytics: '📊 Data Analytics',
    nav_community_hub: '🤝 Community Hub',
    nav_premium_services: '💎 Premium Services', 
    nav_about_us: 'ℹ️ About Us',
    
    // Navigation items
    nav_database: 'AI Database',
    nav_group: 'AI Group',
    nav_meetup: 'AI Meetup',
    nav_camp: 'AI Camp',
    nav_about: '🏢 About Us',
    nav_contact: 'Contact',
    
    // Premium services
    nav_consulting: 'Investment Consulting',
    nav_project_matching: 'Project Matching',
    nav_custom_reports: 'Custom Reports',
    sub_email: '📧 Email',
    sub_linkedin: '💼 LinkedIn',
    sub_twitter: '🐦 Twitter',
    sub_github: '⚡ GitHub',
    sub_daily_helper: '📰 AI Daily Helper',
    sidebar_qr_title: 'Join Community',
    sidebar_qr_text: 'Connect with AI VC professionals',
    discord_join_button: 'Join Discord Community',
    demo_subtitle: 'Intelligently display the most suitable community entrance based on user language preference',
    design_concept: 'Based on user language preference and usage habits, intelligently display the most suitable community entrance:',
    current_mode: 'Current Mode',
    community_entrance: 'Community Entrance',
    banner_title: 'Silicon Valley<br>Technology Review',
    banner_subtitle: 'SVTR',
    banner_tagline_left: 'Insights on Global Capital',
    banner_tagline_right: 'Empowering AI Founders',
    notice_1: 'If you are an AI Practitioner, welcome to join SVTR',
    link_community: 'Community',
    notice_2: 'If you are an AI Founder, welcome to join SVTR',
    link_alliance: 'Ecosystem Alliance',
    notice_3: 'If you are a Member, please visit SVTR',
    link_members: 'Exclusive Members Area',
    chat_header: 'Chat with <a href="https://svtr.ai" target="_blank">Kerry</a>',
    tag_database_text: 'AI DB',
    tag_meetup_text: 'AI Meetup',
    tag_camp_text: 'AI Camp',
    // 优化的标签图标 - 与widget风格一致  
    tag_data_analytics_text: 'Data Analytics',
    tag_community_hub_text: 'Community Hub',
    tag_premium_services_text: 'Premium Services',
    menu_toggle_aria_label: 'Open/Close menu',
    close_sidebar_aria_label: 'Close sidebar',
    logo_alt_text: 'SVTR Logo',
    qr_alt_text: 'Add friend QR code',
    join_btn: 'Join the Waitlist',
    email_placeholder: 'Enter your email',
    input_placeholder: 'Type your question...',
    send_btn: 'Send',
    footer_text: '© 2025 SVTR. All rights reserved.',
    // Chat bot translations
    chat_input_placeholder: 'Ask me anything about AI venture capital...',
    chat_welcome_title: 'Hello! I\'m Kerry, SVTR assistant, specializing in AI venture capital ecosystem analysis.',
    chat_welcome_content: `I can provide you with:
• Latest AI VC market dynamics
• Investment firms and startup analysis
• Industry trends and technology assessments  
• Professional investment insights

What would you like to know?`,
    chat_user_name: 'You',
    chat_ai_name: 'Kerry',
    chat_thinking: 'Analyzing',
    chat_share_btn: 'Share',
    chat_clear_btn: 'Clear',
    // Smart sidebar UX translations
    sidebar_auto_close_hint: 'Sidebar will auto-close to help you view content',
    keep_open: 'Keep Open',
    close_now: 'Close Now',
    auto_close_setting: 'Smart Close',
    swipe_to_close: 'Swipe left to close'
  }
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = translations;
}
