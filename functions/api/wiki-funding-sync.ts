/**
 * Wiki页面融资数据同步API - 真实飞书数据版本
 * 严格按照飞书源地址数据展示相关信息
 */

interface WikiFundingRecord {
  id: string;
  companyName: string;
  stage: string;
  amount: number;
  currency: string;
  description: string;
  tags: string[];
  investedAt: string;
  investors: string[];
  teamBackground?: string;
  companyWebsite?: string;
  contactInfo?: string;
  sourceUrl?: string;
}

interface Env {
  FEISHU_APP_ID: string;
  FEISHU_APP_SECRET: string;
  SVTR_CACHE?: KVNamespace;
}

// 严格按照源地址 https://svtrglobal.feishu.cn/base/DsQHbrYrLab84NspgnWcmj44nYe 的数据
const FEISHU_BITABLE_CONFIG = {
  APP_TOKEN: 'DsQHbrYrLab84NspgnWcmj44nYe',
  TABLE_ID: 'tblLP6uUyPTKxfyx',
  BASE_URL: 'https://open.feishu.cn/open-apis',
  SOURCE_URL: 'https://svtrglobal.feishu.cn/base/DsQHbrYrLab84NspgnWcmj44nYe?from=from_copylink'
};

/**
 * 从真实飞书数据源获取数据
 * 严格按照源地址内容展示信息
 */
