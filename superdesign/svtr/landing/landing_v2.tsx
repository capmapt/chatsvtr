import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Sparkles, Heart, Target, Rocket, Brain, Network } from 'lucide-react';

// SVTR Landing Page Variant 2: Warm & Dynamic
// Design: Energetic, warm color palette with dynamic typography and organic spacing
// Color scheme: Orange/amber primary, warm reds, earth tones

const LandingPageV2 = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      {/* Hero Section - 12 column responsive grid */}
      <section className="relative overflow-hidden py-16 lg:py-24" aria-labelledby="hero-heading">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-12 gap-6 items-center">
            <div className="col-span-12 lg:col-span-8 space-y-6">
              <div className="space-y-4">
                <Badge variant="secondary" className="text-orange-700 bg-orange-100 border-orange-200 inline-flex items-center">
                  <Sparkles className="w-3 h-3 mr-1" />
                  驱动全球AI创新
                </Badge>
                <h1 
                  id="hero-heading"
                  className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter text-slate-800 leading-[0.9]"
                >
                  <span className="block">塑造</span>
                  <span className="block text-orange-500 bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                    AI未来
                  </span>
                  <span className="block text-3xl md:text-4xl lg:text-5xl font-medium text-slate-600 mt-2">
                    连接创新与资本
                  </span>
                </h1>
                <p className="text-lg md:text-xl text-slate-600 max-w-3xl leading-relaxed font-medium">
                  在这里，最前沿的AI创新遇见最具远见的投资者。SVTR不只是数据平台，
                  <span className="text-orange-600 font-semibold">更是推动人工智能革命的催化剂</span>
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-10 py-7 text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300"
                  aria-label="立即体验AI创投平台"
                >
                  立即体验
                  <Rocket className="ml-2 w-5 h-5" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-2 border-orange-300 text-orange-700 px-10 py-7 text-lg font-semibold hover:bg-orange-50 transition-all duration-300"
                  aria-label="了解更多产品信息"
                >
                  了解更多
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-8 text-sm font-semibold text-slate-500 pt-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                  <span>无需信用卡</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                  <span>7天免费试用</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                  <span>随时取消</span>
                </div>
              </div>
            </div>
            
            <div className="col-span-12 lg:col-span-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-red-500 rounded-3xl blur-xl opacity-30 scale-105"></div>
                <div className="relative bg-white rounded-2xl p-8 shadow-2xl border border-orange-100">
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="text-4xl font-black text-slate-800 mb-1">实时数据</div>
                      <div className="text-orange-600 font-medium">每日更新</div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 font-medium">AI公司</span>
                        <span className="text-2xl font-bold text-slate-800">1,247</span>
                      </div>
                      <div className="w-full bg-orange-100 rounded-full h-2">
                        <div className="bg-gradient-to-r from-orange-400 to-red-400 h-2 rounded-full w-4/5"></div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 font-medium">投资机构</span>
                        <span className="text-2xl font-bold text-slate-800">643</span>
                      </div>
                      <div className="w-full bg-orange-100 rounded-full h-2">
                        <div className="bg-gradient-to-r from-orange-400 to-red-400 h-2 rounded-full w-3/5"></div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 font-medium">交易总额</span>
                        <span className="text-2xl font-bold text-slate-800">$52B</span>
                      </div>
                      <div className="w-full bg-orange-100 rounded-full h-2">
                        <div className="bg-gradient-to-r from-orange-400 to-red-400 h-2 rounded-full w-full"></div>
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
          <div className="text-center mb-20">
            <h2 
              id="features-heading"
              className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight"
            >
              三大核心引擎
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              从数据洞察到社区连接，从项目孵化到投资匹配，
              <span className="text-orange-600 font-semibold">全方位赋能AI创投生态</span>
            </p>
          </div>
          
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 md:col-span-6 lg:col-span-4">
              <Card className="h-full border-orange-200 hover:border-orange-300 hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-white to-orange-50">
                <CardHeader className="pb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                    <Brain className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-slate-900 mb-2">
                    AI创投库
                  </CardTitle>
                  <CardDescription className="text-slate-600 text-base leading-relaxed">
                    智能数据驱动的投资决策平台，让每一个数据点都成为成功的基石
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <div className="font-semibold text-slate-800">实时融资追踪</div>
                        <div className="text-sm text-slate-600">全球融资动态，第一时间掌握</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <div className="font-semibold text-slate-800">机构画像分析</div>
                        <div className="text-sm text-slate-600">深度解析投资偏好和策略</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <div className="font-semibold text-slate-800">趋势预测引擎</div>
                        <div className="text-sm text-slate-600">AI驱动的市场趋势预判</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="col-span-12 md:col-span-6 lg:col-span-4">
              <Card className="h-full border-red-200 hover:border-red-300 hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-white to-red-50">
                <CardHeader className="pb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-pink-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                    <Heart className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-slate-900 mb-2">
                    AI创投会
                  </CardTitle>
                  <CardDescription className="text-slate-600 text-base leading-relaxed">
                    汇聚全球智慧的创投社区，在这里碰撞出改变世界的火花
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <div className="font-semibold text-slate-800">大咖观点分享</div>
                        <div className="text-sm text-slate-600">顶级投资人的独家见解</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <div className="font-semibold text-slate-800">机会发布台</div>
                        <div className="text-sm text-slate-600">优质项目与资本的直接对话</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <div className="font-semibold text-slate-800">活动生态圈</div>
                        <div className="text-sm text-slate-600">线上线下活动无缝连接</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="col-span-12 md:col-span-12 lg:col-span-4">
              <Card className="h-full border-amber-200 hover:border-amber-300 hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-white to-amber-50">
                <CardHeader className="pb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                    <Target className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-slate-900 mb-2">
                    AI创投营
                  </CardTitle>
                  <CardDescription className="text-slate-600 text-base leading-relaxed">
                    创业者的梦想孵化器，让每个伟大的想法都有被发现的机会
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <div className="font-semibold text-slate-800">项目展示舞台</div>
                        <div className="text-sm text-slate-600">专业包装，最大化曝光效果</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <div className="font-semibold text-slate-800">智能投资匹配</div>
                        <div className="text-sm text-slate-600">AI算法精准匹配投资人</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <div className="font-semibold text-slate-800">孵化资源池</div>
                        <div className="text-sm text-slate-600">全方位创业支持体系</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Logo Wall - Partner Logos */}
      <section className="py-20 bg-gradient-to-r from-orange-50 to-red-50" aria-labelledby="partners-heading">
        <div className="container mx-auto px-4">
          <h2 
            id="partners-heading"
            className="text-3xl font-bold text-center text-slate-900 mb-4"
          >
            与全球顶级机构并肩前行
          </h2>
          <p className="text-center text-slate-600 mb-16 text-lg">
            他们的信任，是我们前进的动力
          </p>
          
          <div className="grid grid-cols-12 gap-6 items-center">
            <div className="col-span-6 md:col-span-4 lg:col-span-2">
              <div className="bg-white rounded-xl p-8 h-24 flex items-center justify-center shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="text-xl font-black text-slate-700">Sequoia</div>
              </div>
            </div>
            
            <div className="col-span-6 md:col-span-4 lg:col-span-2">
              <div className="bg-white rounded-xl p-8 h-24 flex items-center justify-center shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="text-xl font-black text-slate-700">A16Z</div>
              </div>
            </div>
            
            <div className="col-span-6 md:col-span-4 lg:col-span-2">
              <div className="bg-white rounded-xl p-8 h-24 flex items-center justify-center shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="text-xl font-black text-slate-700">GGV Capital</div>
              </div>
            </div>
            
            <div className="col-span-6 md:col-span-4 lg:col-span-2">
              <div className="bg-white rounded-xl p-8 h-24 flex items-center justify-center shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="text-xl font-black text-slate-700">IDG Capital</div>
              </div>
            </div>
            
            <div className="col-span-6 md:col-span-4 lg:col-span-2">
              <div className="bg-white rounded-xl p-8 h-24 flex items-center justify-center shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="text-xl font-black text-slate-700">5Y Capital</div>
              </div>
            </div>
            
            <div className="col-span-6 md:col-span-4 lg:col-span-2">
              <div className="bg-white rounded-xl p-8 h-24 flex items-center justify-center shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="text-xl font-black text-slate-700">Matrix</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 relative overflow-hidden" aria-labelledby="cta-heading">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-4 relative">
          <div className="grid grid-cols-12 gap-8 items-center">
            <div className="col-span-12 lg:col-span-9 text-center lg:text-left">
              <h2 
                id="cta-heading"
                className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight"
              >
                不要让机会
                <span className="block">与你擦肩而过</span>
              </h2>
              <p className="text-xl text-orange-100 max-w-2xl leading-relaxed font-medium">
                加入SVTR，与全球最具前瞻性的AI创投者一起，
                <span className="font-bold text-white">书写人工智能的未来篇章</span>
              </p>
            </div>
            
            <div className="col-span-12 lg:col-span-3 flex justify-center lg:justify-end">
              <Button 
                size="lg"
                className="bg-white text-orange-600 hover:bg-orange-50 px-10 py-8 text-xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-1"
                aria-label="开启AI创投之旅"
              >
                开启旅程
                <ArrowRight className="ml-3 w-6 h-6" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-20" role="contentinfo">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 md:col-span-6 lg:col-span-5">
              <div className="mb-8">
                <h3 className="text-3xl font-black mb-3 bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                  SVTR
                </h3>
                <p className="text-slate-300 text-lg leading-relaxed">
                  硅谷科技评论 - 不仅仅是数据平台，更是连接全球AI创投生态的桥梁，
                  让每一个创新想法都有机会改变世界。
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center hover:scale-110 transition-transform cursor-pointer">
                  <Network className="w-5 h-5" />
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center hover:scale-110 transition-transform cursor-pointer">
                  <Brain className="w-5 h-5" />
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center hover:scale-110 transition-transform cursor-pointer">
                  <Rocket className="w-5 h-5" />
                </div>
              </div>
            </div>
            
            <div className="col-span-12 md:col-span-6 lg:col-span-2">
              <h4 className="font-bold mb-6 text-lg">产品矩阵</h4>
              <ul className="space-y-3 text-slate-300" role="list">
                <li><a href="#" className="hover:text-orange-400 transition-colors font-medium">AI创投库</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors font-medium">AI创投会</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors font-medium">AI创投营</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors font-medium">开发者API</a></li>
              </ul>
            </div>
            
            <div className="col-span-12 md:col-span-6 lg:col-span-2">
              <h4 className="font-bold mb-6 text-lg">关于我们</h4>
              <ul className="space-y-3 text-slate-300" role="list">
                <li><a href="#" className="hover:text-orange-400 transition-colors font-medium">公司愿景</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors font-medium">团队介绍</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors font-medium">新闻中心</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors font-medium">加入我们</a></li>
              </ul>
            </div>
            
            <div className="col-span-12 md:col-span-6 lg:col-span-3">
              <h4 className="font-bold mb-6 text-lg">联系支持</h4>
              <ul className="space-y-3 text-slate-300" role="list">
                <li><a href="#" className="hover:text-orange-400 transition-colors font-medium">帮助中心</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors font-medium">技术文档</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors font-medium">社区讨论</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors font-medium">服务状态</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-700 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-400">&copy; 2025 硅谷科技评论. 用心连接AI创投未来.</p>
            <div className="flex gap-6 text-sm">
              <a href="#" className="text-slate-400 hover:text-orange-400 transition-colors">隐私政策</a>
              <a href="#" className="text-slate-400 hover:text-orange-400 transition-colors">服务条款</a>
              <a href="#" className="text-slate-400 hover:text-orange-400 transition-colors">Cookie设置</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPageV2;

// Minimal runnable example
// To use this component:
// 1. Install dependencies: npm install lucide-react
// 2. Ensure shadcn/ui components are installed and configured  
// 3. Import and use the component in your app:
//
// import LandingPageV2 from './landing_v2';
// 
// function App() {
//   return <LandingPageV2 />;
// }