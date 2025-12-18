
// ================================
// DYNAMIC REVIEWS FROM GOOGLE SHEETS
// ================================

const ReviewsManager = {
    // URL вашого Google Apps Script (замініть після розгортання)
    API_URL: 'https://script.google.com/macros/s/AKfycbxlq_y41ElyUT3Le0nDYuKtsJjHge9uVwNzO__rHfOzsXlfKXIBDoQYhlj_-g31XBUn/exec',
    
    // Зберігаємо статичні відгуки при першому завантаженні
    staticReviewsHTML: null,
    
    // Створення HTML зірок на основі рейтингу
    createStars(rating) {
        const stars = [];
        for (let i = 0; i < 5; i++) {
            stars.push(i < rating ? '★' : '☆');
        }
        return stars.join('');
    },
    
    // Створення HTML картки відгуку
    createTestimonialCard(review) {
        return `
            <article class="testimonial-card">
                <header class="testimonial-header">
                    <div class="testimonial-avatar">
                        <img src="${review.photo || 'img/user1.jpg'}" 
                             alt="Фото ${review.name}"
                             onerror="this.src='img/user1.jpg'">
                    </div>
                    <div class="testimonial-info">
                        <h4>${review.name}</h4>
                        <div class="stars">${this.createStars(review.rating)}</div>
                    </div>
                </header>
                <p class="testimonial-text">"${review.review}"</p>
            </article>
        `;
    },
    
    // Завантаження динамічних відгуків
    async loadDynamicReviews() {
        try {
            console.log('Завантаження динамічних відгуків...');
            
            const testimonialsTrack = document.getElementById('testimonialsTrack');
            
            if (!testimonialsTrack) {
                console.error('Елемент testimonialsTrack не знайдено');
                return;
            }
            
            // ВАЖЛИВО: Зберігаємо статичні відгуки тільки один раз при першому запуску
            if (!this.staticReviewsHTML) {
                this.staticReviewsHTML = testimonialsTrack.innerHTML;
                console.log('📌 Статичні відгуки збережено');
            }
            
            const response = await fetch(this.API_URL);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                console.error('Помилка з API:', data.error);
                // Повертаємо тільки статичні відгуки
                testimonialsTrack.innerHTML = this.staticReviewsHTML + this.staticReviewsHTML;
                this.reinitializeTestimonials();
                return;
            }
            
            const reviews = data.reviews || [];
            
            if (reviews.length === 0) {
                console.log('⚠️ Немає затверджених відгуків в таблиці. Показуємо тільки статичні.');
                // Дублюємо статичні відгуки для безшовної прокрутки
                testimonialsTrack.innerHTML = this.staticReviewsHTML + this.staticReviewsHTML;
                this.reinitializeTestimonials();
                return;
            }
            
            // Створюємо HTML для динамічних відгуків
            let dynamicReviewsHTML = '';
            reviews.forEach(review => {
                dynamicReviewsHTML += this.createTestimonialCard(review);
            });
            
            // Комбінуємо: статичні + динамічні + дублюємо все для безшовної прокрутки
            testimonialsTrack.innerHTML = 
                this.staticReviewsHTML + 
                dynamicReviewsHTML + 
                this.staticReviewsHTML + 
                dynamicReviewsHTML;
            
            // Повторно ініціалізуємо обробники подій
            this.reinitializeTestimonials();
            
            console.log(`✅ Відображено: ${this.countStaticReviews()} статичних + ${reviews.length} динамічних відгуків`);
            
        } catch (error) {
            console.error('❌ Помилка завантаження відгуків:', error);
            // При помилці завжди показуємо статичні відгуки
            if (this.staticReviewsHTML) {
                const testimonialsTrack = document.getElementById('testimonialsTrack');
                if (testimonialsTrack) {
                    testimonialsTrack.innerHTML = this.staticReviewsHTML + this.staticReviewsHTML;
                    this.reinitializeTestimonials();
                }
            }
            console.log('📌 Відображаються тільки статичні відгуки');
        }
    },
    
    // Підрахунок кількості статичних відгуків
    countStaticReviews() {
        if (!this.staticReviewsHTML) return 0;
        const matches = this.staticReviewsHTML.match(/<article class="testimonial-card">/g);
        return matches ? matches.length : 0;
    },
    
    // Повторна ініціалізація взаємодії з відгуками
    reinitializeTestimonials() {
        const track = document.querySelector('.testimonials-track');
        const cards = document.querySelectorAll('.testimonials-track .testimonial-card');
        
        if (!track || !cards.length) return;
        
        let isPaused = false;
        
        const togglePause = () => {
            isPaused = !isPaused;
            track.style.animationPlayState = isPaused ? 'paused' : 'running';
            track.classList.toggle('paused', isPaused);
        };
        
        cards.forEach(card => {
            // Клік для мобільних
            card.addEventListener('click', (e) => {
                e.preventDefault();
                togglePause();
            });
            
            // Hover для десктопу
            card.addEventListener('mouseenter', () => {
                track.style.animationPlayState = 'paused';
                track.classList.add('paused');
            });
            
            card.addEventListener('mouseleave', () => {
                if (!isPaused) {
                    track.style.animationPlayState = 'running';
                    track.classList.remove('paused');
                }
            });
        });
    },
    
    // Ініціалізація
    init() {
        // Перевіряємо чи налаштовано API URL
        if (this.API_URL === 'https://script.google.com/macros/s/AKfycbxlq_y41ElyUT3Le0nDYuKtsJjHge9uVwNzO__rHfOzsXlfKXIBDoQYhlj_-g31XBUn/exec') {
            console.warn('⚠️ API URL не налаштовано. Використовуються тільки статичні відгуки.');
            console.log('💡 Для додавання динамічних відгуків:');
            console.log('   1. Налаштуйте Google Sheets');
            console.log('   2. Розгорніть Apps Script');
            console.log('   3. Вставте URL в API_URL');
            return;
        }
        
        // Завантажуємо відгуки після повного завантаження сторінки
        window.addEventListener('load', () => {
            setTimeout(() => this.loadDynamicReviews(), 1000);
        });
        
        // Оновлюємо відгуки кожні 10 хвилин
        setInterval(() => this.loadDynamicReviews(), 10 * 60 * 1000);
        
        console.log('🚀 ReviewsManager ініціалізовано');
    }
};