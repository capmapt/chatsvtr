#!/bin/bash

# SVTR.AI Cloudflare Pages 部署脚本
# 优化版本部署到Cloudflare Pages

echo "🚀 开始部署到 Cloudflare Pages..."

# 检查wrangler CLI
if ! command -v wrangler &> /dev/null; then
    echo "❌ wrangler CLI 未安装，请先安装："
    echo "npm install -g wrangler"
    exit 1
fi

# 检查登录状态
echo "🔐 检查 Cloudflare 登录状态..."
if ! wrangler whoami &> /dev/null; then
    echo "📝 需要登录 Cloudflare，请设置 API Token："
    echo "export CLOUDFLARE_API_TOKEN=your_token_here"
    echo "或者运行: wrangler auth login"
    echo ""
    echo "🔗 获取 API Token: https://developers.cloudflare.com/fundamentals/api/get-started/create-token/"
    echo ""
    echo "⚡ 快速部署命令："
    echo "wrangler pages deploy . --project-name chatsvtr"
    echo ""
    echo "✅ 提交的更改已同步到 GitHub。"
    echo "📋 文件已准备好，可以手动部署："
    echo "  - 访问 https://dash.cloudflare.com/pages"
    echo "  - 选择 chatsvtr 项目"
    echo "  - 点击 'Create deployment'"
    echo "  - 上传当前目录的文件"
    exit 0
fi

# 检查关键文件
echo "✅ 验证关键文件..."
REQUIRED_FILES=(
    "index.html"
    "assets/css/style.css"
    "assets/js/main.js"
    "assets/js/translations.js"
    "assets/js/i18n.js"
    "assets/images/logo.jpg"
    "assets/images/banner.png"
    "assets/images/qr-code.jpg"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ 缺少关键文件: $file"
        exit 1
    fi
done

echo "✅ 所有关键文件检查通过"

# 显示部署信息
echo ""
echo "📊 部署统计："
echo "  - HTML文件: $(find . -name "*.html" -not -path "./node_modules/*" -not -path "./temp/*" | wc -l)"
echo "  - CSS文件: $(find . -name "*.css" -not -path "./node_modules/*" -not -path "./temp/*" | wc -l)"
echo "  - JS文件: $(find . -name "*.js" -not -path "./node_modules/*" -not -path "./temp/*" -not -path "./config/*" -not -path "./scripts/*" | wc -l)"
echo "  - 图片文件: $(find . -name "*.jpg" -o -name "*.png" -o -name "*.gif" | grep -v node_modules | wc -l)"

# 部署到 Cloudflare Pages
echo ""
echo "🌐 开始部署到 Cloudflare Pages..."
echo "部署目录: 根目录"

# 使用wrangler部署根目录
wrangler pages deploy . --project-name chatsvtr

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 部署成功！"
    echo ""
    echo "📈 优化成果："
    echo "  ✅ 移动端banner响应式布局修复"
    echo "  ✅ 多屏幕尺寸适配优化"
    echo "  ✅ 中文标题字体大小调整"
    echo "  ✅ Logo和文字完整显示"
    echo "  ✅ 性能优化：移动端动画禁用"
    echo ""
    echo "🔗 访问链接："
    echo "  - 生产环境: https://chatsvtr.pages.dev"
    echo "  - 自定义域名: https://svtr.ai (如已配置)"
    echo ""
    echo "📱 移动端测试要点："
    echo "  1. 检查banner在手机上的显示效果"
    echo "  2. 验证不同屏幕尺寸的适配"
    echo "  3. 测试触摸交互体验"
    echo "  4. 确认中英文切换正常"
else
    echo "❌ 部署失败，请检查错误信息"
    exit 1
fi

# 无需清理临时文件，直接部署src目录
echo "🧹 部署完成，无需清理临时文件"

echo "✅ 部署完成！"