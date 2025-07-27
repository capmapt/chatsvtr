#!/bin/bash

# ChatSVTR 文件清理脚本
# 清理未使用的原版本文件，保持优化版本

echo "🧹 开始清理 ChatSVTR 项目文件..."

# 1. 清理 .wrangler 临时文件 (保留 node_modules)
echo "清理 .wrangler 临时文件..."
if [ -d ".wrangler/tmp" ]; then
    rm -rf .wrangler/tmp/*
    echo "✅ 清理 .wrangler/tmp 完成"
fi

# 2. 清理重复的资源文件 (保留优化版本)
echo "清理重复的 CSS 和 JS 文件..."

# 删除未优化的原版本文件，保留优化版本
cd assets/css/
# 检查是否存在优化版本再删除原版本
if [ -f "style-optimized.css" ] && [ -f "style.css" ]; then
    rm style.css
    echo "✅ 删除 style.css (保留 style-optimized.css)"
fi

if [ -f "chat-optimized.css" ] && [ -f "chat.css" ]; then
    rm chat.css
    echo "✅ 删除 chat.css (保留 chat-optimized.css)"
fi

cd ../js/
if [ -f "main-optimized.js" ] && [ -f "main.js" ]; then
    rm main.js
    echo "✅ 删除 main.js (保留 main-optimized.js)"
fi

if [ -f "chat-optimized.js" ] && [ -f "chat.js" ]; then
    # chat.js 比较大，先备份一份再删除
    cp chat.js chat.js.backup
    rm chat.js
    echo "✅ 删除 chat.js (已备份为 chat.js.backup，保留 chat-optimized.js)"
fi

if [ -f "i18n-optimized.js" ] && [ -f "i18n.js" ]; then
    rm i18n.js
    echo "✅ 删除 i18n.js (保留 i18n-optimized.js)"
fi

cd ../../

# 3. 清理已删除的Git文件
echo "清理 Git 暂存区中的已删除文件..."
git add -u 2>/dev/null || echo "未在 Git 仓库中或无需更新"

# 4. 显示清理结果
echo ""
echo "📊 清理完成统计："
echo "当前项目大小:"
du -sh . 2>/dev/null | cut -f1 || echo "无法计算大小"

echo ""
echo "剩余资源文件:"
echo "CSS 文件:"
ls -la assets/css/ | grep -E "\.(css|map|gz)$" | wc -l
echo "JS 文件:"
ls -la assets/js/ | grep -E "\.(js|map|gz)$" | wc -l

echo ""
echo "✅ 文件清理完成！"
echo "💡 建议：如需恢复原版本文件，可以从备份或 Git 历史中恢复"