import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ChevronRight, Layers, Activity, Compass, Moon, Star, Zap } from 'lucide-react';

// SVTR Landing Page Variant 3: Dark Minimalist
// Design: Clean, dark theme with subtle animations and elegant typography
// Color scheme: Dark backgrounds, purple/violet accents, minimal and sophisticated

const LandingPageV3 = () => {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Hero Section - 12 column responsive grid */}
      <section className="relative overflow-hidden py-20 lg:py-32" aria-labelledby="hero-heading">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/20 to-purple-950/20"></div>
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 relative">
          <div className="grid grid-cols-12 gap-8 items-center">
            <div className="col-span-12 text-center space-y-8">
              <div className="space-y-6">
                <Badge variant="secondary" className="text-violet-300 bg-violet-950/50 border-violet-800 backdrop-blur-sm">
                  <Star className="w-3 h-3 mr-2" />
                  Next Generation AI Investment Platform
                </Badge>
                
                <h1 
                  id="hero-heading"
                  className="text-5xl md:text-7xl lg:text-8xl font-light tracking-wide text-white leading-[0.9] max-w-6xl mx-auto"
                >
                  <span className="block font-extralight">Silicon Valley</span>
                  <span className="block font-bold bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                    Tech Review
                  </span>
                </h1>
                
                <p className="text-xl md:text-2xl text-slate-300 max-w-4xl mx-auto leading-relaxed font-light">
                  Where artificial intelligence meets venture capital. 
                  <span className="text-violet-300">Discover, analyze, and invest</span> in the future of AI.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button 
                  size="lg" 
                  className="bg-violet-600 hover:bg-violet-700 text-white px-12 py-6 text-lg font-medium border border-violet-500 hover:border-violet-400 transition-all duration-300"
                  aria-label="Explore AI investment database"
                >
                  Explore Database
                  <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="lg"
                  className="text-slate-300 border border-slate-700 hover:border-slate-600 px-12 py-6 text-lg font-medium hover:bg-slate-900/50 transition-all duration-300"
                  aria-label="Watch platform demo"
                >
                  Watch Demo
                </Button>
              </div>
            </div>
          </div>
          
          {/* Stats Section */}
          <div className="grid grid-cols-12 gap-6 mt-20">
            <div className="col-span-12 md:col-span-4">
              <div className="text-center p-6 rounded-lg bg-slate-900/30 backdrop-blur-sm border border-slate-800">
                <div className="text-4xl font-light text-white mb-2">1,247</div>
                <div className="text-slate-400 text-sm uppercase tracking-wider">AI Startups Tracked</div>
              </div>
            </div>
            
            <div className="col-span-12 md:col-span-4">
              <div className="text-center p-6 rounded-lg bg-slate-900/30 backdrop-blur-sm border border-slate-800">
                <div className="text-4xl font-light text-white mb-2">$52.4B</div>
                <div className="text-slate-400 text-sm uppercase tracking-wider">Total Investment Volume</div>
              </div>
            </div>
            
            <div className="col-span-12 md:col-span-4">
              <div className="text-center p-6 rounded-lg bg-slate-900/30 backdrop-blur-sm border border-slate-800">
                <div className="text-4xl font-light text-white mb-2">643</div>
                <div className="text-slate-400 text-sm uppercase tracking-wider">Investment Institutions</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Alternative Layout */}
      <section className="py-24 bg-slate-900" aria-labelledby="features-heading">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-12 gap-12 items-center mb-20">
            <div className="col-span-12 lg:col-span-6">
              <h2 
                id="features-heading"
                className="text-4xl md:text-5xl font-light text-white mb-6 leading-tight"
              >
                Three Pillars of
                <span className="block font-semibold text-violet-400">AI Investment</span>
              </h2>
              <p className="text-xl text-slate-300 leading-relaxed font-light">
                A comprehensive ecosystem designed for the modern AI investment landscape. 
                From data intelligence to community insights, every feature is crafted for excellence.
              </p>
            </div>
            
            <div className="col-span-12 lg:col-span-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="h-20 bg-gradient-to-br from-violet-600/20 to-purple-600/20 rounded-lg border border-violet-800/30"></div>
                  <div className="h-12 bg-gradient-to-br from-indigo-600/20 to-blue-600/20 rounded-lg border border-indigo-800/30"></div>
                </div>
                <div className="space-y-4 mt-8">
                  <div className="h-12 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-lg border border-purple-800/30"></div>
                  <div className="h-20 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-lg border border-blue-800/30"></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 lg:col-span-4">
              <Card className="h-full bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all duration-500 backdrop-blur-sm">
                <CardHeader className="pb-6">
                  <div className="w-12 h-12 bg-violet-600/20 rounded-lg flex items-center justify-center mb-6 border border-violet-600/30">
                    <Layers className="w-6 h-6 text-violet-400" />
                  </div>
                  <CardTitle className="text-xl font-medium text-white mb-3">
                    AI Investment Database
                  </CardTitle>
                  <CardDescription className="text-slate-400 leading-relaxed">
                    Comprehensive intelligence platform with real-time market data, 
                    funding analytics, and predictive insights.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-1 h-1 bg-violet-400 rounded-full"></div>
                      <span className="text-slate-300">Real-time funding tracker</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-1 h-1 bg-violet-400 rounded-full"></div>
                      <span className="text-slate-300">Institution profiling & analysis</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-1 h-1 bg-violet-400 rounded-full"></div>
                      <span className="text-slate-300">Market trend predictions</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="col-span-12 lg:col-span-4">
              <Card className="h-full bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all duration-500 backdrop-blur-sm">
                <CardHeader className="pb-6">
                  <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center mb-6 border border-purple-600/30">
                    <Activity className="w-6 h-6 text-purple-400" />
                  </div>
                  <CardTitle className="text-xl font-medium text-white mb-3">
                    Investment Community
                  </CardTitle>
                  <CardDescription className="text-slate-400 leading-relaxed">
                    Connect with top-tier investors, entrepreneurs, and industry experts 
                    in our exclusive community platform.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
                      <span className="text-slate-300">Expert insights & analysis</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
                      <span className="text-slate-300">Deal flow opportunities</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
                      <span className="text-slate-300">Curated networking events</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="col-span-12 lg:col-span-4">
              <Card className="h-full bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all duration-500 backdrop-blur-sm">
                <CardHeader className="pb-6">
                  <div className="w-12 h-12 bg-indigo-600/20 rounded-lg flex items-center justify-center mb-6 border border-indigo-600/30">
                    <Compass className="w-6 h-6 text-indigo-400" />
                  </div>
                  <CardTitle className="text-xl font-medium text-white mb-3">
                    Startup Accelerator
                  </CardTitle>
                  <CardDescription className="text-slate-400 leading-relaxed">
                    Showcase platform for AI startups to connect with investors 
                    and access growth resources.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-1 h-1 bg-indigo-400 rounded-full"></div>
                      <span className="text-slate-300">Project showcase platform</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-1 h-1 bg-indigo-400 rounded-full"></div>
                      <span className="text-slate-300">AI-powered investor matching</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-1 h-1 bg-indigo-400 rounded-full"></div>
                      <span className="text-slate-300">Comprehensive resource hub</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Logo Wall - Horizontal Layout */}
      <section className="py-16 bg-slate-950 border-y border-slate-800" aria-labelledby="partners-heading">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 
              id="partners-heading"
              className="text-2xl font-light text-slate-300 mb-4"
            >
              Trusted by Leading Investment Institutions
            </h2>
          </div>
          
          <div className="grid grid-cols-12 gap-8 items-center">
            <div className="col-span-6 md:col-span-4 lg:col-span-2">
              <div className="text-center py-6 px-4 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
                <div className="text-lg font-light text-slate-400 hover:text-slate-300 transition-colors">Sequoia Capital</div>
              </div>
            </div>
            
            <div className="col-span-6 md:col-span-4 lg:col-span-2">
              <div className="text-center py-6 px-4 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
                <div className="text-lg font-light text-slate-400 hover:text-slate-300 transition-colors">Andreessen Horowitz</div>
              </div>
            </div>
            
            <div className="col-span-6 md:col-span-4 lg:col-span-2">
              <div className="text-center py-6 px-4 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
                <div className="text-lg font-light text-slate-400 hover:text-slate-300 transition-colors">GGV Capital</div>
              </div>
            </div>
            
            <div className="col-span-6 md:col-span-4 lg:col-span-2">
              <div className="text-center py-6 px-4 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
                <div className="text-lg font-light text-slate-400 hover:text-slate-300 transition-colors">IDG Capital</div>
              </div>
            </div>
            
            <div className="col-span-6 md:col-span-4 lg:col-span-2">
              <div className="text-center py-6 px-4 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
                <div className="text-lg font-light text-slate-400 hover:text-slate-300 transition-colors">5Y Capital</div>
              </div>
            </div>
            
            <div className="col-span-6 md:col-span-4 lg:col-span-2">
              <div className="text-center py-6 px-4 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
                <div className="text-lg font-light text-slate-400 hover:text-slate-300 transition-colors">Matrix Partners</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-b from-slate-900 to-slate-950 relative" aria-labelledby="cta-heading">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/30 to-purple-950/30"></div>
        <div className="container mx-auto px-4 relative">
          <div className="grid grid-cols-12 gap-8 items-center">
            <div className="col-span-12 text-center">
              <div className="max-w-4xl mx-auto space-y-8">
                <h2 
                  id="cta-heading"
                  className="text-4xl md:text-6xl font-light text-white leading-tight"
                >
                  Ready to shape the
                  <span className="block font-semibold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                    future of AI?
                  </span>
                </h2>
                
                <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-light">
                  Join the most sophisticated AI investment platform and connect with 
                  the innovations that will define tomorrow.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg"
                    className="bg-violet-600 hover:bg-violet-700 text-white px-12 py-6 text-lg font-medium border border-violet-500 hover:border-violet-400 transition-all duration-300"
                    aria-label="Start your AI investment journey"
                  >
                    Start Your Journey
                    <ArrowRight className="ml-3 w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-300 py-16 border-t border-slate-800" role="contentinfo">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 md:col-span-6 lg:col-span-4">
              <div className="mb-8">
                <h3 className="text-2xl font-light text-white mb-3">SVTR</h3>
                <p className="text-slate-400 leading-relaxed">
                  Silicon Valley Tech Review - Connecting artificial intelligence 
                  with venture capital through data, community, and innovation.
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center hover:bg-slate-700 transition-colors cursor-pointer">
                  <Moon className="w-4 h-4" />
                </div>
                <div className="w-8 h-8 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center hover:bg-slate-700 transition-colors cursor-pointer">
                  <Zap className="w-4 h-4" />
                </div>
                <div className="w-8 h-8 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center hover:bg-slate-700 transition-colors cursor-pointer">
                  <Star className="w-4 h-4" />
                </div>
              </div>
            </div>
            
            <div className="col-span-12 md:col-span-6 lg:col-span-2">
              <h4 className="font-medium mb-6 text-white">Platform</h4>
              <ul className="space-y-3 text-slate-400" role="list">
                <li><a href="#" className="hover:text-violet-400 transition-colors">Investment Database</a></li>
                <li><a href="#" className="hover:text-violet-400 transition-colors">Community Hub</a></li>
                <li><a href="#" className="hover:text-violet-400 transition-colors">Startup Accelerator</a></li>
                <li><a href="#" className="hover:text-violet-400 transition-colors">Developer API</a></li>
              </ul>
            </div>
            
            <div className="col-span-12 md:col-span-6 lg:col-span-2">
              <h4 className="font-medium mb-6 text-white">Company</h4>
              <ul className="space-y-3 text-slate-400" role="list">
                <li><a href="#" className="hover:text-violet-400 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-violet-400 transition-colors">News & Updates</a></li>
                <li><a href="#" className="hover:text-violet-400 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-violet-400 transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div className="col-span-12 md:col-span-6 lg:col-span-2">
              <h4 className="font-medium mb-6 text-white">Resources</h4>
              <ul className="space-y-3 text-slate-400" role="list">
                <li><a href="#" className="hover:text-violet-400 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-violet-400 transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-violet-400 transition-colors">Community Forum</a></li>
                <li><a href="#" className="hover:text-violet-400 transition-colors">System Status</a></li>
              </ul>
            </div>
            
            <div className="col-span-12 md:col-span-6 lg:col-span-2">
              <h4 className="font-medium mb-6 text-white">Legal</h4>
              <ul className="space-y-3 text-slate-400" role="list">
                <li><a href="#" className="hover:text-violet-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-violet-400 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-violet-400 transition-colors">Cookie Policy</a></li>
                <li><a href="#" className="hover:text-violet-400 transition-colors">Disclaimer</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 mt-12 pt-8 text-center text-slate-500">
            <p>&copy; 2025 Silicon Valley Tech Review. Engineered for the future of AI investment.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPageV3;

// Minimal runnable example
// To use this component:
// 1. Install dependencies: npm install lucide-react
// 2. Ensure shadcn/ui components are installed and configured
// 3. Import and use the component in your app:
//
// import LandingPageV3 from './landing_v3';
// 
// function App() {
//   return <LandingPageV3 />;
// }