# 部署说明

## 📦 项目部署指南

### 🚀 Netlify 部署

1. **自动部署**
   - 连接GitHub仓库到Netlify
   - 每次push自动触发部署
   - 配置文件：`config/netlify.toml`

2. **手动部署**
   ```bash
   npm install -g netlify-cli
   netlify deploy --prod
   ```

### 🌐 GitHub Pages 部署

1. **设置**
   - 进入仓库Settings → Pages
   - 选择Source: Deploy from a branch
   - 选择Branch: main, 文件夹: / (root)

2. **访问地址**
   - https://capmapt.github.io/chatsvtr/

### 📁 文件结构说明

```
chatsvtr/
├── assets/           # 静态资源
│   ├── images/      # 图片文件
│   ├── css/         # 样式文件
│   └── js/          # JavaScript文件
├── pages/           # 页面文件
├── docs/            # 文档
├── config/          # 配置文件
├── index.html       # 主页
├── README.md        # 项目说明
└── package.json     # 项目配置
```

### 🔧 本地开发

```bash
# 启动本地服务器
npm start

# 开发模式
npm run dev
```

### 📊 性能优化

- 图片懒加载
- 脚本异步加载
- CSS预加载
- 静态资源缓存

### 🔗 重定向配置

- `AI 100.html` → `pages/ai-100.html`
- `凯瑞.jpg` → `assets/images/qr-code.jpg`

### 🛡️ 安全配置

- XSS保护
- 内容类型检查
- 框架保护
- 引用策略