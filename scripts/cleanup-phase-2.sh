#!/bin/bash

# ChatSVTR 项目清理脚本 - 阶段2 (选择性清理)
# 需要评估的文件，建议先分析再删除

echo "🔍 ChatSVTR 项目清理 - 阶段2 (评估清理)"

# 1. 分析测试脚本使用情况
echo "📊 分析测试脚本..."
echo "发现 $(find scripts/ -name 'test-*.js' | wc -l) 个测试脚本:"
find scripts/ -name 'test-*.js' -exec basename {} \; | sort

# 2. 分析日志文件
echo "📋 分析日志文件..."
echo "日志文件占用空间:"
du -sh logs/

# 3. 分析文档文件
echo "📄 分析文档文件..."
echo "根目录MD文件:"
ls -la *.md | awk '{print $5, $9}' | sort -rn

echo ""
echo "🤔 阶段2需要手动决策:"
echo "1. 测试脚本: 保留核心测试，删除临时调试脚本"
echo "2. 日志文件: 保留最近的，删除旧的"
echo "3. 文档文件: 合并到docs/目录或删除过期的"
echo ""
echo "💡 建议先备份后再清理："
echo "   git commit -am 'backup before phase-2 cleanup'"

# 选择性清理示例（注释状态，需要手动启用）
echo ""
echo "🚨 以下命令需要手动执行（请先评估）:"
echo ""
echo "# 清理旧的测试脚本（保留必要的）"
echo "# rm scripts/test-{specific-old-scripts}.js"
echo ""
echo "# 清理旧的日志文件（保留最近30天的）"
echo "# find logs/ -name '*.log' -mtime +30 -delete"
echo ""
echo "# 清理过期文档"
echo "# rm {specific-outdated-docs}.md"
echo ""
echo "# 清理覆盖率报告（可重新生成）"
echo "# rm -rf coverage/ playwright-report/ test-results/"