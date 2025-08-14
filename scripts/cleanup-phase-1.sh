#!/bin/bash

# ChatSVTR 项目清理脚本 - 阶段1 (立即清理)
# 删除明确无用的备份和测试文件

echo "🧹 开始 ChatSVTR 项目清理 - 阶段1"

# 1. 删除RAG数据备份文件 (保留最新的enhanced-feishu-full-content.json)
echo "🗑️  清理RAG数据备份..."
rm -f assets/data/rag/*backup*.json
rm -f assets/data/rag/*.backup-*

# 2. 删除assets备份目录 (已有optimized版本)
echo "🗑️  清理资源备份..."
rm -rf assets/backup/
rm -rf assets/images/backup/

# 3. 删除根目录测试HTML文件
echo "🗑️  清理测试HTML文件..."
rm -f debug-production.html
rm -f final-diagnosis.html  
rm -f layout-test.html
rm -f mobile-width-test.html
rm -f sidebar-resize-test.html
rm -f sidebar-test.html
rm -f simple-test.html
rm -f test-browser-location.html
rm -f test-kerry.html

# 4. 删除调试脚本
echo "🗑️  清理调试脚本..."
rm -f disable-sw-dev.js
rm -f debug-env-detection.js
rm -f test-ai-call.js

# 5. 删除临时文件
echo "🗑️  清理临时文件..."
rm -f response.txt
rm -f headers.txt
rm -f server.log

# 6. 删除重复配置文件
echo "🗑️  清理重复配置..."
rm -f config/jest.config.js
rm -f config/wrangler.toml
rm -f config/svtr-sync-scheduler.service

# 7. 删除整个backups目录
echo "🗑️  清理备份目录..."
rm -rf backups/

# 8. 删除脚本备份
echo "🗑️  清理脚本备份..."
rm -f scripts/*backup*.js

echo "✅ 阶段1清理完成！预计节省 50MB+ 存储空间"
echo "📊 运行 'du -sh .' 查看当前项目大小"