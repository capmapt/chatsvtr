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
    echo "📝 需要登录 Cloudflare，请运行："
    echo "wrangler auth login"
    exit 1
fi

# 创建临时部署目录
echo "📦 准备部署文件..."
DEPLOY_DIR="dist"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

# 复制需要部署的文件
echo "📋 复制静态资源..."
cp index.html $DEPLOY_DIR/
cp favicon.ico $DEPLOY_DIR/
cp -r assets/ $DEPLOY_DIR/assets/
cp -r pages/ $DEPLOY_DIR/pages/

# 检查关键文件
echo "✅ 验证关键文件..."
REQUIRED_FILES=(
    "$DEPLOY_DIR/index.html"
    "$DEPLOY_DIR/assets/css/style.css"
    "$DEPLOY_DIR/assets/js/main.js"
    "$DEPLOY_DIR/assets/js/translations.js"
    "$DEPLOY_DIR/assets/js/i18n.js"
    "$DEPLOY_DIR/assets/images/logo.jpg"
    "$DEPLOY_DIR/assets/images/banner.png"
    "$DEPLOY_DIR/assets/images/qr-code.jpg"
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
echo "  - HTML文件: $(find $DEPLOY_DIR -name "*.html" | wc -l)"
echo "  - CSS文件: $(find $DEPLOY_DIR -name "*.css" | wc -l)"
echo "  - JS文件: $(find $DEPLOY_DIR -name "*.js" | wc -l)"
echo "  - 图片文件: $(find $DEPLOY_DIR -name "*.jpg" -o -name "*.png" -o -name "*.gif" | wc -l)"
echo "  - 总文件数: $(find $DEPLOY_DIR -type f | wc -l)"
echo "  - 总大小: $(du -sh $DEPLOY_DIR | cut -f1)"

# 部署到 Cloudflare Pages
echo ""
echo "🌐 开始部署到 Cloudflare Pages..."
echo "部署目录: $DEPLOY_DIR"

# 使用wrangler部署
wrangler pages deploy $DEPLOY_DIR --project-name chatsvtr --compatibility-date 2024-07-16

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

# 清理临时文件
echo "🧹 清理临时文件..."
rm -rf $DEPLOY_DIR

echo "✅ 部署完成！"