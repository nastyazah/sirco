 document.querySelectorAll('.faq-item').forEach(item => {
      const question = item.querySelector('.faq-question');
      question.addEventListener('click', () => {
        const isOpen = item.classList.contains('active');
        document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
        if (!isOpen) item.classList.add('active');
      });
    });

    /* ---------- тема, меню, скрол ---------- */
    const themeToggle = document.getElementById('themeToggle');
    const html = document.documentElement;
    const logoImg = document.getElementById('logoImg');
    const logoFallback = document.getElementById('logoFallback');
    const savedTheme = localStorage.getItem('theme') || 'light';
    html.setAttribute('data-theme', savedTheme);

    function updateLogos(theme) {
      const logoPath = theme === 'dark' ? 'img/dark.png' : 'img/light.png';
      logoImg.src = logoPath;
      logoImg.onerror = () => { logoImg.style.display='none'; logoFallback.style.display='flex'; };
      logoImg.onload = () => { logoImg.style.display='block'; logoFallback.style.display='none'; };
    }
    updateLogos(savedTheme);

    themeToggle.addEventListener('click', () => {
      const current = html.getAttribute('data-theme');
      const newTheme = current === 'light' ? 'dark' : 'light';
      html.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      updateLogos(newTheme);
    });

    const menuToggle = document.getElementById('menuToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    const closeMenuBtn = document.getElementById('closeMenuBtn');

    function toggleMenu() {
      const isActive = mobileMenu.classList.toggle('active');
      menuToggle.classList.toggle('active');
      menuOverlay.classList.toggle('active');
      menuToggle.setAttribute('aria-expanded', isActive);
      menuOverlay.setAttribute('aria-hidden', !isActive);
      document.body.style.overflow = isActive ? 'hidden' : '';
    }

    function closeMenu() {
      mobileMenu.classList.remove('active');
      menuToggle.classList.remove('active');
      menuOverlay.classList.remove('active');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuOverlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    menuToggle.addEventListener('click', toggleMenu);
    menuOverlay.addEventListener('click', closeMenu);
    closeMenuBtn.addEventListener('click', closeMenu);

    document.querySelectorAll('.menu-links a').forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    const scrollTopBtn = document.getElementById('scrollTop');
    window.addEventListener('scroll', () => {
      scrollTopBtn.classList.toggle('visible', window.pageYOffset > 300);
    });
    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    /* ========= DOG-WALK PAW SEQUENCE ========= */
    const PAW_SVG = `<svg viewBox="0 0 100 100">
      <ellipse cx="50" cy="70" rx="20" ry="15"/>
      <ellipse cx="28" cy="45" rx="10" ry="13" transform="rotate(-15 28 45)"/>
      <ellipse cx="40" cy="35" rx="10" ry="13" transform="rotate(-5 40 35)"/>
      <ellipse cx="60" cy="35" rx="10" ry="13" transform="rotate(5 60 35)"/>
      <ellipse cx="72" cy="45" rx="10" ry="13" transform="rotate(15 72 45)"/>
    </svg>`;

    function rand(min, max) { return Math.random() * (max - min) + min; }

    function createPawSequence() {
      const steps = Math.round(rand(3, 4));
      const angle = rand(0, 360) * Math.PI / 180;
      const stepDist = rand(40, 70);
      const duration = 1800;

      let x = rand(5, 95);
      let y = rand(5, 95);
      let side = Math.random() < 0.5 ? 'left' : 'right';

      for (let i = 0; i < steps; i++) {
        setTimeout(() => {
          const paw = document.createElement('div');
          paw.className = 'paw-print ' + side;
          paw.innerHTML = PAW_SVG;
          paw.style.left = x + '%';
          paw.style.top  = y + '%';
          document.body.appendChild(paw);

          paw.style.animation = `pawFade ${duration}ms ease-out forwards`;
          paw.addEventListener('animationend', () => paw.remove());

          x += Math.cos(angle) * stepDist / window.innerWidth * 100;
          y += Math.sin(angle) * stepDist / window.innerHeight * 100;
          side = side === 'left' ? 'right' : 'left';
        }, i * (duration * 0.4));
      }
    }

    setTimeout(createPawSequence, 800);
    setInterval(createPawSequence, rand(3000, 8000));
    