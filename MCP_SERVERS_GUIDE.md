# 🛠️ 你的MCP服务器完整清单与使用指南

## 📋 已安装的MCP服务器

### 1. **✅ Firecrawl MCP** (可用)
**功能**: 网页抓取和内容提取
```bash
# 状态: ✓ Connected
# 命令: npx -y firecrawl-mcp
```

**使用方法**:
```
"使用firecrawl抓取https://example.com的内容并提取主要信息"
"用firecrawl获取这个网站的结构化数据转换为JSON格式"
```

**典型应用场景**:
- 🔍 竞品网站分析
- 📊 市场数据收集
- 📰 新闻内容抓取
- 🏢 公司信息提取

### 2. **❌ Playwright MCP** (连接失败)
**功能**: 浏览器自动化和测试
```bash
# 状态: ✗ Failed to connect  
# 命令: npx @playwright/mcp@latest
```

**修复方法**:
```bash
npm install -g @playwright/mcp@latest
claude mcp add playwright
```

**预期功能**:
- 🤖 自动化浏览器操作
- 📸 网页截图和PDF生成  
- 🧪 E2E测试自动化
- 🔍 网页元素检查

### 3. **❌ Shadcn UI MCP** (连接失败)
**功能**: UI组件库集成
```bash
# 状态: ✗ Failed to connect
# 命令: npx -y @modelcontextprotocol/server-shadcn-ui
```

**修复方法**:
```bash
claude mcp add shadcn-ui
```

**预期功能**:
- 🎨 快速UI组件生成
- 📱 现代化React组件
- 🎯 TypeScript支持
- 🔧 自动依赖管理

### 4. **🔧 SuperDesign MCP** (本地项目)
**位置**: `/home/lium/chatsvtr/superdesign-mcp-claude-code/`
**功能**: AI设计生成和迭代

**激活方法**:
```bash
cd superdesign-mcp-claude-code
npm run build
npm start
```

**使用方法**:
```
"用superdesign生成一个现代化的Dashboard设计"
"基于我的交易精选页面，创建3个视觉变体"
```

**已有资源**:
- ✅ 3个SVTR Landing页面变体
- ✅ 8个设计迭代示例
- ✅ 完整的Gallery预览系统

### 5. **🔧 Claude Code MCP** (本地项目)
**位置**: `/home/lium/chatsvtr/claude-code-mcp/`
**功能**: Claude Code核心功能封装

**工具列表**:
- `bash` - 执行Shell命令
- `read_file` - 读取文件内容
- `write_file` - 写入文件
- `list_files` - 列出目录文件
- `search_glob` - 文件名模式搜索
- `grep_search` - 文件内容搜索

## 🚀 高效使用策略

### **场景1: 网页数据采集**
```bash
# 使用Firecrawl抓取竞品数据
"用firecrawl抓取TechCrunch上关于AI创投的最新文章，提取：
- 文章标题和摘要
- 公司名称和融资金额
- 发布时间
转换为JSON格式供SVTR使用"
```

### **场景2: 设计迭代**
```bash
# 使用SuperDesign快速原型
"用superdesign为SVTR创建一个实时数据监控面板：
- 显示AI融资实时动态
- 卡片式布局，玻璃态效果
- 响应式设计，支持移动端
- 3个配色方案变体"
```

### **场景3: 自动化测试**
```bash
# 使用Playwright测试SVTR功能
"用playwright测试交易精选页面：
- 检查所有公司卡片是否正确显示
- 验证数据加载和渲染性能
- 测试移动端响应式布局
- 生成测试报告截图"
```

## 🔧 MCP服务器管理

### **检查服务器状态**
```bash
claude mcp list                    # 列出所有MCP服务器
claude mcp health                  # 检查服务器健康状态
```

### **添加新的MCP服务器**
```bash
claude mcp add [server-name]       # 添加官方MCP服务器
claude mcp add [npm-package]       # 添加NPM包MCP服务器
```

### **常用MCP服务器推荐**

