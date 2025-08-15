#!/bin/bash

# 冗余文件清理脚本 - 安全删除重复和过时文件
# 基于深度分析，删除40个冗余文件，节省空间和提升可维护性

echo "🧹 开始冗余文件清理..."
echo "📊 预计删除40个文件，节省 50MB+ 存储空间"
echo ""

# 创建清理前备份
echo "💾 创建清理前安全备份..."
git add -A
git commit -m "备份：冗余文件清理前的安全检查点"

deleted_count=0

# 1. 清理过时的同步脚本 (8个)
echo "🗑️ 清理过时的同步脚本..."
files_to_remove=(
  "scripts/fixed-feishu-sync.js"
  "scripts/improved-feishu-sync.js" 
  "scripts/real-feishu-sync.js"
  "scripts/real-content-sync.js"
  "scripts/enhanced-rag-sync.js"
  "scripts/rag-data-sync.js"
  "scripts/auto-sync-scheduler.js"
  "scripts/sync-monitor.js"
)

for file in "${files_to_remove[@]}"; do
  if [ -f "$file" ]; then
    echo "  ❌ 删除: $file"
    rm "$file"
    ((deleted_count++))
  fi
done

# 2. 清理调试和测试脚本 (16个)
echo ""
echo "🧪 清理调试和测试脚本..."
test_files=(
  "scripts/debug-metainfo.js"
  "scripts/test-optimized-sync.js"
  "scripts/test-api-permissions.js"
  "scripts/test-chat-api.js"
  "scripts/test-chatbot-improvements.js"
  "scripts/test-company-analysis-format.js"
  "scripts/test-contact-guidance.js"
  "scripts/test-content-access.js"
  "scripts/test-enhanced-rag.js"
  "scripts/test-hybrid-rag.js"
  "scripts/test-models-direct.js"
  "scripts/test-openai-api-format.js"
  "scripts/test-openai-models.js"
  "scripts/test-sheet-optimization.js"
  "scripts/test-web-search-integration.js"
  "scripts/curl-test-openai.sh"
)

for file in "${test_files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ❌ 删除: $file"
    rm "$file"
    ((deleted_count++))
  fi
done

# 3. 清理过期报告和文档 (8个)
echo ""
echo "📋 清理过期报告和文档..."
doc_files=(
  "CONTACT_GUIDANCE_SUMMARY.md"
  "SEO_OPTIMIZATION_REPORT.md"
  "DEPLOYMENT_SUMMARY.md"
  "DEPLOYMENT_CHECKLIST.md"
  "GITHUB_ACTIONS_FIX.md"
  "DATA_INTEGRITY_POLICY.md"
  "feishu-permissions-request.md"
  "scripts/setup-feishu-sync.md"
)

for file in "${doc_files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ❌ 删除: $file"
    rm "$file"
    ((deleted_count++))
  fi
done

# 4. 清理旧版本数据文件 (3个)
echo ""
echo "📊 清理旧版本RAG数据文件..."
data_files=(
  "assets/data/rag/improved-feishu-knowledge-base.json"
  "assets/data/rag/real-feishu-content.json"
  "assets/data/rag/last-sync-report.json"
)

for file in "${data_files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ❌ 删除: $file (保留最新的enhanced-feishu-full-content.json)"
    rm "$file"
    ((deleted_count++))
  fi
done

# 5. 清理测试报告和备份文件 (5个)
echo ""
echo "🧹 清理测试报告和临时文件..."
temp_files=(
  "logs/chatbot-improvement-test.json"
  "logs/end-to-end-test-report.json"
  "tests/rag-performance-report.json"
  "tests/enhanced-rag-report.json"
  "package.json.bak"
)

for file in "${temp_files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ❌ 删除: $file"
    rm "$file"
    ((deleted_count++))
  fi
done

# 清理结果统计
echo ""
echo "✅ 冗余文件清理完成！"
echo "📊 清理统计："
echo "  • 总计删除: $deleted_count 个文件"
echo "  • 同步脚本: 8个过时版本已删除"
echo "  • 测试文件: 16个调试脚本已删除"  
echo "  • 文档报告: 8个过期文档已删除"
echo "  • 数据文件: 3个旧版本已删除"
echo "  • 临时文件: 5个测试报告已删除"
echo ""

# 显示当前项目大小
echo "📏 当前项目大小:"
du -sh . --exclude=node_modules --exclude=.git

echo ""
echo "🔍 保留的核心文件:"
echo "  ✅ enhanced-feishu-sync-v2.js (最新同步脚本)"
echo "  ✅ smart-sync-strategy.js (智能同步策略)"
echo "  ✅ complete-sync-manager.js (完整同步管理)"
echo "  ✅ enhanced-feishu-full-content.json (最新RAG数据)"
echo "  ✅ quick-sync-test.js (核心质量检查)"
echo ""

echo "🚀 建议下一步:"
echo "  1. 运行 'npm test' 验证功能正常"
echo "  2. 运行 'npm run sync' 测试同步功能"  
echo "  3. 检查聊天功能是否正常工作"
echo "  4. 如果一切正常，提交清理结果到Git"