// main.js limpio: UI, contenido y sin animaciones que empujen el layout.
(() => {
  let content = null;

  const $  = (s, sc = document) => sc.querySelector(s);

  /* ===== Construcción de contenido ===== */
  function buildServices(lang = 'en') {
    const c = $('#servicesList'); if (!c || !content) return;
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
    const g = $('#gallery'); if (!g || !content) return;
    g.innerHTML = '';
    (content.stock || []).forEach((u, i) => {
      const img = new Image();
      img.src = u; img.alt = `Portfolio ${i + 1}`;
      g.appendChild(img);
    });
  }

  function buildTestimonials(lang = 'en') {
    const t = $('#testimonials'); if (!t || !content) return;
    t.innerHTML = '';
    (content.testimonials || []).forEach(o => {
      const el = document.createElement('article');
      el.className = 'testimonial';
      el.innerHTML = `<strong>${o.name} — ${o.city}</strong><p>${o[lang] || o.en || ''}</p>`;
      t.appendChild(el);
    });
  }

  /* ===== Idioma ===== */
  function setupLang() {
    const tg = $('#langToggle'), bn = $('#brandName'), sl = $('#slogan');
    let lang = localStorage.getItem('lang') || 'en';
    if (tg) tg.checked = lang === 'en';

    function apply() {
      if (bn) bn.textContent = content?.brand?.name || 'Clean&Go!';
      if (sl) sl.textContent = content?.brand?.slogan?.[lang] || 'Spark. Shine.';
      buildServices(lang);
      buildTestimonials(lang);
      document.documentElement.lang = lang;
    }

    tg?.addEventListener('change', () => {
      lang = tg.checked ? 'en' : 'es';
      localStorage.setItem('lang', lang);
      apply();
    });

    apply();
  }

  /* ===== Carga de contenido ===== */
  async function loadAndInit() {
    try {
      const res = await fetch('content.json', { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      content = await res.json();
    } catch (e) {
      console.warn('No se pudo cargar content.json, usando valores por defecto.', e);
      content = {
        brand: { name: 'Clean&Go!', slogan: { es: 'Brilla. Listo.', en: 'Spark. Shine.' } },
        services: [],
        testimonials: [],
        stock: []
      };
    }

    setupLang();
    buildGallery();

    // Asegura que el fondo esté activo (por si el auto-init no se disparó)
    if (typeof window.initBubbles === 'function') window.initBubbles();
  }

  document.addEventListener('DOMContentLoaded', loadAndInit, { once: true });
})();
