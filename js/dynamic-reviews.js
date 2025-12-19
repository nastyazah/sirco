// ================================
// DYNAMIC REVIEWS FROM GOOGLE SHEETS - ВИПРАВЛЕНА ВЕРСІЯ
// ================================

const ReviewsManager = {
    // URL вашого Google Apps Script (замініть після розгортання)
    // ВАЖЛИВО: Винесіть в змінні оточення для production!
    API_URL: window.REVIEWS_API_URL || 'https://script.google.com/macros/s/AKfycbxlq_y41ElyUT3Le0nDYuKtsJjHge9uVwNzO__rHfOzsXlfKXIBDoQYhlj_-g31XBUn/exec',
    
    // Зберігаємо статичні відгуки при першому завантаженні
    staticReviewsHTML: null,
    
    // Кеш для уникнення дублювання запитів
    cache: {
        reviews: null,
        timestamp: null,
        ttl: 10 * 60 * 1000 // 10 хвилин
    },
    
    // ================================
    // SANITIZATION (ЗАХИСТ ВІД XSS)
    // ================================
    escapeHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },
    
    sanitizeReview(review) {
        return {
            name: this.escapeHTML(review.name || 'Анонім'),
            rating: Math.min(5, Math.max(1, parseInt(review.rating) || 5)),
            review: this.escapeHTML(review.review || ''),
            photo: this.sanitizePhotoURL(review.photo)
        };
    },
    
    sanitizePhotoURL(url) {
        if (!url) return 'img/user1.jpg';
        
        try {
            const parsed = new URL(url);
            // Дозволяємо тільки HTTPS та з певних доменів
            if (parsed.protocol === 'https:' && 
                (parsed.hostname.includes('unsplash.com') || 
                 parsed.hostname.includes('cloudinary.com') ||
                 parsed.hostname.includes('imgur.com'))) {
                return url;
            }
        } catch (e) {
            // Невалідний URL
        }
        
        return 'img/user1.jpg';
    },
    
    // ================================
    // СТВОРЕННЯ HTML
    // ================================
    createStars(rating) {
        const stars = [];
        for (let i = 0; i < 5; i++) {
            stars.push(i < rating ? '★' : '☆');
        }
        return stars.join('');
    },
    
    createTestimonialCard(review) {
        const sanitized = this.sanitizeReview(review);
        
        return `
            <article class="testimonial-card">
                <header class="testimonial-header">
                    <div class="testimonial-avatar">
                        <img src="${sanitized.photo}" 
                             alt="Фото ${sanitized.name}"
                             onerror="this.src='img/user1.jpg'"
                             loading="lazy">
                    </div>
                    <div class="testimonial-info">
                        <h4>${sanitized.name}</h4>
                        <div class="stars">${this.createStars(sanitized.rating)}</div>
                    </div>
                </header>
                <p class="testimonial-text">"${sanitized.review}"</p>
            </article>
        `;
    },
    
    // ================================
    // ЗАВАНТАЖЕННЯ ДИНАМІЧНИХ ВІДГУКІВ
    // ================================
    async loadDynamicReviews() {
        try {
            console.log('🔄 Завантаження динамічних відгуків...');
            
            const testimonialsTrack = document.getElementById('testimonialsTrack');
            
            if (!testimonialsTrack) {
                console.error('❌ Елемент testimonialsTrack не знайдено');
                return;
            }
            
            // Зберігаємо статичні відгуки тільки один раз
            if (!this.staticReviewsHTML) {
                this.staticReviewsHTML = testimonialsTrack.innerHTML;
                console.log('📌 Статичні відгуки збережено');
            }
            
            // Перевіряємо кеш
            if (this.cache.reviews && this.cache.timestamp && 
                (Date.now() - this.cache.timestamp < this.cache.ttl)) {
                console.log('📦 Використання кешованих відгуків');
                this.renderReviews(this.cache.reviews);
                return;
            }
            
            // Завантажуємо з API
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 сек timeout
            
            const response = await fetch(this.API_URL, {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                console.error('❌ Помилка з API:', data.error);
                this.renderReviews([]);
                return;
            }
            
            const reviews = data.reviews || [];
            
            // Кешуємо результат
            this.cache.reviews = reviews;
            this.cache.timestamp = Date.now();
            
            this.renderReviews(reviews);
            
        } catch (error) {
            if (error.name === 'AbortError') {
                console.error('⏱️ Timeout: API не відповідає');
            } else {
                console.error('❌ Помилка завантаження відгуків:', error);
            }
            
            // При помилці показуємо тільки статичні
            this.renderReviews([]);
        }
    },
    
    // ================================
    // РЕНДЕРИНГ ВІДГУКІВ (ВИПРАВЛЕНО)
    // ================================
    renderReviews(dynamicReviews) {
        const testimonialsTrack = document.getElementById('testimonialsTrack');
        if (!testimonialsTrack) return;
        
        let dynamicReviewsHTML = '';
        
        if (dynamicReviews.length > 0) {
            dynamicReviews.forEach(review => {
                dynamicReviewsHTML += this.createTestimonialCard(review);
            });
            console.log(`✅ Додано ${dynamicReviews.length} динамічних відгуків`);
        } else {
            console.log('⚠️ Немає затверджених відгуків. Показуємо тільки статичні.');
        }
        
        // ВИПРАВЛЕНО: Комбінуємо статичні + динамічні, потім дублюємо ВСЕ для безшовної прокрутки
        const combinedHTML = this.staticReviewsHTML + dynamicReviewsHTML;
        testimonialsTrack.innerHTML = combinedHTML + combinedHTML;
        
        // КРИТИЧНО: Видаляємо дублікати
        this.removeDuplicates(testimonialsTrack);
        
        // Повторно ініціалізуємо обробники подій
        this.reinitializeTestimonials();
        
        const staticCount = this.countStaticReviews();
        const dynamicCount = dynamicReviews.length;
        const totalUnique = staticCount + dynamicCount;
        
        console.log(`📊 Відображено: ${staticCount} статичних + ${dynamicCount} динамічних = ${totalUnique} унікальних відгуків (дубльовано для прокрутки)`);
    },
    
    // ================================
    // ВИДАЛЕННЯ ДУБЛІКАТІВ (НОВЕ)
    // ================================
    removeDuplicates(container) {
        const cards = container.querySelectorAll('.testimonial-card');
        const seen = new Map(); // text -> перший елемент
        const toRemove = [];
        
        cards.forEach((card, index) => {
            const text = card.querySelector('.testimonial-text')?.textContent?.trim();
            const name = card.querySelector('.testimonial-info h4')?.textContent?.trim();
            const key = `${name}|${text}`;
            
            // Зберігаємо тільки першу половину (оригінали)
            // Друга половина - це дублікати для безшовної прокрутки
            const isFirstHalf = index < cards.length / 2;
            
            if (isFirstHalf) {
                if (seen.has(key)) {
                    toRemove.push(card);
                } else {
                    seen.set(key, card);
                }
            }
        });
        
        // Видаляємо дублікати з першої половини
        toRemove.forEach(card => card.remove());
        
        // Тепер дублюємо очищену версію для безшовної прокрутки
        const cleanCards = container.querySelectorAll('.testimonial-card');
        const fragment = document.createDocumentFragment();
        
        cleanCards.forEach(card => {
            fragment.appendChild(card.cloneNode(true));
        });
        
        container.appendChild(fragment);
        
        console.log(`🧹 Видалено ${toRemove.length} дублікатів`);
    },
    
    // ================================
    // ПІДРАХУНОК СТАТИЧНИХ ВІДГУКІВ
    // ================================
    countStaticReviews() {
        if (!this.staticReviewsHTML) return 0;
        const matches = this.staticReviewsHTML.match(/<article class="testimonial-card">/g);
        return matches ? matches.length : 0;
    },
    
    // ================================
    // ПОВТОРНА ІНІЦІАЛІЗАЦІЯ ВЗАЄМОДІЇ
    // ================================
    reinitializeTestimonials() {
        const track = document.querySelector('.testimonials-track');
        const cards = track?.querySelectorAll('.testimonial-card');
        
        if (!track || !cards || cards.length === 0) return;
        
        let isPaused = false;
        
        const togglePause = () => {
            isPaused = !isPaused;
            track.style.animationPlayState = isPaused ? 'paused' : 'running';
            track.classList.toggle('paused', isPaused);
        };
        
        cards.forEach(card => {
            // Видаляємо старі слухачі, якщо вони є
            const newCard = card.cloneNode(true);
            card.parentNode.replaceChild(newCard, card);
            
            // Клік для мобільних
            newCard.addEventListener('click', (e) => {
                e.preventDefault();
                togglePause();
            });
            
            // Hover для десктопу
            newCard.addEventListener('mouseenter', () => {
                track.style.animationPlayState = 'paused';
                track.classList.add('paused');
            });
            
            newCard.addEventListener('mouseleave', () => {
                if (!isPaused) {
                    track.style.animationPlayState = 'running';
                    track.classList.remove('paused');
                }
            });
        });
    },
    
    // ================================
    // ІНІЦІАЛІЗАЦІЯ
    // ================================
    init() {
        console.log('🚀 ReviewsManager ініціалізовано');
        
        // Перевіряємо чи налаштовано API URL
        if (this.API_URL.includes('YOUR_SCRIPT_ID_HERE') || 
            this.API_URL === 'https://script.google.com/macros/s/AKfycbxlq_y41ElyUT3Le0nDYuKtsJjHge9uVwNzO__rHfOzsXlfKXIBDoQYhlj_-g31XBUn/exec') {
            console.warn('⚠️ API URL не налаштовано правильно.');
            console.log('💡 Для додавання динамічних відгуків:');
            console.log('   1. Налаштуйте Google Sheets');
            console.log('   2. Розгорніть Apps Script');
            console.log('   3. Вставте URL в змінну window.REVIEWS_API_URL');
            return;
        }
        
        // Завантажуємо відгуки після завантаження сторінки
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => this.loadDynamicReviews(), 1000);
            });
        } else {
            setTimeout(() => this.loadDynamicReviews(), 1000);
        }
        
        // Оновлюємо відгуки кожні 10 хвилин
        setInterval(() => this.loadDynamicReviews(), 10 * 60 * 1000);
        
        // Оновлюємо при поверненні на вкладку
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.cache.timestamp && 
                (Date.now() - this.cache.timestamp > this.cache.ttl)) {
                this.loadDynamicReviews();
            }
        });
    }
};

// Автоматичний запуск
if (typeof window !== 'undefined') {
    ReviewsManager.init();
}