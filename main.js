// main.js (sin imports; funciona en GitHub Pages)
(() => {
  let content = null;
  const $ = (s, sc = document) => sc.querySelector(s);

  function buildServices(lang = 'en') {
    const c = $('#servicesList');
    if (!c || !content) return;
    c.innerHTML = '';
    (content.services || []).forEach(s => {
      const t = s[lang] || s.en || '';
      const [ti, de] = t.split(' — ');
      const el = document.createElement('div');
      el.className = 'service-card';
      el.innerHTML = `<h3>${ti || ''}</h3><p>${de || ''}</p>`;
      c.appendChild(el);
    });
  }

  function buildGallery() {
    const g = $('#gallery');
    if (!g || !content) return;
    g.innerHTML = '';
    (content.stock || []).forEach((u, i) => {
      const img = new Image();
      img.src = u;
      img.alt = `Portfolio ${i + 1}`;
      g.appendChild(img);
    });
  }

  function buildTestimonials(lang = 'en') {
    const t = $('#testimonials');
    if (!t || !content) return;
    t.innerHTML = '';
    (content.testimonials || []).forEach(o => {
      const el = document.createElement('article');
      el.className = 'testimonial';
      el.innerHTML = `<strong>${o.name} — ${o.city}</strong><p>${o[lang] || o.en || ''}</p>`;
      t.appendChild(el);
    });
  }

  function setupLang() {
    const tg = $('#langToggle');
    const bn = $('#brandName');
    const sl = $('#slogan');
    if (!tg || !bn || !sl || !content) return;

    let lang = localStorage.getItem('lang') || 'en';
    tg.checked = lang === 'en';

    function apply() {
      bn.textContent = content.brand?.name || 'Clean&Go!';
      sl.textContent = content.brand?.slogan?.[lang] || '';
      buildServices(lang);
      buildTestimonials(lang);
      document.documentElement.lang = lang;
    }

    tg.addEventListener('change', () => {
      lang = tg.checked ? 'en' : 'es';
      localStorage.setItem('lang', lang);
      apply();
    });

    apply();
  }

  function setupHoriz() {
    const panels = gsap.utils.toArray('.panel');
    const container = document.querySelector('.horiz-container');
    if (innerWidth > 720 && panels.length && container) {
      gsap.to(panels, {
        xPercent: -100 * (panels.length - 1),
        ease: 'none',
        scrollTrigger: {
          trigger: '.horiz-wrapper',
          pin: true,
          scrub: 0.8,
          end: () => '+=' + container.offsetWidth,
          snap: 1 / (panels.length - 1),
          invalidateOnRefresh: true
        }
      });
    }
  }

  async function loadAndInit() {
    // Antes tenías: import content from '../content.json' …
    // Ahora cargamos el JSON vía fetch y RUTA RELATIVA:
    const res = await fetch('contenido.json');
    content = await res.json();

    setupLang();
    buildGallery();
    setupHoriz();

    // three-scene.js ya se carga en index.html.
    if (typeof window.initThree === 'function') {
      window.initThree();
    }
  }

  loadAndInit();
})();
