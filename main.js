// UI + contenido. Sin animaciones que empujen el layout.
(() => {
  let content = null;
  const $  = (s, sc = document) => sc.querySelector(s);

  /* =======================
     Construcción de contenido
  ======================= */
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
      img.loading = 'lazy';
      img.decoding = 'async';
      img.src = u;
      img.alt = `Portfolio ${i + 1}`;
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

  /* =======================
     Idioma (switch accesible)
  ======================= */
  function setupLang() {
    const sw = $('#langToggle');
    const bn = $('#brandName');
    const sl = $('#slogan');

    let lang = localStorage.getItem('lang') || 'en';
    const apply = () => {
      if (bn) bn.textContent = content?.brand?.name || 'Clean&Go!';
      if (sl) sl.textContent = content?.brand?.slogan?.[lang] || (lang === 'es' ? 'Brilla. Listo.' : 'Spark. Shine.');
      // Cabeceras estáticas (si las añades a content.json, cámbialas aquí)
      $('#servicesTitle')?.replaceChildren(document.createTextNode(lang === 'es' ? 'Servicios' : 'Services'));
      $('#portfolioTitle')?.replaceChildren(document.createTextNode('Portfolio'));
      $('#testimonialsTitle')?.replaceChildren(document.createTextNode(lang === 'es' ? 'Reseñas' : 'Testimonials'));
      $('#faqTitle')?.replaceChildren(document.createTextNode('FAQ'));
      $('#contactTitle')?.replaceChildren(document.createTextNode(lang === 'es' ? 'Contacto' : 'Contact'));

      buildServices(lang);
      buildTestimonials(lang);
      document.documentElement.lang = lang;

      // Estado visual/ARIA del switch
      if (sw) {
        sw.setAttribute('aria-checked', lang === 'en' ? 'true' : 'false');
        const lbl = sw.querySelector('.lang-label');
        if (lbl) lbl.textContent = lang === 'en' ? 'EN / ES' : 'ES / EN';
      }
    };

    if (sw) {
      sw.addEventListener('click', () => {
        lang = (lang === 'en') ? 'es' : 'en';
        localStorage.setItem('lang', lang);
        apply();
      });
    }

    apply();
  }

  /* =======================
     Carga de contenido
  ======================= */
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

    // NO llamamos a initBubbles aquí: three-scene.js ya auto-inicia con guard
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAndInit, { once: true });
  } else {
    loadAndInit();
  }
})();
