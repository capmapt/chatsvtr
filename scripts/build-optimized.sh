#!/bin/bash
# 自动构建脚本 - 从源文件生成优化版本

echo "🔨 构建优化版本..."

# JavaScript压缩
if command -v terser &> /dev/null; then
    terser assets/js/chat.js --compress --mangle -o assets/js/chat-optimized.js --source-map
    terser assets/js/main.js --compress --mangle -o assets/js/main-optimized.js --source-map  
    terser assets/js/i18n.js --compress --mangle -o assets/js/i18n-optimized.js --source-map
    echo "✅ JavaScript压缩完成"
else
    echo "⚠️ terser未安装，跳过JS压缩"
fi

# CSS压缩  
if command -v cleancss &> /dev/null; then
    cleancss -o assets/css/style-optimized.css assets/css/style.css
    cleancss -o assets/css/chat-optimized.css assets/css/chat.css
    echo "✅ CSS压缩完成"
else
    echo "⚠️ clean-css未安装，跳过CSS压缩"  
fi

echo "🎉 构建完成！请运行测试验证功能正常"
