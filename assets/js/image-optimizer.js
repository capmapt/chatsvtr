/**
 * SVTR.AI 图片优化和懒加载增强系统
 * 提供更激进的缓存策略和性能优化
 */

class ImageOptimizer {
  constructor(options = {}) {
    this.options = {
      rootMargin: '50px 0px',
      threshold: 0.01,
      enableWebP: true,
      enableAVIF: false, // 暂时禁用AVIF，兼容性问题
      cacheTimeout: 86400000, // 24小时缓存
      ...options
    };

    this.observer = null;
    this.loadedImages = new Set();
    this.failedImages = new Set();
    this.imageCache = new Map();
    this.init();
  }

  init() {
    // 检查浏览器支持
    this.checkBrowserSupport();

    // 初始化Intersection Observer
    this.initIntersectionObserver();

    // 扫描现有图片
    this.scanImages();

    // 设置事件监听
    this.setupEventListeners();

    // 预加载关键图片
    this.preloadCriticalImages();
  }

  checkBrowserSupport() {
    // 检查WebP支持
    if (this.options.enableWebP) {
      this.supportsWebP = this.checkWebPSupport();
    }

    // 检查AVIF支持
    if (this.options.enableAVIF) {
      this.supportsAVIF = this.checkAVIFSupport();
    }

    // 检查Intersection Observer支持
    this.supportsIntersectionObserver = 'IntersectionObserver' in window;

    console.log('图片优化器浏览器支持情况:', {
      webP: this.supportsWebP,
      avif: this.supportsAVIF,
      intersectionObserver: this.supportsIntersectionObserver
    });
  }

