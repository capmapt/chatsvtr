/**
 * SVTR.AI Build Configuration
 * 构建配置管理
 */

export const BUILD_CONFIG = {
  // 输入文件
  input: {
    html: ['index.html', 'pages/**/*.html'],
    css: ['assets/css/**/*.css', '!assets/css/**/*-optimized.css'],
    js: ['assets/js/**/*.js', '!assets/js/**/*-optimized.js'],
    images: ['assets/images/**/*.{png,jpg,jpeg,gif,svg}']
  },

  // 输出目录
  output: {
    base: 'dist',
    css: 'assets/css',
    js: 'assets/js',
    images: 'assets/images'
  },

  // 优化选项
  optimization: {
    // CSS优化
    css: {
      minify: true,
      sourcemap: true,
      autoprefixer: true,
      purgecss: false // 待实施
    },
    
    // JS优化
    js: {
      minify: true,
      sourcemap: true,
      bundle: true,
      moduleFormat: 'es6'
    },
    
    // HTML优化
    html: {
      minify: true,
      removeComments: true,
      collapseWhitespace: true
    },
    
    // 图片优化
    images: {
      webp: true,
      quality: 80,
      progressive: true,
      sizes: [400, 800, 1200, 1600]
    }
  },

  // 压缩配置
  compression: {
    gzip: true,
    brotli: false, // 待实施
    level: 9
  },

  // 开发服务器
  devServer: {
    port: 3000,
    host: 'localhost',
    open: true,
    hot: true,
    proxy: {
      '/api': 'http://localhost:8787' // Cloudflare Workers 本地开发
    }
  },

  // 部署配置
  deployment: {
    platform: 'cloudflare-pages',
    buildCommand: 'npm run build',
    outputDir: '.',
    environmentVariables: [
      'CLOUDFLARE_API_TOKEN',
      'CLOUDFLARE_ACCOUNT_ID'
    ]
  }
};

// 环境特定配置
export const ENVIRONMENT_CONFIGS = {
  development: {
    ...BUILD_CONFIG,
    optimization: {
      ...BUILD_CONFIG.optimization,
      css: { ...BUILD_CONFIG.optimization.css, minify: false },
      js: { ...BUILD_CONFIG.optimization.js, minify: false },
      html: { ...BUILD_CONFIG.optimization.html, minify: false }
    }
  },
  
  production: {
    ...BUILD_CONFIG,
    optimization: {
      ...BUILD_CONFIG.optimization,
      images: {
        ...BUILD_CONFIG.optimization.images,
        quality: 75 // 生产环境更激进的压缩
      }
    }
  }
};

export function getBuildConfig(env = 'production') {
  return ENVIRONMENT_CONFIGS[env] || BUILD_CONFIG;
}