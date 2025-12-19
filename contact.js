// прогрес при скролі
window.addEventListener('scroll', () => {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    document.getElementById('progressBar').style.width = scrolled + '%';
});


// світла\темна тема
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;

// Завантаження збереженої теми з localStorage
const savedTheme = localStorage.getItem('theme') || 'light';
html.setAttribute('data-theme', savedTheme);

// Перемикання теми при кліку
themeToggle.addEventListener('click', () => {
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
});

// мобільне меню
const menuToggle = document.getElementById('menuToggle');
const mobileMenu = document.getElementById('mobileMenu');
const menuOverlay = document.getElementById('menuOverlay');

// Функція для відкриття/закриття меню
function toggleMenu() {
    const isActive = mobileMenu.classList.toggle('active');
    menuToggle.classList.toggle('active');
    menuOverlay.classList.toggle('active');
    menuToggle.setAttribute('aria-expanded', isActive);
    menuOverlay.setAttribute('aria-hidden', !isActive);

    // Блокування скролу коли меню відкрите
    document.body.style.overflow = isActive ? 'hidden' : '';
}

// Події для відкриття/закриття меню
menuToggle.addEventListener('click', toggleMenu);
menuOverlay.addEventListener('click', toggleMenu);

// Закриття меню при кліку на посилання
const menuLinks = document.querySelectorAll('.menu-links a');
menuLinks.forEach(link => {
    link.addEventListener('click', () => {
        if (mobileMenu.classList.contains('active')) {
            toggleMenu();
        }
    });
});


// "прокрутити вгору"
const scrollTopBtn = document.getElementById('scrollTop');

window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
        scrollTopBtn.classList.add('visible');
    } else {
        scrollTopBtn.classList.remove('visible');
    }
});

scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// Форма зворотнього зв'язку
const openContactFormBtn = document.getElementById('openContactFormBtn');
const contactModal = document.getElementById('contactModal');
const closeContactModal = document.getElementById('closeContactModal');

// Перевірка наявності елементів перед додаванням слухачів
if (openContactFormBtn && contactModal && closeContactModal) {
    // Відкрити модальне вікно форми контакту
    openContactFormBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Відкриття форми контакту');
        contactModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    // Закрити модальне вікно форми контакту
    closeContactModal.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        contactModal.classList.remove('active');
        document.body.style.overflow = '';
    });

    // Закрити при кліку поза модальним вікном
    contactModal.addEventListener('click', (e) => {
        if (e.target === contactModal) {
            contactModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

// форма відгуку
const openReviewFormBtn = document.getElementById('openReviewFormBtn');
const reviewModal = document.getElementById('reviewModal');
const closeReviewModal = document.getElementById('closeReviewModal');

// Перевірка наявності елементів перед додаванням слухачів
if (openReviewFormBtn && reviewModal && closeReviewModal) {
    // Відкрити модальне вікно форми відгуку
    openReviewFormBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Відкриття форми відгуку');
        reviewModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    // Закрити модальне вікно форми відгуку
    closeReviewModal.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        reviewModal.classList.remove('active');
        document.body.style.overflow = '';
    });

    // Закрити при кліку поза модальним вікном
    reviewModal.addEventListener('click', (e) => {
        if (e.target === reviewModal) {
            reviewModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

// Обробка форми зворотнього зв'язку
const contactForm = document.getElementById('contactForm');
const successMessage = document.getElementById('successMessage');

if (contactForm && successMessage) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Отримання даних з форми
        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            subject: document.getElementById('subject').value,
            message: document.getElementById('message').value
        };

        // Валідація форми
        if (!formData.name || !formData.email || !formData.message) {
            alert('Будь ласка, заповніть всі обов\'язкові поля (*)');
            return;
        }

        // Перевірка email
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(formData.email)) {
            alert('Будь ласка, введіть коректну email адресу');
            return;
        }

        // Деактивація кнопки відправки
        const submitBtn = contactForm.querySelector('.btn-submit');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Відправляється...';

        try {
            // Симуляція відправки форми 
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Показати повідомлення про успіх
            successMessage.style.display = 'block';

            // Очистити форму
            contactForm.reset();

            // Сховати повідомлення через 5 секунд
            setTimeout(() => {
                successMessage.style.display = 'none';
            }, 5000);

            // Логування даних форми (для розробки)
            console.log('Форму відправлено:', formData);


        } catch (error) {
            console.error('Помилка при відправці форми:', error);
            alert('Виникла помилка при відправці форми. Спробуйте ще раз.');
        } finally {
            // Повторна активація кнопки
            submitBtn.disabled = false;
            submitBtn.textContent = 'Відправити повідомлення';
        }
    });
}

// Обробка відгуку (з відправкою в Google Sheets)
const reviewForm = document.getElementById('reviewForm');
const reviewSuccessMessage = document.getElementById('reviewSuccessMessage');

// URL Google Apps Script 
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyrGX6oagWfYIX0yBgjsiUEWExOKE1xXm1zu3pqAXcf0HqhIQsBnXSRseYWfYsdDHa-/exec';

