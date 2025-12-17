const App = {
    // КОНФІГУРАЦІЯ ДЛЯ ВІДГУКІВ
    config: {
        // ЗАМІНІТЬ НА ВАШ URL ПІСЛЯ РОЗГОРТАННЯ GOOGLE APPS SCRIPT
        reviewsApiUrl: 'https://script.google.com/macros/s/AKfycbxlq_y41ElyUT3Le0nDYuKtsJjHge9uVwNzO__rHfOzsXlfKXIBDoQYhlj_-g31XBUn/exec', 
        updateInterval: 5 * 60 * 1000 // Оновлення кожні 5 хв
    },

    state: {
        theme: 'light',
        currentGalleryPage: 0,
        imagesPerPage: 8,
        currentLightboxIndex: 0,
        isMenuOpen: false,
        isTestimonialsPaused: false
    },

    constants: {
        GALLERY_IMAGES_COUNT: 27,
        MOBILE_BREAKPOINT: 768,
        TABLET_BREAKPOINT: 1024
    },

    init() {
        this.loadTheme();
        this.initProgressBar();
        this.initThemeToggle();
        this.initMobileMenu();
        this.initGallery();
        this.initLightbox();
        this.initScrollTop();
        this.initAnimations();
        this.initKeyboardNav();
        
        // Ініціалізація відгуків (статичні + спроба завантажити динамічні)
        this.loadCombinedReviews();
        
        this.hideLoading();
    },

    // ================================
    // ЛОГІКА ВІДГУКІВ
    // ================================
    
    async loadCombinedReviews() {
        const track = document.getElementById('testimonialsTrack');
        if (!track) return;

        // 1. Спочатку активуємо паузу для вже існуючих статичних відгуків
        this.attachTestimonialsEvents();

        try {
            const response = await fetch(this.config.reviewsApiUrl);
            const data = await response.json();
            
            if (data.error || !data.reviews || data.reviews.length === 0) {
                console.log('Динамічні відгуки не знайдені, залишаємо статичні');
                this.duplicateTrackForAnimation(track);
                return;
            }

            // 2. Зберігаємо початковий HTML (статичні відгуки)
            const staticHTML = track.innerHTML;
            
            // 3. Генеруємо HTML для нових динамічних відгуків
            const dynamicHTML = data.reviews.map(review => this.createReviewCard(review)).join('');

            // 4. Комбінуємо та дублюємо для безперервного циклу анімації
            const combinedContent = staticHTML + dynamicHTML;
            track.innerHTML = combinedContent + combinedContent;

            // 5. Переприв'язуємо події до нових елементів
            this.attachTestimonialsEvents();
            console.log(`Успішно додано ${data.reviews.length} динамічних відгуків`);

        } catch (error) {
            console.error('Помилка завантаження відгуків:', error);
            // У разі помилки просто дублюємо статичні, щоб анімація не переривалася
            this.duplicateTrackForAnimation(track);
        }
    },

    createReviewCard(review) {
        const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
        return `
            <article class="testimonial-card">
                <header class="testimonial-header">
                    <div class="testimonial-avatar">
                        <img src="${review.photo}" 
                             alt="Фото ${review.name}"
                             onerror="this.src='img/user1.jpg'">
                    </div>
                    <div class="testimonial-info">
                        <h4>${review.name}</h4>
                        <div class="stars">${stars}</div>
                    </div>
                </header>
                <p class="testimonial-text">"${review.review}"</p>
            </article>
        `;
    },

    duplicateTrackForAnimation(track) {
        if (track.children.length > 0) {
            track.innerHTML += track.innerHTML;
            this.attachTestimonialsEvents();
        }
    },

    attachTestimonialsEvents() {
        const track = document.querySelector('.testimonials-track');
        const cards = document.querySelectorAll('.testimonial-card');

        cards.forEach(card => {
            // Клік для мобільних (пауза)
            card.onclick = () => {
                this.state.isTestimonialsPaused = !this.state.isTestimonialsPaused;
                track.style.animationPlayState = this.state.isTestimonialsPaused ? 'paused' : 'running';
                track.classList.toggle('paused', this.state.isTestimonialsPaused);
            };

            // Наведення для ПК
            card.onmouseenter = () => {
                if (!this.state.isTestimonialsPaused) track.style.animationPlayState = 'paused';
            };

            card.onmouseleave = () => {
                if (!this.state.isTestimonialsPaused) track.style.animationPlayState = 'running';
            };
        });
    },

    // ТЕМА

    loadTheme() {
        try {
            this.state.theme = 'light'; // За замовчуванням світла тема
            document.documentElement.setAttribute('data-theme', this.state.theme);
            this.updateLogos(this.state.theme);
        } catch (e) {
            console.warn('Помилка завантаження теми:', e);
        }
    },

    updateLogos(theme) {
        const logoImg = document.getElementById('logoImg');
        const logoFallback = document.getElementById('logoFallback');
        
        if (!logoImg || !logoFallback) return;

        const logoPath = theme === 'dark' ? 'img/logo/dark.png' : 'img/logo/light.png';
        logoImg.src = logoPath;

        logoImg.onerror = () => {
            logoImg.style.display = 'none';
            logoFallback.style.display = 'flex';
        };

        logoImg.onload = () => {
            logoImg.style.display = 'block';
            logoFallback.style.display = 'none';
        };
    },

    initThemeToggle() {
        const toggle = document.getElementById('themeToggle');
        if (!toggle) return;

        toggle.addEventListener('click', () => {
            this.state.theme = this.state.theme === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', this.state.theme);
            this.updateLogos(this.state.theme);
        });
    },

    // ================================
    // ПРОГРЕС БАР
    // ================================
    initProgressBar() {
        const updateProgress = () => {
            const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (winScroll / height) * 100;
            const bar = document.getElementById('progressBar');
            if (bar) bar.style.width = scrolled + '%';
        };

        window.addEventListener('scroll', updateProgress, { passive: true });
    },

    // ================================
    // МОБІЛЬНЕ МЕНЮ
    // ================================
    initMobileMenu() {
        const menuToggle = document.getElementById('menuToggle');
        const mobileMenu = document.getElementById('mobileMenu');
        const menuOverlay = document.getElementById('menuOverlay');
        const closeBtn = document.getElementById('closeMenuBtn');

        if (!menuToggle || !mobileMenu || !menuOverlay) return;

        const toggleMenu = () => {
            this.state.isMenuOpen = !this.state.isMenuOpen;
            mobileMenu.classList.toggle('active', this.state.isMenuOpen);
            menuToggle.classList.toggle('active', this.state.isMenuOpen);
            menuOverlay.classList.toggle('active', this.state.isMenuOpen);
            menuToggle.setAttribute('aria-expanded', this.state.isMenuOpen);
            menuOverlay.setAttribute('aria-hidden', !this.state.isMenuOpen);
            document.body.style.overflow = this.state.isMenuOpen ? 'hidden' : '';
        };

        const closeMenu = () => {
            if (!this.state.isMenuOpen) return;
            this.state.isMenuOpen = false;
            mobileMenu.classList.remove('active');
            menuToggle.classList.remove('active');
            menuOverlay.classList.remove('active');
            menuToggle.setAttribute('aria-expanded', 'false');
            menuOverlay.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        };

        menuToggle.addEventListener('click', toggleMenu);
        menuOverlay.addEventListener('click', closeMenu);
        if (closeBtn) closeBtn.addEventListener('click', closeMenu);

        // Закриття меню при кліку на посилання
        document.querySelectorAll('.menu-links a').forEach(link => {
            link.addEventListener('click', closeMenu);
        });
    },


    // ================================
    // ГАЛЕРЕЯ (GRID + ПАГІНАЦІЯ)
    // ================================
    initGallery() {
        this.updateImagesPerPage();
        this.renderGallery();

        // Перемальовування при зміні розміру вікна
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                const newPerPage = this.getImagesPerPage();
                if (newPerPage !== this.state.imagesPerPage) {
                    this.state.imagesPerPage = newPerPage;
                    this.state.currentGalleryPage = 0;
                    this.renderGallery();
                }
            }, 250);
        });

        // Кнопки навігації
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (this.state.currentGalleryPage > 0) {
                    this.state.currentGalleryPage--;
                    this.renderGallery();
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const totalPages = this.getTotalPages();
                if (this.state.currentGalleryPage < totalPages - 1) {
                    this.state.currentGalleryPage++;
                    this.renderGallery();
                }
            });
        }
    },

    getImagesPerPage() {
        const w = window.innerWidth;
        if (w < this.constants.MOBILE_BREAKPOINT) return 2;
        if (w < this.constants.TABLET_BREAKPOINT) return 6;
        return 8;
    },

    updateImagesPerPage() {
        this.state.imagesPerPage = this.getImagesPerPage();
    },

    getTotalPages() {
        return Math.ceil(this.constants.GALLERY_IMAGES_COUNT / this.state.imagesPerPage);
    },

    generateGalleryImages() {
        const images = [];
        for (let i = 1; i <= this.constants.GALLERY_IMAGES_COUNT; i++) {
            images.push(`img/img${i}.jpg`);
        }
        return images;
    },

    renderGallery() {
        const grid = document.getElementById('galleryGrid');
        if (!grid) return;

        const images = this.generateGalleryImages();
        const start = this.state.currentGalleryPage * this.state.imagesPerPage;
        const end = start + this.state.imagesPerPage;
        const imagesToShow = images.slice(start, end);

        grid.innerHTML = imagesToShow.map((img, idx) => {
            const globalIdx = start + idx;
            return `
                <div class="gallery-item" role="listitem" data-index="${globalIdx}">
                    <img src="${img}" 
                         alt="Фото учнів SIRKO CLUB ${globalIdx + 1}" 
                         loading="lazy"
                         onerror="this.src='https://images.unsplash.com/photo-${1548199973030 + globalIdx * 100000}-03cce0bbc87b?w=300&h=300&fit=crop&q=80'">
                </div>
            `;
        }).join('');

        // Додавання обробників кліків
        grid.querySelectorAll('.gallery-item').forEach(item => {
            item.addEventListener('click', () => {
                const idx = Number(item.getAttribute('data-index'));
                this.openLightbox(idx);
            });
        });

        this.updateGalleryButtons();
    },

    updateGalleryButtons() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const totalPages = this.getTotalPages();

        if (prevBtn) prevBtn.disabled = this.state.currentGalleryPage === 0;
        if (nextBtn) nextBtn.disabled = this.state.currentGalleryPage >= totalPages - 1;
    },

    // ================================
    // LIGHTBOX (МОДАЛЬНЕ ВІКНО)
    // ================================
    initLightbox() {
        const lightbox = document.getElementById('lightbox');
        const closeBtn = lightbox?.querySelector('.lightbox-close');
        const prevBtn = lightbox?.querySelector('.lightbox-prev');
        const nextBtn = lightbox?.querySelector('.lightbox-next');

        if (!lightbox) return;

        if (closeBtn) closeBtn.addEventListener('click', () => this.closeLightbox());
        if (prevBtn) prevBtn.addEventListener('click', () => this.lightboxPrev());
        if (nextBtn) nextBtn.addEventListener('click', () => this.lightboxNext());

        // Закриття при кліку на фон
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) this.closeLightbox();
        });

        // Swipe-керування для мобільних
        this.initLightboxSwipe(lightbox);
    },

    openLightbox(index) {
        const lightbox = document.getElementById('lightbox');
        const img = document.getElementById('lightboxImg');
        if (!lightbox || !img) return;

        this.state.currentLightboxIndex = index;
        const images = this.generateGalleryImages();
        
        img.src = images[index];
        img.alt = `Фото ${index + 1}`;
        
        lightbox.classList.add('active');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        // Скидання анімації
        void img.offsetWidth;
        img.style.animation = 'fadeIn 0.3s ease';
    },

    closeLightbox() {
        const lightbox = document.getElementById('lightbox');
        if (!lightbox) return;

        lightbox.classList.remove('active');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    },

    lightboxPrev() {
        this.state.currentLightboxIndex--;
        if (this.state.currentLightboxIndex < 0) {
            this.state.currentLightboxIndex = this.constants.GALLERY_IMAGES_COUNT - 1;
        }
        this.updateLightboxImage();
    },

    lightboxNext() {
        this.state.currentLightboxIndex++;
        if (this.state.currentLightboxIndex >= this.constants.GALLERY_IMAGES_COUNT) {
            this.state.currentLightboxIndex = 0;
        }
        this.updateLightboxImage();
    },

    updateLightboxImage() {
        const img = document.getElementById('lightboxImg');
        if (!img) return;

        const images = this.generateGalleryImages();
        img.src = images[this.state.currentLightboxIndex];
        img.alt = `Фото ${this.state.currentLightboxIndex + 1}`;

        // Скидання анімації для плавності
        void img.offsetWidth;
        img.style.animation = 'none';
        setTimeout(() => {
            img.style.animation = 'fadeIn 0.3s ease';
        }, 10);
    },

    initLightboxSwipe(lightbox) {
        let startX = 0;
        let endX = 0;

        lightbox.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        }, { passive: true });

        lightbox.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].clientX;
            const diff = startX - endX;

            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    this.lightboxNext();
                } else {
                    this.lightboxPrev();
                }
            }
        }, { passive: true });
    },

    // ================================
    // КЛАВІАТУРНА НАВІГАЦІЯ
    // ================================
    initKeyboardNav() {
        document.addEventListener('keydown', (e) => {
            // Закриття меню на Escape
            if (e.key === 'Escape' && this.state.isMenuOpen) {
                const closeBtn = document.getElementById('closeMenuBtn');
                if (closeBtn) closeBtn.click();
            }

            // Закриття lightbox на Escape
            const lightbox = document.getElementById('lightbox');
            if (e.key === 'Escape' && lightbox?.classList.contains('active')) {
                this.closeLightbox();
            }

            // Навігація в lightbox
            if (lightbox?.classList.contains('active')) {
                if (e.key === 'ArrowLeft') this.lightboxPrev();
                if (e.key === 'ArrowRight') this.lightboxNext();
            }

            // Пауза відгуків
            if (e.key === 'ArrowLeft' && !lightbox?.classList.contains('active')) {
                const track = document.querySelector('.testimonials-track');
                if (track) {
                    this.state.isTestimonialsPaused = !this.state.isTestimonialsPaused;
                    track.style.animationPlayState = this.state.isTestimonialsPaused ? 'paused' : 'running';
                }
            }
        });
    },

    // ================================
    // СКРОЛ ВГОРУ
    // ================================
    initScrollTop() {
        const btn = document.getElementById('scrollTop');
        if (!btn) return;

        const checkScroll = () => {
            if (window.pageYOffset > 300) {
                btn.classList.add('visible');
            } else {
                btn.classList.remove('visible');
            }
        };

        window.addEventListener('scroll', checkScroll, { passive: true });

        btn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    },

    // ================================
    // АНІМАЦІЇ ПРИ СКРОЛІ
    // ================================
    initAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        document.querySelectorAll('.section, .service-card, .testimonial-card, .info-item').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    },

    // ================================
    // ПРИХОВАНИЙ ЕКРАН ЗАВАНТАЖЕННЯ
    // ================================
    hideLoading() {
        window.addEventListener('load', () => {
            const loading = document.getElementById('loading');
            if (loading) {
                setTimeout(() => {
                    loading.classList.add('hidden');
                }, 500);
            }
        });
    }
};

// Запуск додатку
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Обробка помилок
window.addEventListener('error', (e) => {
    console.error('Помилка:', e.error);
});

// Моніторинг продуктивності
if ('PerformanceObserver' in window) {
    const perfObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
            if (entry.loadTime > 3000) {
                console.warn('Повільне завантаження:', entry.name, entry.loadTime);
            }
        }
    });
    perfObserver.observe({ entryTypes: ['navigation', 'resource'] });
}
document.addEventListener('DOMContentLoaded', () => App.init());