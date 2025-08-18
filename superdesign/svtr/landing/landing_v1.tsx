import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, TrendingUp, Users, Database, Globe, Zap, Shield } from 'lucide-react';

// SVTR Landing Page Variant 1: Professional Tech Focus
// Design: Clean, modern, tech-focused with subtle gradients and professional typography
// Color scheme: Deep blue primary, bright accent colors, neutral grays

const LandingPageV1 = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section - 12 column responsive grid */}
      <section className="relative overflow-hidden py-20 lg:py-32" aria-labelledby="hero-heading">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-12 gap-8 items-center">
            <div className="col-span-12 lg:col-span-7 space-y-8">
              <div className="space-y-6">
                <Badge variant="secondary" className="text-blue-700 bg-blue-100 border-blue-200">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  全球AI创投生态系统
                </Badge>
                <h1 
                  id="hero-heading"
                  className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900"
                >
                  连接全球
                  <span className="block text-blue-600 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    AI创投生态
                  </span>
                </h1>
                <p className="text-xl md:text-2xl text-slate-600 max-w-2xl leading-relaxed">
                  硅谷科技评论为AI创投从业者提供数据驱动的洞察、投资机会发现和社区连接平台
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg"
                  aria-label="开始探索AI创投数据库"
                >
                  开始探索
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-slate-300 text-slate-700 px-8 py-6 text-lg hover:bg-slate-50"
                  aria-label="观看产品演示视频"
                >
                  观看演示
                </Button>
              </div>
            </div>
            
            <div className="col-span-12 lg:col-span-5">
              <div className="relative">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-8 shadow-2xl">
                  <div className="space-y-4 text-white">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                        <Database className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">1000+</div>
                        <div className="text-blue-100">AI初创公司</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">500+</div>
                        <div className="text-blue-100">投资机构</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                        <Globe className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">50+</div>
                        <div className="text-blue-100">全球市场</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - 3 Column Layout */}
      <section className="py-20 bg-white" aria-labelledby="features-heading">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 
              id="features-heading"
              className="text-3xl md:text-4xl font-bold text-slate-900 mb-4"
            >
              核心功能
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              为AI创投生态系统量身打造的专业工具和数据平台
            </p>
          </div>
          
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 md:col-span-6 lg:col-span-4">
              <Card className="h-full border-slate-200 hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Database className="w-6 h-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-slate-900">
                    AI创投库
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    结构化的AI初创公司和投资机构数据库，实时更新市场动态
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-slate-600" role="list">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      实时融资数据追踪
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      投资机构画像分析
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      市场趋势预测
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
            
            <div className="col-span-12 md:col-span-6 lg:col-span-4">
              <Card className="h-full border-slate-200 hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-slate-900">
                    AI创投会
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    社区驱动的内容平台，连接创业者、投资人和行业专家
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-slate-600" role="list">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      专家观点分享
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      投资机会发布
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      行业活动推荐
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
            
            <div className="col-span-12 md:col-span-12 lg:col-span-4">
              <Card className="h-full border-slate-200 hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                    <Zap className="w-6 h-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-slate-900">
                    AI创投营
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    个人和项目信息展示平台，助力创业者获得更多曝光
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-slate-600" role="list">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                      项目展示空间
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                      投资人匹配
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                      孵化资源对接
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Logo Wall - Partner Logos */}
      <section className="py-16 bg-slate-50" aria-labelledby="partners-heading">
        <div className="container mx-auto px-4">
          <h2 
            id="partners-heading"
            className="text-2xl font-semibold text-center text-slate-900 mb-12"
          >
            合作伙伴与信任机构
          </h2>
          
          <div className="grid grid-cols-12 gap-8 items-center">
            <div className="col-span-6 md:col-span-4 lg:col-span-2">
              <div className="bg-white rounded-lg p-6 h-20 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                <div className="text-2xl font-bold text-slate-400">Sequoia</div>
              </div>
            </div>
            
            <div className="col-span-6 md:col-span-4 lg:col-span-2">
              <div className="bg-white rounded-lg p-6 h-20 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                <div className="text-2xl font-bold text-slate-400">A16Z</div>
              </div>
            </div>
            
            <div className="col-span-6 md:col-span-4 lg:col-span-2">
              <div className="bg-white rounded-lg p-6 h-20 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                <div className="text-2xl font-bold text-slate-400">GGV</div>
              </div>
            </div>
            
            <div className="col-span-6 md:col-span-4 lg:col-span-2">
              <div className="bg-white rounded-lg p-6 h-20 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                <div className="text-2xl font-bold text-slate-400">IDG</div>
              </div>
            </div>
            
            <div className="col-span-6 md:col-span-4 lg:col-span-2">
              <div className="bg-white rounded-lg p-6 h-20 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                <div className="text-2xl font-bold text-slate-400">5Y Capital</div>
              </div>
            </div>
            
            <div className="col-span-6 md:col-span-4 lg:col-span-2">
              <div className="bg-white rounded-lg p-6 h-20 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                <div className="text-2xl font-bold text-slate-400">Matrix</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600" aria-labelledby="cta-heading">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-12 gap-8 items-center">
            <div className="col-span-12 lg:col-span-8 text-center lg:text-left">
              <h2 
                id="cta-heading"
                className="text-3xl md:text-4xl font-bold text-white mb-4"
              >
                准备好加入AI创投生态了吗？
              </h2>
              <p className="text-xl text-blue-100 max-w-2xl">
                立即注册，获取最新AI创投数据、投资机会和行业洞察
              </p>
            </div>
            
            <div className="col-span-12 lg:col-span-4 flex justify-center lg:justify-end">
              <Button 
                size="lg"
                className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg font-semibold"
                aria-label="立即免费注册SVTR平台"
              >
                立即注册
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16" role="contentinfo">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 md:col-span-6 lg:col-span-4">
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">SVTR</h3>
                <p className="text-slate-400">
                  硅谷科技评论 - 全球AI创投生态系统的连接者
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center">
                  <Globe className="w-4 h-4" />
                </div>
                <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
            </div>
            
            <div className="col-span-12 md:col-span-6 lg:col-span-2">
              <h4 className="font-semibold mb-4">产品</h4>
              <ul className="space-y-2 text-slate-400" role="list">
                <li><a href="#" className="hover:text-white transition-colors">AI创投库</a></li>
                <li><a href="#" className="hover:text-white transition-colors">AI创投会</a></li>
                <li><a href="#" className="hover:text-white transition-colors">AI创投营</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API接口</a></li>
              </ul>
            </div>
            
            <div className="col-span-12 md:col-span-6 lg:col-span-2">
              <h4 className="font-semibold mb-4">公司</h4>
              <ul className="space-y-2 text-slate-400" role="list">
                <li><a href="#" className="hover:text-white transition-colors">关于我们</a></li>
                <li><a href="#" className="hover:text-white transition-colors">新闻动态</a></li>
                <li><a href="#" className="hover:text-white transition-colors">职业机会</a></li>
                <li><a href="#" className="hover:text-white transition-colors">联系我们</a></li>
              </ul>
            </div>
            
            <div className="col-span-12 md:col-span-6 lg:col-span-2">
              <h4 className="font-semibold mb-4">资源</h4>
              <ul className="space-y-2 text-slate-400" role="list">
                <li><a href="#" className="hover:text-white transition-colors">帮助中心</a></li>
                <li><a href="#" className="hover:text-white transition-colors">开发者文档</a></li>
                <li><a href="#" className="hover:text-white transition-colors">社区论坛</a></li>
                <li><a href="#" className="hover:text-white transition-colors">状态页面</a></li>
              </ul>
            </div>
            
            <div className="col-span-12 md:col-span-6 lg:col-span-2">
              <h4 className="font-semibold mb-4">法律</h4>
              <ul className="space-y-2 text-slate-400" role="list">
                <li><a href="#" className="hover:text-white transition-colors">隐私政策</a></li>
                <li><a href="#" className="hover:text-white transition-colors">服务条款</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie政策</a></li>
                <li><a href="#" className="hover:text-white transition-colors">免责声明</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-700 mt-12 pt-8 text-center text-slate-400">
            <p>&copy; 2025 硅谷科技评论. 保留所有权利.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPageV1;

// Minimal runnable example
// To use this component:
// 1. Install dependencies: npm install lucide-react
// 2. Ensure shadcn/ui components are installed and configured
// 3. Import and use the component in your app:
//
// import LandingPageV1 from './landing_v1';
// 
// function App() {
//   return <LandingPageV1 />;
// }