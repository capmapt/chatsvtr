#!/usr/bin/env node
/**
 * 静态文章页面生成器 (SSG)
 * 从 community-articles-v3.json 生成 119 个独立的 HTML 文章页面
 * 用于 SEO 优化和提升搜索引擎可见性
 */

const fs = require('fs');
const path = require('path');

// ========================================
// 配置
// ========================================

const CONFIG = {
  dataFile: path.join(__dirname, '../assets/data/community-articles-v3.json'),
  templateFile: path.join(__dirname, '../templates/article.html'),
  outputDir: path.join(__dirname, '../articles'),  // 修改：直接输出到根目录的articles文件夹，避免_routes.json冲突
  sitemapFile: path.join(__dirname, '../sitemap.xml'),
  baseUrl: 'https://svtr.ai',
  testMode: process.argv.includes('--test'), // 测试模式，只生成前5篇
  verbose: process.argv.includes('--verbose') // 详细日志
};

// ========================================
// 工具函数
// ========================================

/**
 * 生成URL友好的slug
 */
function generateSlug(title, id) {
  // 使用ID作为主要标识，确保唯一性
  const nodeId = id.split('_').pop().substring(0, 8);

  // 提取标题中的英文和数字
  const englishPart = title
    .match(/[a-zA-Z0-9]+/g)
    ?.join('-')
    .toLowerCase()
    .substring(0, 50) || '';

  // 组合: 英文部分-节点ID
  return englishPart ? `${englishPart}-${nodeId}` : nodeId;
}

/**
 * HTML转义
 */
function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * 截取摘要
 */
function generateExcerpt(content, maxLength = 160) {
  if (!content) return '';

  // 移除HTML标签和特殊字符
  const plainText = content
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (plainText.length <= maxLength) return plainText;

  return plainText.substring(0, maxLength) + '...';
}

/**
 * 生成关键词
 */
function generateKeywords(article) {
  const keywords = [];

  // 添加标签
  if (article.tags && article.tags.length > 0) {
    keywords.push(...article.tags);
  }

  // 添加垂直标签
  if (article.verticalTags && article.verticalTags.length > 0) {
    keywords.push(...article.verticalTags);
  }

  // 添加内容类型
  if (article.contentTypeInfo && article.contentTypeInfo.name) {
    keywords.push(article.contentTypeInfo.name);
  }

  // 添加通用关键词
  keywords.push('AI', '创投', 'SVTR');

  // 去重并限制数量
  return [...new Set(keywords)].slice(0, 10).join(', ');
}

/**
 * 格式化日期
 */
