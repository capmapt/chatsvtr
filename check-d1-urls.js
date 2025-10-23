/**
 * 检查D1中的published_url格式
 */

async function check() {
  const response = await fetch('https://da47a9ad.chatsvtr.pages.dev/api/d1/query?table=published_articles&limit=5');
  const result = await response.json();

  if (result.success) {
    console.log('📊 D1中的published_url格式:\n');
    result.data.forEach((article, i) => {
      console.log(`${i + 1}. ${article.meta_title?.substring(0, 50) || '未命名'}`);
      console.log(`   published_url: ${article.published_url}`);
      console.log(`   slug: ${article.slug}`);
      console.log('');
    });

    // 检查文件是否存在
    console.log('\n🔍 检查实际文件路径:\n');
    result.data.forEach((article, i) => {
      const expectedPath = article.published_url?.replace('/pages/', '').replace('.html', '.html');
      console.log(`${i + 1}. ${expectedPath}`);
    });
  }
}

check();