#### **数据处理类**
```bash
claude mcp add sqlite              # SQLite数据库操作
claude mcp add postgres            # PostgreSQL集成
claude mcp add redis               # Redis缓存操作
```

#### **开发工具类**
```bash
claude mcp add git                 # Git版本控制
claude mcp add docker              # Docker容器管理
claude mcp add kubernetes          # K8s集群操作
```

#### **API集成类**
```bash
claude mcp add github              # GitHub API集成
claude mcp add slack               # Slack消息发送
claude mcp add gmail               # Gmail邮件处理
```

## 💡 针对SVTR项目的MCP应用

### **1. 数据收集增强**
```bash
# 使用Firecrawl收集AI创投数据
"用firecrawl定期抓取以下网站的AI创投新闻：
- TechCrunch AI版块
- VentureBeat AI新闻
- PitchBook AI公司页面
整理成SVTR数据格式"
```

### **2. UI/UX快速迭代**
```bash
# 使用SuperDesign优化界面
"基于SVTR现有的trading-picks页面，用superdesign创建：
- 更现代的数据可视化组件
- 交互式筛选和搜索界面  
- 移动端优化的卡片布局
- 深色模式支持"
```

### **3. 自动化质量保证**
```bash
# 使用Playwright进行全面测试
"为SVTR网站创建自动化测试套件：
- 页面加载性能测试
- 聊天机器人功能验证
- 数据同步准确性检查
- 跨浏览器兼容性测试"
```

### **4. 内容管理自动化**
```bash
# 结合Firecrawl和Claude Code MCP
"创建SVTR内容管理工作流：
1. Firecrawl抓取最新AI创投新闻
2. Claude Code MCP分析和格式化内容
3. 自动更新SVTR知识库
4. 生成每周AI创投报告"
```

## 🔍 故障排除

### **MCP连接失败**
```bash
# 检查Node.js版本 (需要>=18)
node --version

# 重新安装MCP服务器
npm uninstall -g @playwright/mcp
npm install -g @playwright/mcp@latest

# 清理Claude Code MCP缓存
rm -rf ~/.claude-code/mcp-cache
```

### **端口冲突**
```bash
# 检查端口占用
lsof -i :3000

# 修改MCP服务器端口
export MCP_PORT=3001
```

### **权限问题**
```bash
# 给MCP脚本执行权限
chmod +x superdesign-mcp-claude-code/dist/index.js
chmod +x claude-code-mcp/dist/index.js
```

## 📊 性能优化建议

### **1. 并行运行MCP服务器**
```bash
# 同时启动多个MCP服务器
npm run mcp:start:all
```

### **2. 缓存常用操作**
```bash
# 为Firecrawl设置本地缓存
export FIRECRAWL_CACHE_DIR="./cache/firecrawl"
```

### **3. 资源限制**
```bash
# 限制MCP服务器内存使用
export NODE_OPTIONS="--max-old-space-size=2048"
```

## 🎯 下一步行动

### **立即可用**
1. ✅ **Firecrawl**: 开始抓取AI创投网站数据
2. ✅ **SuperDesign**: 生成SVTR界面优化方案

### **需要修复**
1. 🔧 **Playwright**: 修复连接，启用自动化测试
2. 🔧 **Shadcn UI**: 重新安装，加速UI开发

### **推荐增加**
1. 📊 **SQLite MCP**: 本地数据库管理
2. 🔗 **GitHub MCP**: 自动化代码部署
3. 📧 **Slack MCP**: 数据同步通知

---

## 🚀 快速开始命令

```bash
# 检查当前MCP状态
claude mcp list

# 修复失效的MCP服务器
claude mcp add playwright
claude mcp add shadcn-ui

# 启动本地MCP服务器
cd superdesign-mcp-claude-code && npm start &
cd claude-code-mcp && npm start &

# 开始使用
"用firecrawl抓取AI创投新闻"
"用superdesign优化SVTR界面"
```

**💡 记住：MCP服务器让Claude Code具备了超强的扩展能力，善用它们能让你的开发效率提升数倍！**