function formatDate(dateStr) {
  if (!dateStr) return new Date().toISOString().split('T')[0];

  try {
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
  } catch (e) {
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * 格式化显示日期
 */
function formatDisplayDate(dateStr) {
  if (!dateStr) return '最近';

  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (e) {
    return '最近';
  }
}

/**
 * 渲染富文本内容为HTML
 */
function renderRichContent(article) {
  let html = '';

  // 如果有 richBlocks，使用富文本渲染
  if (article.richBlocks && article.richBlocks.length > 0) {
    html = renderRichBlocks(article.richBlocks);
  }
  // 否则使用纯文本内容
  else if (article.content) {
    // 将纯文本转换为HTML段落
    const paragraphs = article.content.split('\n\n');
    html = paragraphs
      .filter(p => p.trim())
      .map(p => {
        // 检测标题
        if (p.startsWith('# ')) {
          return `<h1>${escapeHtml(p.substring(2))}</h1>`;
        } else if (p.startsWith('## ')) {
          return `<h2>${escapeHtml(p.substring(3))}</h2>`;
        } else if (p.startsWith('### ')) {
          return `<h3>${escapeHtml(p.substring(4))}</h3>`;
        } else if (p.startsWith('#### ')) {
          return `<h4>${escapeHtml(p.substring(5))}</h4>`;
        }
        // 普通段落
        return `<p>${escapeHtml(p)}</p>`;
      })
      .join('\n');
  }

  return html || '<p>暂无内容</p>';
}

/**
 * 渲染富文本块 (参考 rich-content-renderer.js)
 */
function renderRichBlocks(blocks) {
  const htmlParts = [];
  let imageCount = 0;
  let tableCount = 0;

  blocks.forEach((block) => {
    const blockType = block.block_type;

    switch (blockType) {
      case 1: // 页面根节点 (page)
        if (block.page && block.page.elements) {
          const title = renderTextElements(block.page.elements);
          if (title) {
            htmlParts.push(`<h1>${title}</h1>`);
          }
        }
        break;

      case 2: // 普通段落 (text)
        if (block.text && block.text.elements) {
          const content = renderTextElements(block.text.elements);
          if (content.trim()) {
            htmlParts.push(`<p>${content}</p>`);
          }
        }
        break;

      case 3: // 标题 (heading)
        const headingLevel = getHeadingLevel(block);
        const headingKey = `heading${headingLevel}`;
        if (block[headingKey] && block[headingKey].elements) {
          const content = renderTextElements(block[headingKey].elements);
          const tag = `h${Math.min(headingLevel + 1, 6)}`; // h2-h6
          htmlParts.push(`<${tag}>${content}</${tag}>`);
        }
        break;

      case 27: // 图片
        imageCount++;
        htmlParts.push(renderImagePlaceholder(block.image, imageCount));
        break;

      case 30: // 表格
        tableCount++;
        htmlParts.push(renderTablePlaceholder());
        break;

      default:
        // 跳过未知类型
        break;
    }
  });

  return htmlParts.join('\n');
}

/**
 * 获取标题级别
 */
function getHeadingLevel(block) {
  for (let i = 1; i <= 9; i++) {
    if (block[`heading${i}`]) return i;
  }
  return 1;
}

/**
 * 渲染文本元素 (支持粗体、斜体、链接等)
 */
function renderTextElements(elements) {
  if (!elements || elements.length === 0) return '';

  return elements.map(element => {
    if (element.text_run) {
      const text = escapeHtml(element.text_run.content);
      const style = element.text_run.text_element_style;

      if (!style) return text;

      let html = text;

      // 应用样式
      if (style.bold) html = `<strong>${html}</strong>`;
      if (style.italic) html = `<em>${html}</em>`;
      if (style.underline) html = `<u>${html}</u>`;
      if (style.strikethrough) html = `<s>${html}</s>`;
      if (style.inline_code) html = `<code>${html}</code>`;

      // 处理链接
      if (element.text_run.link) {
        const url = escapeHtml(element.text_run.link.url);
        html = `<a href="${url}" target="_blank" rel="noopener noreferrer">${html}</a>`;
      }

      return html;
    }

    // 其他元素类型
    return '';
  }).join('');
}

/**
 * 渲染图片占位符
 */
function renderImagePlaceholder(imageInfo, index) {
  const width = imageInfo?.width || 800;
  const height = imageInfo?.height || 600;

  return `
    <div class="rich-image-placeholder" style="position: relative; min-height: 200px; background: #f8f9fa; border-radius: 12px; padding: 30px; margin: 20px 0; border: 2px dashed #e0e0e0; text-align: center;">
      <div class="placeholder-content" style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px;">
        <div class="placeholder-icon" style="font-size: 3rem; opacity: 0.6;">🖼️</div>
        <div class="placeholder-text" style="color: #666;">
          <strong style="display: block; font-size: 1rem; margin-bottom: 4px;">图片 ${index + 1}</strong>
          <span style="font-size: 0.875rem; color: #999;">${width} × ${height}px</span>
        </div>
        <p style="margin: 8px 0 0 0; font-size: 0.85rem; color: #888;">
          📷 图片包含在完整版文章中，点击文末按钮查看
        </p>
      </div>
    </div>
  `;
}

/**
 * 渲染表格占位符
 */
function renderTablePlaceholder() {
  return `
    <div class="rich-table-placeholder" style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; border: 2px dashed #e0e0e0; text-align: center;">
      <div style="font-size: 2rem; opacity: 0.6;">📊</div>
      <p style="color: #666; margin: 10px 0;">数据表格包含在完整版文章中</p>
    </div>
  `;
}

/**
 * 渲染标签HTML
 */
function renderTags(article) {
  const allTags = [];

  if (article.tags) allTags.push(...article.tags);
  if (article.verticalTags) allTags.push(...article.verticalTags);

  // 去重
  const uniqueTags = [...new Set(allTags)];

  if (uniqueTags.length === 0) return '';

  return uniqueTags
    .map(tag => `<span class="article-tag">${escapeHtml(tag)}</span>`)
    .join('\n');
}

/**
 * 生成相关文章HTML (简单版本，随机选择3篇)
 */
function renderRelatedArticles(currentArticle, allArticles) {
  // 过滤掉当前文章
  const otherArticles = allArticles.filter(a => a.id !== currentArticle.id);

  // 随机选择3篇
  const shuffled = otherArticles.sort(() => 0.5 - Math.random());
  const related = shuffled.slice(0, 3);

  if (related.length === 0) return '';

  return related.map(article => {
    const slug = generateSlug(article.title, article.id);
    return `
      <a href="${slug}.html" class="related-card">
        <h4>${escapeHtml(article.title)}</h4>
        <div class="meta">
          <span>${article.author?.name || 'SVTR'}</span> ·
          <span>${formatDisplayDate(article.date)}</span>
        </div>
      </a>
    `;
  }).join('\n');
}

/**
 * 生成单篇文章HTML
 */
function generateArticleHTML(article, template, allArticles) {
  const slug = generateSlug(article.title, article.id);
  const excerpt = article.excerpt || generateExcerpt(article.content);
  const keywords = generateKeywords(article);
  const content = renderRichContent(article);
  const tags = renderTags(article);
  const relatedArticles = renderRelatedArticles(article, allArticles);

  // 替换模板占位符
  return template
    .replace(/\{\{title\}\}/g, escapeHtml(article.title))
    .replace(/\{\{slug\}\}/g, slug)
    .replace(/\{\{excerpt\}\}/g, escapeHtml(excerpt))
    .replace(/\{\{keywords\}\}/g, keywords)
    .replace(/\{\{author\}\}/g, escapeHtml(article.author?.name || 'SVTR.AI'))
    .replace(/\{\{category\}\}/g, escapeHtml(article.contentTypeInfo?.name || '资讯'))
    .replace(/\{\{datePublished\}\}/g, formatDate(article.date))
    .replace(/\{\{dateModified\}\}/g, formatDate(article.date))
    .replace(/\{\{displayDate\}\}/g, formatDisplayDate(article.date))
    .replace(/\{\{coverImage\}\}/g, 'https://svtr.ai/assets/images/og-default.png')
    .replace(/\{\{content\}\}/g, content)
    .replace(/\{\{tags\}\}/g, tags)
    .replace(/\{\{feishuUrl\}\}/g, article.source?.url || '#')
    .replace(/\{\{relatedArticles\}\}/g, relatedArticles);
}

/**
 * 生成sitemap.xml
 */
function generateSitemap(articles) {
  const urls = articles.map(article => {
    const slug = generateSlug(article.title, article.id);
    const lastmod = formatDate(article.date);

    return `  <url>
    <loc>${CONFIG.baseUrl}/articles/${slug}.html</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${CONFIG.baseUrl}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${CONFIG.baseUrl}/pages/content-community.html</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
${urls}
</urlset>`;
}

// ========================================
// 主函数
// ========================================

async function main() {
  console.log('🚀 开始生成静态文章页面 (SSG)...\n');

  try {
    // 1. 读取数据
    console.log('📖 读取文章数据...');
    const articlesData = JSON.parse(fs.readFileSync(CONFIG.dataFile, 'utf-8'));
    let articles = articlesData.articles || [];

    console.log(`✓ 找到 ${articles.length} 篇文章`);

    // 测试模式：只生成前5篇
    if (CONFIG.testMode) {
      articles = articles.slice(0, 5);
      console.log(`⚠️  测试模式：只生成前 ${articles.length} 篇文章\n`);
    }

    // 2. 读取模板
    console.log('📄 读取HTML模板...');
    const template = fs.readFileSync(CONFIG.templateFile, 'utf-8');
    console.log('✓ 模板加载成功\n');

    // 3. 创建输出目录
    if (!fs.existsSync(CONFIG.outputDir)) {
      fs.mkdirSync(CONFIG.outputDir, { recursive: true });
      console.log(`✓ 创建输出目录: ${CONFIG.outputDir}\n`);
    }

    // 4. 生成文章页面
    console.log(`📝 生成 ${articles.length} 篇文章页面...\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      const slug = generateSlug(article.title, article.id);
      const outputPath = path.join(CONFIG.outputDir, `${slug}.html`);

      try {
        const html = generateArticleHTML(article, template, articles);
        fs.writeFileSync(outputPath, html, 'utf-8');

        successCount++;

        if (CONFIG.verbose) {
          console.log(`  ✓ [${i + 1}/${articles.length}] ${slug}.html - ${article.title.substring(0, 40)}...`);
        } else if ((i + 1) % 10 === 0) {
          console.log(`  进度: ${i + 1}/${articles.length} 篇...`);
        }
      } catch (error) {
        errorCount++;
        console.error(`  ✗ [${i + 1}/${articles.length}] 生成失败: ${article.title}`);
        console.error(`    错误: ${error.message}`);
      }
    }

    console.log(`\n✅ 文章页面生成完成: ${successCount} 成功, ${errorCount} 失败\n`);

    // 5. 生成sitemap.xml
    if (!CONFIG.testMode) {
      console.log('🗺️  生成 sitemap.xml...');
      const sitemap = generateSitemap(articlesData.articles);
      fs.writeFileSync(CONFIG.sitemapFile, sitemap, 'utf-8');
      console.log(`✓ Sitemap 已生成: ${CONFIG.sitemapFile}\n`);
    }

    // 6. 生成统计报告
    console.log('📊 统计报告:');
    console.log(`  总文章数: ${articlesData.totalArticles}`);
    console.log(`  生成页面: ${successCount}`);
    console.log(`  输出目录: ${CONFIG.outputDir}`);
    if (!CONFIG.testMode) {
      console.log(`  Sitemap: ${CONFIG.sitemapFile}`);
    }
    console.log('\n✨ SSG 构建完成！');

  } catch (error) {
    console.error('❌ 构建失败:', error);
    process.exit(1);
  }
}

// 运行主函数
main();
