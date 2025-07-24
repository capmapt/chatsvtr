# 飞书API自动化同步设置指南

## 1. 创建飞书应用

### 步骤1: 进入飞书开放平台
访问 [飞书开放平台](https://open.feishu.cn/app) 并登录

### 步骤2: 创建企业自建应用
1. 点击"创建应用" -> "企业自建应用"
2. 填写应用基本信息
3. 记录生成的 `App ID` 和 `App Secret`

### 步骤3: 配置应用权限
在应用管理页面，添加以下权限：

**文档权限:**
- `docx:document` - 获取文档内容
- `wiki:wiki` - 访问知识库文档

**多维表格权限:**
- `bitable:app` - 访问多维表格应用
- `bitable:app:readonly` - 读取多维表格数据

### 步骤4: 发布应用
完成权限配置后，发布应用到企业

## 2. 配置环境变量

### 创建 .env 文件
```bash
cp .env.example .env
```

### 编辑 .env 文件
```env
FEISHU_APP_ID=cli_xxxxxxxxxxxx
FEISHU_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxx
```

## 3. 使用方法

### 手动同步
```bash
# 同步所有数据
npm run sync

# 仅同步AI周报
npm run sync:weekly

# 仅同步交易精选
npm run sync:trading
```

### 自动化部署
可以配置 GitHub Actions 或其他 CI/CD 工具定时执行：

```yaml
# .github/workflows/sync-data.yml
name: Sync Feishu Data
on:
  schedule:
    - cron: '0 9 * * 1' # 每周一上午9点执行
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run sync
        env:
          FEISHU_APP_ID: ${{ secrets.FEISHU_APP_ID }}
          FEISHU_APP_SECRET: ${{ secrets.FEISHU_APP_SECRET }}
```

## 4. 数据格式说明

脚本会自动解析飞书数据并转换为网站所需的JSON格式：

### AI周报数据结构
- 从文档标题提取期数
- 提取文档摘要和要点
- 生成飞书访问链接

### 交易精选数据结构
- 解析多维表格字段
- 提取公司基本信息
- 整理投资机构和分析要点

## 5. 故障排除

### 常见错误
1. **认证失败**: 检查App ID和Secret是否正确
2. **权限不足**: 确认应用已获得必要权限
3. **文档ID错误**: 确认飞书链接中的文档ID正确

### 调试模式
```bash
# 启用详细日志
DEBUG=feishu:* npm run sync
```

## 6. 安全注意事项

1. **环境变量保护**: 不要将 `.env` 文件提交到版本控制
2. **权限最小化**: 仅申请必要的API权限
3. **定期更新**: 定期轮换App Secret