  checkWebPSupport() {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    } catch {
      return false;
    }
  }

  checkAVIFSupport() {
    return new Promise((resolve) => {
      const avif = new Image();
      avif.onload = avif.onerror = () => resolve(avif.height === 2);
      avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAaWlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
    });
  }

  initIntersectionObserver() {
    if (!this.supportsIntersectionObserver) {
      // 降级到scroll事件
      console.warn('不支持Intersection Observer，使用scroll事件降级');
      this.setupScrollFallback();
      return;
    }

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadImage(entry.target);
          this.observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: this.options.rootMargin,
      threshold: this.options.threshold
    });
  }

  setupScrollFallback() {
    let ticking = false;

    const checkImages = () => {
      const images = document.querySelectorAll('img[data-src]:not([data-loaded])');
      images.forEach(img => {
        if (this.isInViewport(img)) {
          this.loadImage(img);
        }
      });
      ticking = false;
    };

    const scrollHandler = () => {
      if (!ticking) {
        requestAnimationFrame(checkImages);
        ticking = true;
      }
    };

    window.addEventListener('scroll', scrollHandler, { passive: true });
    window.addEventListener('resize', scrollHandler, { passive: true });
  }

  isInViewport(element) {
    const rect = element.getBoundingClientRect();
    const margin = parseInt(this.options.rootMargin, 10);

    return (
      rect.bottom >= -margin &&
      rect.right >= -margin &&
      rect.top <= (window.innerHeight || document.documentElement.clientHeight) + margin &&
      rect.left <= (window.innerWidth || document.documentElement.clientWidth) + margin
    );
  }

  scanImages() {
    // 扫描所有需要懒加载的图片
    const images = document.querySelectorAll('img[data-src], picture source[data-srcset]');

    images.forEach(element => {
      if (element.tagName === 'IMG') {
        this.setupImageElement(element);
      } else if (element.tagName === 'SOURCE') {
        this.setupSourceElement(element);
      }
    });
  }

  setupImageElement(img) {
    // 设置占位符
    if (!img.src && !img.hasAttribute('src')) {
      img.src = this.generatePlaceholder(
        img.dataset.width || 300,
        img.dataset.height || 200
      );
    }

    // 添加加载状态类
    img.classList.add('lazy-image');

    // 开始观察
    if (this.observer) {
      this.observer.observe(img);
    }
  }

  setupSourceElement(source) {
    const picture = source.closest('picture');
    if (picture) {
      const img = picture.querySelector('img');
      if (img && this.observer) {
        this.observer.observe(img);
      }
    }
  }

  async loadImage(img) {
    if (this.loadedImages.has(img) || this.failedImages.has(img)) {
      return;
    }

    img.classList.add('lazy-loading');

    try {
      // 获取最优图片源
      const imageSrc = await this.getOptimalImageSrc(img);

      // 预加载图片
      await this.preloadSingleImage(imageSrc);

      // 处理picture元素中的source
      const picture = img.closest('picture');
      if (picture) {
        this.updatePictureSources(picture);
      }

      // 更新img元素
      img.src = imageSrc;
      img.removeAttribute('data-src');
      img.setAttribute('data-loaded', 'true');

      // 添加加载完成的类
      img.classList.remove('lazy-loading');
      img.classList.add('lazy-loaded');

      this.loadedImages.add(img);

      // 触发自定义事件
      img.dispatchEvent(new CustomEvent('imageLoaded', {
        detail: { src: imageSrc }
      }));

    } catch (error) {
      console.warn('图片加载失败:', error);
      this.handleImageError(img, error);
    }
  }

  async getOptimalImageSrc(img) {
    const baseSrc = img.dataset.src || img.src;

    if (!baseSrc) {
      throw new Error('没有可用的图片源');
    }

    // 尝试从缓存获取
    const cacheKey = this.getCacheKey(baseSrc);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    // 生成不同格式的候选URL
    const candidates = this.generateImageCandidates(baseSrc);

    // 选择最佳格式
    const optimalSrc = await this.selectBestFormat(candidates);

    // 缓存结果
    this.setCache(cacheKey, optimalSrc);

    return optimalSrc;
  }

  generateImageCandidates(baseSrc) {
    const candidates = [{ src: baseSrc, format: 'original' }];

    // 尝试生成WebP版本
    if (this.supportsWebP && baseSrc.includes('.')) {
      const webpSrc = baseSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp');
      candidates.unshift({ src: webpSrc, format: 'webp' });
    }

    // 尝试生成AVIF版本（如果支持）
    if (this.supportsAVIF && baseSrc.includes('.')) {
      const avifSrc = baseSrc.replace(/\.(jpg|jpeg|png|webp)$/i, '.avif');
      candidates.unshift({ src: avifSrc, format: 'avif' });
    }

    return candidates;
  }

  async selectBestFormat(candidates) {
    // 按优先级尝试加载
    for (const candidate of candidates) {
      try {
        const isAvailable = await this.checkImageAvailability(candidate.src);
        if (isAvailable) {
          console.log(`选择图片格式: ${candidate.format} - ${candidate.src}`);
          return candidate.src;
        }
      } catch {
        continue;
      }
    }

    // 如果都失败了，返回原始源
    return candidates[candidates.length - 1].src;
  }

  checkImageAvailability(src) {
    return new Promise((resolve) => {
      const img = new Image();

      const cleanup = () => {
        img.onload = null;
        img.onerror = null;
      };

      img.onload = () => {
        cleanup();
        resolve(true);
      };

      img.onerror = () => {
        cleanup();
        resolve(false);
      };

      // 设置超时
      setTimeout(() => {
        cleanup();
        resolve(false);
      }, 3000);

      img.src = src;
    });
  }

  preloadSingleImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`图片加载失败: ${src}`));

      // 设置超时
      setTimeout(() => reject(new Error('图片加载超时')), 10000);

      img.src = src;
    });
  }

  updatePictureSources(picture) {
    const sources = picture.querySelectorAll('source[data-srcset]');

    sources.forEach(source => {
      const srcset = source.dataset.srcset;
      if (srcset) {
        source.srcset = srcset;
        source.removeAttribute('data-srcset');
      }
    });
  }

  handleImageError(img, error) {
    img.classList.remove('lazy-loading');
    img.classList.add('lazy-error');

    this.failedImages.add(img);

    // 设置错误占位符
    img.src = this.generateErrorPlaceholder();
    img.alt = img.alt || '图片加载失败';

    // 触发错误事件
    img.dispatchEvent(new CustomEvent('imageError', {
      detail: { error: error.message }
    }));
  }

  generatePlaceholder(width = 300, height = 200) {
    // 生成轻量级SVG占位符
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f0f0f0"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#ccc" font-family="sans-serif" font-size="14">加载中...</text>
      </svg>
    `;

    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
  }

  generateErrorPlaceholder() {
    const svg = `
      <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f5f5f5" stroke="#ddd" stroke-width="1"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999" font-family="sans-serif" font-size="14">图片加载失败</text>
      </svg>
    `;

    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
  }

  preloadCriticalImages() {
    // 预加载关键图片（logo、banner等）
    const criticalImages = [
      'assets/images/logo.webp',
      'assets/images/logo.jpg',
      'assets/images/banner.webp',
      'assets/images/banner.png'
    ];

    criticalImages.forEach(src => {
      this.preloadSingleImage(src).catch(error => {
        console.log(`关键图片预加载失败: ${src}`, error);
      });
    });
  }

  setupEventListeners() {
    // 监听动态添加的图片
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const images = node.querySelectorAll ?
              node.querySelectorAll('img[data-src]') :
              (node.tagName === 'IMG' && node.hasAttribute('data-src') ? [node] : []);

            images.forEach(img => this.setupImageElement(img));
          }
        });
      });
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // 缓存管理
  getCacheKey(src) {
    return 'img_' + btoa(src).slice(0, 16);
  }

  getFromCache(key) {
    try {
      const item = localStorage.getItem(key);
      if (!item) {
        return null;
      }

      const parsed = JSON.parse(item);
      if (Date.now() - parsed.timestamp > this.options.cacheTimeout) {
        localStorage.removeItem(key);
        return null;
      }

      return parsed.value;
    } catch {
      return null;
    }
  }

  setCache(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify({
        value,
        timestamp: Date.now()
      }));
    } catch {
      // 缓存空间不足时忽略
    }
  }

  // 公共API
  refreshImages() {
    this.scanImages();
  }

  loadAllImages() {
    const images = document.querySelectorAll('img[data-src]:not([data-loaded])');
    images.forEach(img => this.loadImage(img));
  }

  getStats() {
    return {
      loaded: this.loadedImages.size,
      failed: this.failedImages.size,
      cached: this.imageCache.size,
      browserSupport: {
        webP: this.supportsWebP,
        avif: this.supportsAVIF,
        intersectionObserver: this.supportsIntersectionObserver
      }
    };
  }
}

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
  window.imageOptimizer = new ImageOptimizer({
    rootMargin: '100px 0px', // 更激进的预加载距离
    threshold: 0.01,
    enableWebP: true
  });

  console.log('图片优化器已启动:', window.imageOptimizer.getStats());
});

// 导出
window.ImageOptimizer = ImageOptimizer;
