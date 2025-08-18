import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Building2, 
  Calendar, 
  DollarSign, 
  Users, 
  ExternalLink,
  Sparkles,
  Target,
  Zap,
  ArrowUp,
  BarChart3
} from 'lucide-react';

interface Company {
  name: string;
  sector: string;
  stage: string;
  description: string;
  fundingAmount: string;
  lastFundingDate: string;
  investors: string[];
  analysisPoints: string[];
  website?: string;
  tags: string[];
  logo?: string;
  valuation?: string;
  growthRate?: string;
  confidence?: 'high' | 'medium' | 'low';
}

interface TradingData {
  meta: {
    totalCompanies: number;
    lastUpdated: string;
    totalFunding: string;
    averageValuation: string;
  };
  companies: Company[];
}

const AITradingSection: React.Component = () => {
  const [data, setData] = useState<TradingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');

  // 模拟数据（替代从JSON加载）
  const mockData: TradingData = {
    meta: {
      totalCompanies: 24,
      lastUpdated: new Date().toISOString(),
      totalFunding: "$2.4B",
      averageValuation: "$180M"
    },
    companies: [
      {
        name: "OpenAI",
        sector: "人工智能",
        stage: "成长期",
        description: "领先的人工智能研究公司，开发了GPT系列和ChatGPT等革命性AI产品",
        fundingAmount: "$10B",
        lastFundingDate: "2024-01-15",
        investors: ["Microsoft", "Khosla Ventures", "Reid Hoffman"],
        analysisPoints: [
          "市场领导地位稳固，用户规模超过1亿",
          "技术壁垒高，拥有强大的研发团队",
          "商业化进展迅速，API收入快速增长"
        ],
        website: "https://openai.com",
        tags: ["ChatGPT", "GPT-4", "API", "企业级AI"],
        valuation: "$80B",
        growthRate: "+340%",
        confidence: "high"
      },
      {
        name: "Anthropic",
        sector: "AI安全",
        stage: "成长期",
        description: "专注于AI安全研究，开发了Claude系列AI助手，强调安全可靠的AI系统",
        fundingAmount: "$4B",
        lastFundingDate: "2024-02-20",
        investors: ["Google", "Spark Capital", "Sound Ventures"],
        analysisPoints: [
          "AI安全领域的领军企业",
          "Claude模型在安全性和有用性方面表现优异",
          "获得Google等科技巨头战略投资"
        ],
        website: "https://anthropic.com",
        tags: ["Claude", "AI安全", "对话AI", "研究驱动"],
        valuation: "$18B",
        growthRate: "+280%",
        confidence: "high"
      },
      {
        name: "Midjourney",
        sector: "AI图像",
        stage: "成长期", 
        description: "领先的AI图像生成平台，通过Discord提供服务，在创意设计领域广受欢迎",
        fundingAmount: "未披露",
        lastFundingDate: "2023-12-10",
        investors: ["未公开"],
        analysisPoints: [
          "AI图像生成领域的标杆产品",
          "用户社区活跃，月活跃用户超千万",
          "商业模式成熟，订阅制收入稳定"
        ],
        website: "https://midjourney.com",
        tags: ["图像生成", "创意设计", "Discord", "订阅模式"],
        valuation: "$4B",
        growthRate: "+520%",
        confidence: "medium"
      }
    ]
  };

  useEffect(() => {
    // 模拟数据加载
    setTimeout(() => {
      setData(mockData);
      setLoading(false);
    }, 1000);
  }, []);

  const getConfidenceBadgeColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredCompanies = data?.companies.filter(company => {
    if (selectedFilter === 'all') return true;
    return company.sector.toLowerCase().includes(selectedFilter);
  }) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-white text-lg">正在加载AI交易精选...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-purple-400" />
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              AI交易精选
            </h1>
          </div>
          <p className="text-xl text-purple-200 max-w-2xl mx-auto">
            精选全球最具潜力的AI公司，为您提供专业的投资分析与机会洞察
          </p>
        </div>

        {/* Stats Bar */}
        {data && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
              <Building2 className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{data.meta.totalCompanies}</div>
              <div className="text-purple-200 text-sm">精选公司</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
              <DollarSign className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{data.meta.totalFunding}</div>
              <div className="text-purple-200 text-sm">总融资额</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
              <TrendingUp className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{data.meta.averageValuation}</div>
              <div className="text-purple-200 text-sm">平均估值</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
              <Calendar className="w-8 h-8 text-orange-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">实时</div>
              <div className="text-purple-200 text-sm">数据更新</div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {['all', '人工智能', 'AI安全', 'AI图像'].map((filter) => (
            <Button
              key={filter}
              variant={selectedFilter === filter ? "default" : "ghost"}
              className={`${
                selectedFilter === filter 
                  ? 'bg-purple-600 text-white' 
                  : 'text-purple-200 border-purple-400 hover:bg-purple-600/20'
              } border`}
              onClick={() => setSelectedFilter(filter)}
            >
              {filter === 'all' ? '全部' : filter}
            </Button>
          ))}
        </div>

        {/* Companies Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCompanies.map((company, index) => (
            <Card key={index} className="bg-white/95 backdrop-blur-sm border-white/20 hover:bg-white transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                      {company.name}
                    </CardTitle>
                    <div className="flex gap-2 flex-wrap mb-2">
                      <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                        {company.sector}
                      </Badge>
                      <Badge variant="outline" className="text-gray-600">
                        {company.stage}
                      </Badge>
                      {company.confidence && (
                        <Badge className={getConfidenceBadgeColor(company.confidence)}>
                          {company.confidence === 'high' ? '高信心' : 
                           company.confidence === 'medium' ? '中信心' : '低信心'}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {company.growthRate && (
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-green-600 font-semibold">
                        <ArrowUp className="w-4 h-4" />
                        {company.growthRate}
                      </div>
                    </div>
                  )}
                </div>
                
                <CardDescription className="text-gray-600 leading-relaxed">
                  {company.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Funding Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">融资金额</div>
                      <div className="font-semibold text-lg text-gray-900">
                        {company.fundingAmount}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">融资日期</div>
                      <div className="font-semibold text-gray-700">
                        {new Date(company.lastFundingDate).toLocaleDateString('zh-CN')}
                      </div>
                    </div>
                  </div>
                  
                  {company.valuation && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-sm text-gray-500 mb-1">估值</div>
                      <div className="font-bold text-xl text-purple-700">
                        {company.valuation}
                      </div>
                    </div>
                  )}
                </div>

                {/* Investors */}
                {company.investors.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      投资机构
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {company.investors.map((investor, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {investor}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Analysis Points */}
                {company.analysisPoints.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                      <BarChart3 className="w-4 h-4" />
                      分析要点
                    </div>
                    <div className="space-y-2">
                      {company.analysisPoints.slice(0, 2).map((point, i) => (
                        <div key={i} className="text-sm text-gray-600 p-2 bg-blue-50 rounded border-l-2 border-blue-300">
                          {point}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {company.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {company.tags.map((tag, i) => (
                      <Badge key={i} variant="outline" className="text-xs text-purple-600 border-purple-300">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Website Link */}
                {company.website && (
                  <div className="pt-2 border-t border-gray-100">
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <a href={company.website} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        访问官网
                      </a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-4">
              想要获取更多AI投资机会？
            </h3>
            <p className="text-purple-200 mb-6 max-w-2xl mx-auto">
              加入SVTR专业投资者社区，获取第一手AI创投资讯和深度分析报告
            </p>
            <div className="flex gap-4 justify-center">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3">
                <Zap className="w-4 h-4 mr-2" />
                立即加入
              </Button>
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8 py-3">
                了解更多
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AITradingSection;