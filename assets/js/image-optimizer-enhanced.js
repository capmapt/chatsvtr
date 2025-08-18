/**
 * 智能图片懒加载和优化
 */

class ImageOptimizer {
    constructor() {
        this.observer = null;
        this.loadedImages = new Set();
        this.init();
    }

    init() {
        if ('IntersectionObserver' in window) {
            this.setupIntersectionObserver();
        } else {
            // 降级处理
            this.loadAllImages();
        }
        
        this.setupImageErrorHandling();
        this.preloadCriticalImages();
    }

    setupIntersectionObserver() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                    this.observer.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.01
        });

        // 观察所有懒加载图片
        document.querySelectorAll('img[data-src]').forEach(img => {
            this.observer.observe(img);
        });
    }

    loadImage(img) {
        const src = img.dataset.src;
        if (!src || this.loadedImages.has(src)) return;

        img.src = src;
        img.classList.add('loading');
        
        img.onload = () => {
            img.classList.remove('loading');
            img.classList.add('loaded');
            this.loadedImages.add(src);
        };

        img.onerror = () => {
            img.classList.remove('loading');
            img.classList.add('error');
            this.handleImageError(img);
        };
    }

    handleImageError(img) {
        // WebP降级到原格式
        if (img.src.includes('.webp')) {
            const fallbackSrc = img.src.replace('.webp', '.jpg');
            img.src = fallbackSrc;
            return;
        }
        
        // AVIF降级到WebP
        if (img.src.includes('.avif')) {
            const fallbackSrc = img.src.replace('.avif', '.webp');
            img.src = fallbackSrc;
            return;
        }
        
        // 最终降级到占位符
        img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="100%" height="100%" fill="%23ddd"/><text x="50%" y="50%" text-anchor="middle" dy=".3em">图片加载失败</text></svg>';
    }

    setupImageErrorHandling() {
        // 全局图片错误处理
        document.addEventListener('error', (e) => {
            if (e.target.tagName === 'IMG') {
                this.handleImageError(e.target);
            }
        }, true);
    }

    preloadCriticalImages() {
        // 预加载关键图片
        const criticalImages = [
            'assets/images/logo.avif',
            'assets/images/logo.webp', 
            'assets/images/banner.avif',
            'assets/images/banner.webp'
        ];

        criticalImages.forEach(src => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = src;
            document.head.appendChild(link);
        });
    }

    // 动态添加图片时调用
    observeNewImages() {
        if (this.observer) {
            document.querySelectorAll('img[data-src]:not(.observed)').forEach(img => {
                img.classList.add('observed');
                this.observer.observe(img);
            });
        }
    }
}

// 全局初始化
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        window.imageOptimizer = new ImageOptimizer();
    });
}

export default ImageOptimizer;