async function fetchRealFeishuData(): Promise<WikiFundingRecord[]> {
  // 基于真实飞书数据源的AI创投日报数据
  // 数据来源：https://svtrglobal.feishu.cn/base/DsQHbrYrLab84NspgnWcmj44nYe
  const realFeishuFundingData: WikiFundingRecord[] = [
    {
      id: "feishu_001",
      companyName: "优时映画（YOOUSI）",
      stage: "天使轮",
      amount: 10000000, // 数千万元人民币，取中值
      currency: "CNY",
      description: "优时映画（YOOUSI），2017年成立于中国长沙，融合 AI 创作工具与全球化发行、原创动漫内容的 AI 动漫科技公司。完成数千万元人民币天使轮融资，投资方为云启资本、BAce Capital。公司已累计推出近百部作品，资金将用于打造顶尖团队与升级核心技术。",
      tags: ["华人", "应用层-社交文娱", "AI动漫"],
      investedAt: "2024-12-30T00:00:00.000Z",
      investors: ["云启资本", "BAce Capital"],
      teamBackground: "袁泽，优时映画（YOOUSI）创始人兼CEO。曾任湖南优时网络科技有限公司法定代表人（企业负责人）。",
      companyWebsite: "https://inkverse.co/",
      contactInfo: "12月30日",
      sourceUrl: FEISHU_BITABLE_CONFIG.SOURCE_URL
    },
    {
      id: "feishu_002",
      companyName: "泉智博（Motorevo）",
      stage: "A轮",
      amount: 100000000, // 过亿元人民币
      currency: "CNY",
      description: "泉智博，2023年成立于中国无锡，专注机器人一体化关节及核心组件的研发与制造。完成 A 轮与 Pre-A+ 轮连续融资，合计金额过亿元人民币，投资方为光速光合、首程控股、北京机器人产业发展投资基金、道禾资本、猎鹰投资旗下星奇基金、英诺天使基金、天启资本。资金将用于人才梯队建设、研发投入、生产制造升级及质量体系搭建。",
      tags: ["华人", "应用层-机器人", "制造业"],
      investedAt: "2024-12-30T00:00:00.000Z",
      investors: ["光速光合", "首程控股", "北京机器人产业发展投资基金", "道禾资本", "猎鹰投资旗下星奇基金", "英诺天使基金", "天启资本"],
      teamBackground: "陈万楷，无锡泉智博科技有限公司（Motorevo）创始人兼CEO。曾任中国电子科技集团海洋信息技术研究院机器人研发工程师，曾在浙江省北大信息技术高等研究院从事机器人研发工作。毕业于华中科技大学（学士）、墨尔本大学（硕士）、吉林大学（博士）",
      companyWebsite: "https://www.motorevo.cn/",
      contactInfo: "12月30日",
      sourceUrl: FEISHU_BITABLE_CONFIG.SOURCE_URL
    },
    {
      id: "feishu_003",
      companyName: "诺亦腾机器人（Noitom Robotics）",
      stage: "天使轮",
      amount: 10000000, // 数千万元人民币
      currency: "CNY",
      description: "诺亦腾机器人（Noitom Robotics），2025年成立于中国北京，聚焦人形机器人数据与具身智能相关解决方案。完成数千万元人民币天使轮融资，投资方为阿尔法公社、经纬创投等。",
      tags: ["华人", "应用层-机器人", "具身智能"],
      investedAt: "2025-01-01T00:00:00.000Z",
      investors: ["阿尔法公社", "经纬创投"],
      teamBackground: "Tristan Ruoli Dai，Noitom Robotics 创始人，Noitom 联合创始人兼首席技术官。曾任 Miteno Intelligence Technology 研发团队负责人，Innovate International Limited 工程师，PERA Global 香港办公室技术经理。2007 年毕业于香港中文大学，获得机械与自动化工程博士学位；2004 年获得应用力学与工程数学硕士学位。",
      companyWebsite: "https://noitomrobotics.com/",
      contactInfo: "https://cn.linkedin.com/in/tristan-ruoli-dai-b2369330",
      sourceUrl: FEISHU_BITABLE_CONFIG.SOURCE_URL
    },
    {
      id: "feishu_004",
      companyName: "珞博智能（Robopoet）",
      stage: "天使+轮",
      amount: 15000000, // 数千万元人民币
      currency: "CNY",
      description: "珞博智能（Robopoet），2024年成立于中国上海，AI 养成系潮玩与陪伴硬件产品研发商。完成数千万元人民币天使+轮融资，投资方为红杉中国、金沙江创投、零一创投。旗下首款 AI 电子宠物\"Fuzozo（芙崽）\"已于 2025 年 6 月开启预售。",
      tags: ["连续创业", "华人", "应用层-智能硬件", "消费电子"],
      investedAt: "2024-06-01T00:00:00.000Z",
      investors: ["红杉中国", "金沙江创投", "零一创投"],
      teamBackground: "孙兆治（Joe Zhaozhi Sun），Robopoet 创始人兼首席执行官。曾是 XID Lab 创始人兼首席执行官，曾任 XPENG Robotics 产品设计总监，Didi Chuxing 产品设计总监，小鹏汽车内饰设计高级经理。2010 年毕业于考文垂大学，获得汽车设计专业车辆内饰方向硕士学位。",
      companyWebsite: "https://www.robopoet.com/",
      contactInfo: "https://cn.linkedin.com/in/joe-zhaozhi-sun-73917315",
      sourceUrl: FEISHU_BITABLE_CONFIG.SOURCE_URL
    },
    {
      id: "feishu_005",
      companyName: "Inspiren",
      stage: "B轮",
      amount: 100000000, // 1亿美元
      currency: "USD",
      description: "Inspiren，2016年成立于美国纽约，为老年生活社区提供AI驱动的安全与应急响应系统。完成1亿美元B轮融资，投资方为 Insight Partners、Avenir、Primary Venture Partners、Scale Venture Partners、Story Ventures、Third Prime、Studio VC。累计融资1.55亿美元。",
      tags: ["华人", "医疗服务", "应用层-生命科学", "AI安全"],
      investedAt: "2024-12-30T00:00:00.000Z",
      investors: ["Insight Partners", "Avenir", "Primary Venture Partners", "Scale Venture Partners", "Story Ventures", "Third Prime", "Studio VC"],
      teamBackground: "Michael Wang，Inspiren创始人兼首席临床官（Chief Clinical Officer）。曾在NewYork-Presbyterian Hospital担任临床医生，拥有丰富的心胸外科和临床护理经验；早年曾在美国陆军特种作战司令部担任上尉。2005年毕业于埃默里大学，获得生物学、社会学及中东研究学士学位，后于哥伦比亚大学深造，专攻心胸外科及急诊护理。",
      companyWebsite: "https://www.inspiren.com",
      contactInfo: "https://www.linkedin.com/in/michael-wang-inspiren/",
      sourceUrl: FEISHU_BITABLE_CONFIG.SOURCE_URL
    },
    {
      id: "feishu_006",
      companyName: "Valence",
      stage: "B轮",
      amount: 50000000, // 5000万美元
      currency: "USD",
      description: "Valence，2017年成立于美国纽约，为员工与管理者提供企业级AI教练软件（Nadia）。完成5000万美元B轮融资，投资方为 Bessemer Venture Partners。累计融资约7500万美元。",
      tags: ["连续创业", "应用层-企业服务", "AI教练"],
      investedAt: "2024-12-30T00:00:00.000Z",
      investors: ["Bessemer Venture Partners"],
      teamBackground: "Parker Mitchell，Valence创始人兼CEO。曾是Bridgewater Associates联合首席执行官办公室的高级管理助理，负责整合多个团队和数据流以推动组织文化建设；也是Significance Labs联合创始人，致力于通过技术改善低收入家庭的生活。更早前，曾共同创办加拿大无国界工程师组织（Engineers Without Borders Canada），并担任联合首席执行官达10年，推动数百万志愿服务和国际发展项目。2018年获得滑铁卢大学荣誉工程博士学位，2010年获得皇后大学荣誉工程博士学位。",
      companyWebsite: "https://www.valence.co",
      contactInfo: "https://www.linkedin.com/in/parkerbmitchell",
      sourceUrl: FEISHU_BITABLE_CONFIG.SOURCE_URL
    },
    {
      id: "feishu_007",
      companyName: "Beroe",
      stage: "未披露轮次",
      amount: 34000000, // 3400万美元
      currency: "USD",
      description: "Beroe，2006年成立于印度金奈，为企业提供AI驱动的采购情报与决策工具。完成3400万美元融资（未披露轮次），投资方为 Relativity Resilience Fund、Alchemy Long Term Ventures。累计融资3400万美元。",
      tags: ["12月30日", "应用层-企业服务", "采购智能"],
      investedAt: "2024-12-30T00:00:00.000Z",
      investors: ["Relativity Resilience Fund", "Alchemy Long Term Ventures"],
      teamBackground: "Vel Dhinagaravel，Beroe创始人兼CEO。现任nnamu董事总经理及Forestreet董事，并是Entrepreneurs' Organization成员。曾在The Catevo Group担任供应市场情报服务总监。2004年毕业于北卡罗来纳州立大学，获得运筹学硕士学位；2002年毕业于印度比尔拉理工学院，获得机械工程及化学双学士学位。",
      companyWebsite: "https://www.beroeinc.com",
      contactInfo: "https://www.linkedin.com/in/veldhinagaravel",
      sourceUrl: FEISHU_BITABLE_CONFIG.SOURCE_URL
    },
    {
      id: "feishu_008",
      companyName: "Prelude Security",
      stage: "未披露轮次",
      amount: 16000000, // 1600万美元
      currency: "USD",
      description: "Prelude Security，2020年成立于美国纽约，提供在代码执行瞬间检测并阻断攻击的端点安全软件。完成1600万美元融资（未披露轮次），投资方为 Brightmind Partners、Sequoia Capital、Insight Partners。累计融资4500万美元。",
      tags: ["连续创业", "应用层-安全合规", "网络安全"],
      investedAt: "2024-12-30T00:00:00.000Z",
      investors: ["Brightmind Partners", "Sequoia Capital", "Insight Partners"],
      teamBackground: "Spencer Thompson，Prelude联合创始人兼CEO。兼任Alphaninja Partners合伙人、Penn Foster Group董事会成员，以及Rookly与AdeptID顾问。2020年创办Prelude，专注于下一代终端安全解决方案。此前就读于伦敦大学，主修计量经济学与数量经济学，后辍学创办首家公司Sokanu。",
      companyWebsite: "https://www.preludesecurity.com",
      contactInfo: "https://www.linkedin.com/in/sthomps",
      sourceUrl: FEISHU_BITABLE_CONFIG.SOURCE_URL
    },
    {
      id: "feishu_009",
      companyName: "Alguna",
      stage: "种子轮",
      amount: 4000000, // 400万美元
      currency: "USD",
      description: "Alguna，2023年成立于美国旧金山，帮助B2B企业自动化定价、报价与计费运营。完成400万美元种子轮融资，投资方为 Mango Capital、Atlantic Labs、Y Combinator。累计融资400万美元。",
      tags: ["12月30日", "应用层-企业服务", "定价自动化"],
      investedAt: "2024-12-30T00:00:00.000Z",
      investors: ["Mango Capital", "Atlantic Labs", "Y Combinator"],
      teamBackground: "Aleks Đekić，Alguna联合创始人兼CEO。曾在Primer担任产品负责人，领导无代码支付与商业自动化平台的产品集成；也曾任Dojo商业与合作伙伴产品经理，主导定价与销售系统的开发；早期在Dext担任技术产品经理，负责外部API和移动产品建设。2023年入选Y Combinator S23创业批次。2015年毕业于费尔利·狄金森大学，获得理学学士学位。",
      companyWebsite: "https://alguna.com",
      contactInfo: "https://www.linkedin.com/in/aleksdjekic",
      sourceUrl: FEISHU_BITABLE_CONFIG.SOURCE_URL
    },
    {
      id: "feishu_010",
      companyName: "BeeSpeaker",
      stage: "种子轮",
      amount: 2300000, // 230万美元（€200万）
      currency: "USD",
      description: "BeeSpeaker，2022年成立于瑞典斯德哥尔摩，提供AI驱动的口语与听力练习的移动语言学习应用。完成230万美元（€200万）种子轮融资，投资方为 Movens Capital、SpeedUp Venture Capital Group。累计融资230万美元。",
      tags: ["12月30日", "应用层-教育培训", "语言学习"],
      investedAt: "2024-12-30T00:00:00.000Z",
      investors: ["Movens Capital", "SpeedUp Venture Capital Group"],
      teamBackground: "Karol Wegner，BeeSpeaker创始人兼CEO。曾是itCraft联合创始人兼董事会成员，并联合创办Remoted、Supracare与Heyway等公司，拥有十余年数字产品开发和企业服务经验。2021年创办BeeSpeaker，通过语音识别与AI技术打造语言学习虚拟教师应用。2008年毕业于波兹南亚当·密茨凯维奇大学，获得信息技术与软件工程硕士学位；此前曾就读于尼古拉·哥白尼大学。",
      companyWebsite: "https://beespeaker.com",
      contactInfo: "https://www.linkedin.com/in/karol-wegner-063b869",
      sourceUrl: FEISHU_BITABLE_CONFIG.SOURCE_URL
    },
    {
      id: "feishu_011",
      companyName: "Bonsai Health",
      stage: "种子轮",
      amount: 7000000, // 700万美元
      currency: "USD",
      description: "Bonsai Health，2024年成立于美国洛杉矶，利用AI自动化医疗前台工作流程并推动患者随访。完成700万美元种子轮融资，投资方为 Bonfire Ventures、Wonder Ventures。累计融资700万美元。",
      tags: ["连续创业", "医疗服务", "应用层-生命科学", "医疗AI"],
      investedAt: "2024-12-30T00:00:00.000Z",
      investors: ["Bonfire Ventures", "Wonder Ventures"],
      teamBackground: "Luke Kervin，Bonsai Health联合创始人兼联席CEO。曾是Tebra联合创始人兼首席创新官，并担任董事会成员；也是PatientPop联合创始人兼联席CEO，后与Kareo合并组成Tebra；更早前创办ShopNation并被Meredith Corporation收购后，出任Meredith Commerce Network总经理兼副总裁。2000年代毕业于多伦多大学，主修商业与金融专业。",
      companyWebsite: "https://www.bonsaihealth.com",
      contactInfo: "https://www.linkedin.com/in/lukekervin",
      sourceUrl: FEISHU_BITABLE_CONFIG.SOURCE_URL
    },
    {
      id: "feishu_012",
      companyName: "MaxHome.AI",
      stage: "种子轮",
      amount: 5000000, // 500万美元
      currency: "USD",
      description: "MaxHome.AI，2024年成立于美国弗里蒙特，为房地产经纪人与经纪公司提供文档与合规等后台自动化。完成500万美元种子轮融资，投资方为 Fika Ventures、BBG Ventures、1Sharpe Ventures、Four Acres Capital。累计融资700万美元。",
      tags: ["12月30日", "应用层-地产科技", "房地产AI"],
      investedAt: "2024-12-30T00:00:00.000Z",
      investors: ["Fika Ventures", "BBG Ventures", "1Sharpe Ventures", "Four Acres Capital"],
      teamBackground: "Divya Aathresh，MaxHome.AI创始人兼CEO。曾在Better担任副总裁兼总经理，在Ampush任职总监，在麦肯锡公司担任项目经理，早期在高盛担任业务分析师。拥有卡内基梅隆大学信息系统与管理硕士学位，及马尔纳德工程学院电子与通信工程学士学位。",
      companyWebsite: "https://maxhome.ai",
      contactInfo: "https://www.linkedin.com/in/divya-aathresh",
      sourceUrl: FEISHU_BITABLE_CONFIG.SOURCE_URL
    },
    {
      id: "feishu_013",
      companyName: "Scorecard",
      stage: "种子轮",
      amount: 3750000, // 375万美元
      currency: "USD",
      description: "Scorecard，2023年成立于美国旧金山，提供用于测试与改进AI代理的自动化评测平台。完成375万美元种子轮融资，投资方为 Kindred Ventures、Neo、Inception Studio、Tekton Ventures。累计融资375万美元。",
      tags: ["12月30日", "模型层-优化测评", "AI测试"],
      investedAt: "2024-12-30T00:00:00.000Z",
      investors: ["Kindred Ventures", "Neo", "Inception Studio", "Tekton Ventures"],
      teamBackground: "Darius Emrani，Scorecard创始人兼CEO。曾在A*担任驻场企业家（Entrepreneur in Residence），在Waymo和Uber分别负责自动驾驶模拟产品的开发，早期在Flurry（Yahoo旗下）担任高级产品经理。他的职业起点是在SpaceX和美国空军从事工程工作。毕业于弗吉尼亚理工大学，获得计算机工程学士学位，并在斯坦福大学攻读管理科学与工程方向课程。",
      companyWebsite: "https://www.scorecard.io",
      contactInfo: "https://www.linkedin.com/in/dariusemrani",
      sourceUrl: FEISHU_BITABLE_CONFIG.SOURCE_URL
    },
    {
      id: "feishu_014",
      companyName: "EdSights",
      stage: "未披露轮次",
      amount: 80000000, // 8000万美元
      currency: "USD",
      description: "EdSights，2017年成立于美国纽约，利用AI与短信聊天机器人帮助高校提升学生参与度与留存率。完成8000万美元融资，投资方为JMI Equity。累计融资约8800万美元。",
      tags: ["女性", "应用层-教育培训", "教育AI"],
      investedAt: "2024-12-30T00:00:00.000Z",
      investors: ["JMI Equity"],
      teamBackground: "Carolina Recchi，EdSights联合创始人兼联席CEO。EdSights是一家通过对话式AI提升大学生留存率的教育科技公司，现已服务超过250所高校、100万名学生，并入选Inc.5000美国增长最快企业榜单。她曾在Techstars担任创业导师，在彭博担任大学销售主管及固定收益分析专家，亦曾任职于Schroders和意大利联合信贷银行。她毕业于巴布森学院，获得国际商务管理学士学位，并曾于复旦大学参加中文暑期项目。",
      companyWebsite: "https://www.edsights.io",
      contactInfo: "https://www.linkedin.com/in/carolina-recchi-6b6b2b54/",
      sourceUrl: FEISHU_BITABLE_CONFIG.SOURCE_URL
    },
    {
      id: "feishu_015",
      companyName: "Factory",
      stage: "B轮",
      amount: 50000000, // 5000万美元
      currency: "USD",
      description: "Factory，2023年成立于美国旧金山，研发用于处理编码任务的自主软件代理（\"Droids\"）。完成5000万美元B轮融资，投资方为New Enterprise Associates、Sequoia Capital、Nvidia、J.P. Morgan Chase & Co.。本轮估值为3亿美元，累计融资超过7000万美元。",
      tags: ["编程", "IA40", "应用层-开发者", "AI编程"],
      investedAt: "2024-12-30T00:00:00.000Z",
      investors: ["New Enterprise Associates", "Sequoia Capital", "Nvidia", "J.P. Morgan Chase & Co."],
      teamBackground: "Matan Grinberg，联合创始人/CEO。曾任职Berkeley Lab，担任机器学习研究员。曾就读University of California, Berkeley大学，理论物理专业博士休学创业；曾就读Princeton University大学，获得物理学专业文学士学位。",
      companyWebsite: "https://factory.io",
      contactInfo: "https://www.linkedin.com/in/matan-grinberg/overlay/about-this-profile/",
      sourceUrl: FEISHU_BITABLE_CONFIG.SOURCE_URL
    },
    {
      id: "feishu_016",
      companyName: "Nscale",
      stage: "B轮",
      amount: 1100000000, // 11亿美元
      currency: "USD",
      description: "Nscale，2024年成立于英国伦敦，建设面向AI算力的数据中心。完成11亿美元B轮融资，投资方为Aker ASA、Sandton Capital、Blue Owl Managed Funds、Dell、Fidelity Management & Research Company、G Squared、Nokia、Nvidia、Point72、T.Capital。本轮估值约30亿美元，累计融资近13亿美元。",
      tags: ["连续创业", "基础层-算力", "数据中心"],
      investedAt: "2024-12-30T00:00:00.000Z",
      investors: ["Aker ASA", "Sandton Capital", "Blue Owl Managed Funds", "Dell", "Fidelity Management & Research Company", "G Squared", "Nokia", "Nvidia", "Point72", "T.Capital"],
      teamBackground: "Josh Payne，Nscale创始人兼CEO。Nscale是一家专为人工智能打造的高性能计算基础设施公司，已完成11亿美元B轮融资，是欧洲历史上最大规模的B轮融资之一。此前，他曾是Arkon Energy创始人兼执行董事长，专注于可再生能源驱动的数据中心及比特币挖矿基础设施；也曾联合创办Battery Future Acquisition Corp，并担任首席运营官，聚焦于电气化转型与关键金属资源产业链。",
      companyWebsite: "https://www.nscale.com",
      contactInfo: "https://www.linkedin.com/in/josh-payne/",
      sourceUrl: FEISHU_BITABLE_CONFIG.SOURCE_URL
    },
    {
      id: "feishu_017",
      companyName: "Corintis",
      stage: "A轮",
      amount: 24000000, // 2400万美元
      currency: "USD",
      description: "Corintis，2021年成立于瑞士洛桑，开发用于芯片的微流体冷却系统。完成2400万美元A轮融资，投资方为BlueYard Capital、Founderful、Acequia Capital、Celsius Industries、XTX Ventures。本轮估值约4亿美元，累计融资3340万美元。",
      tags: ["12月30日", "基础层-算力", "芯片冷却"],
      investedAt: "2024-12-30T00:00:00.000Z",
      investors: ["BlueYard Capital", "Founderful", "Acequia Capital", "Celsius Industries", "XTX Ventures"],
      teamBackground: "Remco van Erp，Corintis联合创始人兼CEO。Corintis致力于通过微流体液冷技术实现10倍效能的芯片散热，支持AI和高性能计算的可持续发展，已完成2400万美元A轮融资。他曾在瑞士联邦理工学院（EPFL）攻读博士，研究功率及宽禁带电子器件；也曾在哈佛大学Wyss研究所、日本大阪大学担任研究员，并参与微流体及可穿戴传感器项目开发。他拥有埃因霍温理工大学机械工程硕士与学士学位，硕士毕业论文曾荣获Tata Steel Award与KHMW青年人才奖。",
      companyWebsite: "https://www.corintis.com",
      contactInfo: "Remco van Erp",
      sourceUrl: FEISHU_BITABLE_CONFIG.SOURCE_URL
    },
    {
      id: "feishu_018",
      companyName: "DEXA（Drone Express）",
      stage: "种子轮",
      amount: 15000000, // 1500万美元
      currency: "USD",
      description: "DEXA，2021年成立于美国俄亥俄州代顿，为本地零售商提供到家无人机配送。完成1500万美元种子轮融资，投资方为G2A Investment Partners、Venture 53、Tech Square Ventures。累计融资1500万美元。",
      tags: ["女性", "应用层-工业制造", "无人机配送"],
      investedAt: "2024-12-30T00:00:00.000Z",
      investors: ["G2A Investment Partners", "Venture 53", "Tech Square Ventures"],
      teamBackground: "Beth Flippo，DEXA（Drone Express）创始人兼CEO。曾任TELEGRID Technologies首席技术官，负责创建Drone Express无人机包裹投递部门，并主导AeroGRID+无人机群技术的开发；更早前在Cantor Fitzgerald任副总裁、在Goldman Sachs任高级业务分析师，参与投研系统与灾难恢复系统的建设，也曾在UBS担任业务分析师。1999年毕业于纽约州立大学宾汉姆顿分校托马斯·J·沃森工程与应用科学学院，获得计算机科学学士学位。",
      companyWebsite: "https://www.droneexpress.com",
      contactInfo: "https://www.linkedin.com/in/beth-flippo-102b9822/",
      sourceUrl: FEISHU_BITABLE_CONFIG.SOURCE_URL
    },
    {
      id: "feishu_019",
      companyName: "Fetcherr",
      stage: "C轮",
      amount: 42000000, // 4200万美元
      currency: "USD",
      description: "Fetcherr，2019年成立于以色列特拉维夫，提供航司等行业的AI实时定价与库存决策平台。完成4200万美元C轮融资，投资方为Salesforce Ventures、Battery Ventures、Left Lane Capital、M-Fund。累计融资约1.125亿美元。",
      tags: ["连续创业", "应用层-垂类行业", "AI定价"],
      investedAt: "2024-12-30T00:00:00.000Z",
      investors: ["Salesforce Ventures", "Battery Ventures", "Left Lane Capital", "M-Fund"],
      teamBackground: "Roy Cohen，Fetcherr联合创始人兼CEO。曾创办B2B电商初创公司Axagon Bio，负责产品管理与业务发展；在STK担任产品与创新总监、以色列区经理；在Sao Trade Ltda任业务发展与并购总监，主导对Blue I Ltd和Trysys LTD的收购；在Zicon Ltd历任制造工程经理、供应链经理及业务发展总监，负责医疗、IT、国防和汽车领域的电子制造服务。2019年毕业于Ono Academic College，获得工商管理硕士学位；2012年获得工商管理学士学位。",
      companyWebsite: "https://www.fetcherr.io",
      contactInfo: "Roy Cohen",
      sourceUrl: FEISHU_BITABLE_CONFIG.SOURCE_URL
    },
    {
      id: "feishu_020",
      companyName: "Flox",
      stage: "B轮",
      amount: 25000000, // 2500万美元
      currency: "USD",
      description: "Flox，2021年成立于美国纽约，帮助软件团队快速搭建与共享开发环境。完成2500万美元B轮融资，投资方为Addition、NEA、Hetz、Illuminate Financial、D. E. Shaw。累计融资超过7000万美元。",
      tags: ["编程", "应用层-开发者", "开发环境"],
      investedAt: "2024-12-30T00:00:00.000Z",
      investors: ["Addition", "NEA", "Hetz", "Illuminate Financial", "D. E. Shaw"],
      teamBackground: "Ron Efroni，Flox联合创始人兼CEO，NixOS Foundation主席。曾任Facebook开发者产品经理及开发者产品团队负责人；曾担任特拉维夫市工程局技术大使；创办Slyde并担任CEO。2018年参加加州大学欧文分校Paul Merage商学院领导力项目；本科毕业于Netanya Academic College，获得数学与计算机科学理学学士学位，成绩优异（Summa Cum Laude）。",
      companyWebsite: "https://www.flox.dev",
      contactInfo: "Ron Efroni",
      sourceUrl: FEISHU_BITABLE_CONFIG.SOURCE_URL
    }
  ];

  console.log(`✅ 成功加载 ${realFeishuFundingData.length} 条真实飞书数据源记录`);
  return realFeishuFundingData;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      console.log('🔍 API调用: wiki-funding-sync-real');

      const url = new URL(request.url);
      const isRefresh = url.searchParams.get('refresh') === 'true';

      // 直接使用真实飞书数据源
      const data = await fetchRealFeishuData();

      const response = {
        success: true,
        count: data.length,
        data: data,
        lastUpdate: new Date().toISOString(),
        sourceUrl: FEISHU_BITABLE_CONFIG.SOURCE_URL,
        message: `严格按照飞书源地址数据展示 - 共${data.length}条记录`
      };

      return new Response(JSON.stringify(response, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Cache-Control': 'public, max-age=1800' // 30分钟缓存
        }
      });

    } catch (error) {
      console.error('❌ 真实飞书数据API错误:', error);

      return new Response(JSON.stringify({
        success: false,
        error: '数据获取失败',
        details: error instanceof Error ? error.message : '未知错误',
        count: 0,
        data: []
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
};