if (reviewForm && reviewSuccessMessage) {
    reviewForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Отримання даних з форми
        const reviewData = {
            name: document.getElementById('reviewName').value,
            text: document.getElementById('reviewText').value,
            rating: document.getElementById('rating').value
        };

        // Валідація
        if (!reviewData.name || !reviewData.text) {
            alert('Будь ласка, заповніть всі поля');
            return;
        }

        // Деактивація кнопки
        const submitBtn = reviewForm.querySelector('.btn-submit');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Відправляється...';

        try {
            // Відправка даних в Google Sheets через Apps Script
            const response = await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors', // Важливо для Google Apps Script
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(reviewData)
            });
            
            // Показати повідомлення про успіх
            reviewSuccessMessage.innerHTML = '✓ Дякуємо за ваш відгук! Він буде опублікований після розгляду адміністратором.';
            reviewSuccessMessage.style.display = 'block';

            // Очистити форму
            reviewForm.reset();
            
            // Скинути зірки
            document.querySelectorAll('.star').forEach(star => {
                star.classList.remove('active');
            });
            document.getElementById('rating').value = '5';
            setActiveStars(5);

            // Сховати повідомлення через 8 секунд
            setTimeout(() => {
                reviewSuccessMessage.style.display = 'none';
            }, 8000);

            console.log('Відгук відправлено в Google Sheets:', reviewData);

        } catch (error) {
            console.error('Помилка при відправці відгуку:', error);
            alert('Виникла помилка при відправці відгуку. Перевірте підключення до інтернету та спробуйте ще раз.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Відправити відгук';
        }
    });
}

// Рейтинг зірок
const stars = document.querySelectorAll('.star');
const ratingInput = document.getElementById('rating');

if (stars.length > 0 && ratingInput) {
    stars.forEach(star => {
        // Підсвічування зірок при наведенні
        star.addEventListener('mouseenter', () => {
            const rating = star.getAttribute('data-rating');
            highlightStars(rating);
        });

        // Встановлення рейтингу при кліку
        star.addEventListener('click', () => {
            const rating = star.getAttribute('data-rating');
            ratingInput.value = rating;
            setActiveStars(rating);
        });
    });

    // Скидання підсвічування при виході курсору
    const ratingStarsContainer = document.querySelector('.rating-stars');
    if (ratingStarsContainer) {
        ratingStarsContainer.addEventListener('mouseleave', () => {
            const currentRating = ratingInput.value;
            setActiveStars(currentRating);
        });
    }

    // Функція для підсвічування зірок
    function highlightStars(rating) {
        stars.forEach(star => {
            const starRating = star.getAttribute('data-rating');
            if (starRating <= rating) {
                star.style.color = '#FFD700';
            } else {
                star.style.color = '#ddd';
            }
        });
    }

    // Функція для встановлення активних зірок
    function setActiveStars(rating) {
        stars.forEach(star => {
            const starRating = star.getAttribute('data-rating');
            if (starRating <= rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }

    // Встановити всі зірки активними за замовчуванням (5 зірок)
    setActiveStars(5);
}

// Форматування номеру телефону
const phoneInput = document.getElementById('phone');
if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');

        // Додати код України якщо не вказано
        if (value.length > 0 && !value.startsWith('380')) {
            if (value.startsWith('0')) {
                value = '380' + value.substring(1);
            }
        }

        // Формат: +380 XX XXX XX XX
        if (value.length > 0) {
            let formatted = '+380';
            if (value.length > 3) {
                formatted += ' ' + value.substring(3, 5);
            }
            if (value.length > 5) {
                formatted += ' ' + value.substring(5, 8);
            }
            if (value.length > 8) {
                formatted += ' ' + value.substring(8, 10);
            }
            if (value.length > 10) {
                formatted += ' ' + value.substring(10, 12);
            }
            e.target.value = formatted;
        }
    });
}

// Анімації при скролі
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

// Спостереження за елементами для анімації
document.querySelectorAll('.contact-card, .social-links-section, .action-buttons, .map-section').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// Клавіатурна навігація
document.addEventListener('keydown', (e) => {
    // Закрити модальні вікна клавішею Escape
    if (e.key === 'Escape') {
        if (mobileMenu.classList.contains('active')) {
            toggleMenu();
        }
        if (contactModal && contactModal.classList.contains('active')) {
            contactModal.classList.remove('active');
            document.body.style.overflow = '';
        }
        if (reviewModal && reviewModal.classList.contains('active')) {
            reviewModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // Прокрутка вгору клавішею Home+Ctrl
    if (e.key === 'Home' && e.ctrlKey) {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
});

// Логування завантаження сторінки
console.log('Сторінка контактів завантажена успішно');
console.log('Поточна тема:', localStorage.getItem('theme') || 'light');
console.log('Версія: 2.1');

// Обробка помилок
window.addEventListener('error', (e) => {
    console.error('Виникла помилка:', e.error);
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