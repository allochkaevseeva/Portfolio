document.addEventListener('DOMContentLoaded', function () {

  /* ============================================================
     SECTIONS — для навигации «на экран выше»
     ============================================================ */
  var sections = Array.from(document.querySelectorAll(
    '#hero, #about, #competencies, #cases, #contacts'
  ));

  /* ============================================================
     MOBILE NAV TOGGLE
     ============================================================ */
  var navToggle = document.querySelector('.nav-toggle');
  var mainNav   = document.getElementById('main-nav');

  function closeNav() {
    if (!mainNav) return;
    mainNav.classList.remove('is-open');
    if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  if (navToggle && mainNav) {
    navToggle.addEventListener('click', function () {
      var open = mainNav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
  }

  /* Закрыть nav при клике по ссылке */
  if (mainNav) {
    mainNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeNav);
    });
  }

  /* Закрыть на Escape */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeNav();
  });

  /* ============================================================
     SMOOTH SCROLL для якорных ссылок
     ============================================================ */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  /* ============================================================
     КНОПКА «ВВЕРХ» — фиксированная
     Появляется: как только header полностью ушёл за верх экрана.
     Клик: прокручивает к разделу ВЫШЕ текущего.
     Текущий раздел: тот, нижняя граница которого пересекает
       нижнюю половину экрана (виден снизу минимум на 50%).
     Если уже на самом верхнем разделе — скроллит к #top (header).
     Разделы (в порядке сверху вниз):
       #top(header) → #hero → #about → #competencies → #cases → #contacts
     ============================================================ */
  var btnFixed = document.getElementById('btn-up-fixed');
  var headerEl = document.getElementById('top');

  /* — Видимость кнопки — */
  function updateBtnVisibility() {
    if (!btnFixed) return;
    /* Показываем когда header полностью скрылся за верхом экрана */
    var headerBottom = headerEl ? headerEl.getBoundingClientRect().bottom : 0;
    if (headerBottom < 0) {
      btnFixed.classList.add('is-visible');
      btnFixed.hidden = false;
    } else {
      btnFixed.classList.remove('is-visible');
    }
  }
  window.addEventListener('scroll', updateBtnVisibility, { passive: true });
  updateBtnVisibility();

  /* — Определить текущий раздел и вернуть предыдущий — */
  function getPrevSection() {
    var vh          = window.innerHeight;
    var midScreen   = vh / 2; /* нижняя половина экрана начинается с середины */
    /* Все точки навигации включая header */
    var navPoints   = [headerEl].concat(sections).filter(Boolean);

    /* Текущий — первый элемент, чья нижняя граница
       опускается НИЖЕ середины экрана (т.е. занимает нижнюю половину) */
    var currentIdx  = 0;
    for (var i = 0; i < navPoints.length; i++) {
      var rect = navPoints[i].getBoundingClientRect();
      if (rect.bottom > midScreen) {
        currentIdx = i;
        break;
      }
      /* Если ни один не дотянул до середины — берём последний */
      currentIdx = i;
    }

    /* Предыдущий — на один выше текущего, минимум 0 (header) */
    var prevIdx = Math.max(0, currentIdx - 1);
    return navPoints[prevIdx];
  }

  if (btnFixed) {
    function goUp() {
      var target = getPrevSection();
      /* Если цель — header (#top), скроллим в самый верх страницы */
      if (target === headerEl) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    btnFixed.addEventListener('click', goUp);
    /* Доступность: Enter/Space */
    btnFixed.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        goUp();
      }
    });
  }

  /* ============================================================
     ACCORDION
     ============================================================ */
  document.querySelectorAll('.accordion__trigger').forEach(function (trigger) {
    trigger.addEventListener('click', function () {
      var expanded = this.getAttribute('aria-expanded') === 'true';
      var bodyId   = this.getAttribute('aria-controls');
      var body     = document.getElementById(bodyId);
      if (!body) return;

      if (expanded) {
        collapseItem(this, body);
      } else {
        expandItem(this, body);
      }
    });
  });

  function expandItem(trigger, body) {
    trigger.setAttribute('aria-expanded', 'true');

    /* Убираем hidden, измеряем высоту, анимируем */
    body.hidden = false;
    body.classList.add('is-animating');
    var height = body.scrollHeight;
    body.style.height = '0px';
    body.style.overflow = 'hidden';

    /* Принудительный reflow */
    body.offsetHeight; // eslint-disable-line no-unused-expressions

    body.style.transition = 'height 0.35s ease';
    body.style.height = height + 'px';

    body.addEventListener('transitionend', function onEnd() {
      body.removeEventListener('transitionend', onEnd);
      body.style.height   = '';
      body.style.overflow = '';
      body.style.transition = '';
      body.classList.remove('is-animating');
    });
  }

  function collapseItem(trigger, body) {
    trigger.setAttribute('aria-expanded', 'false');

    body.style.height   = body.scrollHeight + 'px';
    body.style.overflow = 'hidden';
    body.classList.add('is-animating');

    body.offsetHeight; // eslint-disable-line no-unused-expressions

    body.style.transition = 'height 0.3s ease';
    body.style.height = '0px';

    body.addEventListener('transitionend', function onEnd() {
      body.removeEventListener('transitionend', onEnd);
      body.style.height   = '';
      body.style.overflow = '';
      body.style.transition = '';
      body.classList.remove('is-animating');
      body.hidden = true;
    });
  }

  /* ============================================================
     REVEAL ANIMATION (только при prefers-reduced-motion: no-preference)
     ============================================================ */
  if (
    typeof IntersectionObserver !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: no-preference)').matches
  ) {
    var style = document.createElement('style');
    style.textContent =
      '.js-reveal{opacity:0;transform:translateY(20px);transition:opacity .5s ease,transform .5s ease}' +
      '.js-reveal.is-visible{opacity:1;transform:none}';
    document.head.appendChild(style);

    var revealTargets = document.querySelectorAll(
      '.stat, .comp__card, .comp__featured, .accordion__item'
    );
    revealTargets.forEach(function (el) { el.classList.add('js-reveal'); });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });

    revealTargets.forEach(function (el) { observer.observe(el); });
  }

  /* ============================================================
     LIGHTBOX — открытие скринов в полный размер
     Клик по [data-lightbox] → открыть, Esc / крестик / backdrop → закрыть
     ============================================================ */
  var lightbox         = document.getElementById('lightbox');
  var lightboxImg      = document.getElementById('lightbox-img');
  var lightboxClose    = document.getElementById('lightbox-close');
  var lightboxBackdrop = document.getElementById('lightbox-backdrop');
  var lastFocused      = null;

  function openLightbox(src, alt) {
    if (!lightbox || !lightboxImg) return;
    lastFocused = document.activeElement;
    lightboxImg.src = src;
    lightboxImg.alt = alt || '';
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    if (lightboxClose) lightboxClose.focus();
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.hidden = true;
    lightboxImg.src = '';
    document.body.style.overflow = '';
    if (lastFocused) lastFocused.focus();
  }

  /* Делегируем клики — работает для кейсов, открытых позже */
  document.addEventListener('click', function (e) {
    var wrapper = e.target.closest('[data-lightbox]');
    if (!wrapper) return;
    var img = wrapper.querySelector('img');
    if (!img || !img.src) return;
    /* Пропускаем заглушки (placeholder — картинка не загружена) */
    if (wrapper.classList.contains('case-screen__img--placeholder') &&
        img.naturalWidth === 0) return;
    openLightbox(img.src, img.alt);
  });

  if (lightboxClose)    lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxBackdrop) lightboxBackdrop.addEventListener('click', closeLightbox);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && lightbox && !lightbox.hidden) {
      closeLightbox();
    }
  });

});

