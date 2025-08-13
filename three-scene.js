// Fondo de burbujas 3D: cubre la ventana, no empuja el layout y sigue visible durante todo el scroll.
(() => {
  function initBubbles() {
    if (typeof THREE === 'undefined') return;

    // Evita dobles inicializaciones
    if (window.__bubblesRunning) return;
    window.__bubblesRunning = true;

    const host = document.getElementById('bg3d');
    if (!host) { window.__bubblesRunning = false; return; }

    // Garantiza fondo correcto
    Object.assign(host.style, {
      position: 'fixed',
      inset: '0px',
      zIndex: '0',
      pointerEvents: 'none',
      display: 'block'
    });

    // Respeta “reduced motion” y limita DPR para móviles
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dprCap = prefersReduced ? 1 : Math.min(window.devicePixelRatio || 1, 2);

    // Renderer transparente, modo bajo consumo
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(dprCap);
    host.innerHTML = '';
    host.appendChild(renderer.domElement);

    // Escena + cámara ortográfica mapeada a la ventana
    const scene = new THREE.Scene();
    let camera, aspect;

    function setupCamera() {
      aspect = window.innerWidth / window.innerHeight;
      camera = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, -10, 10);
      camera.position.set(0, 0, 5);
    }
    setupCamera();

    // Luces suaves
    scene.add(new THREE.HemisphereLight(0xffffff, 0xf3f6fa, 1.0));
    const dir = new THREE.DirectionalLight(0xffffff, 0.4);
    dir.position.set(2, 3, 4);
    scene.add(dir);

    // Material vidrio claro
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0,
      roughness: 0.08,
      transmission: 1,
      transparent: true,
      opacity: 0.3,
      thickness: 0.5,
      clearcoat: 0.8,
      clearcoatRoughness: 0.15,
      attenuationColor: new THREE.Color(0xffffff),
      attenuationDistance: 1.2
    });
    const geo = new THREE.SphereGeometry(1, 32, 32);

    // Densidad adaptada al área de pantalla
    const areaNorm = (window.innerWidth * window.innerHeight) / (1280 * 720);
    const TARGET = Math.round((prefersReduced ? 3 : 10) * Math.min(areaNorm, 1.8));
    const MAX_POOL = Math.max(20, TARGET * 4);

    const pool = [];
    const active = new Set();

    for (let i = 0; i < MAX_POOL; i++) {
      const m = new THREE.Mesh(geo, mat.clone());
      m.visible = false;
      m.userData = { vx: 0, vy: 0, life: 0, maxLife: 0, base: 1, wobble: Math.random() * Math.PI * 2 };
      scene.add(m);
      pool.push(m);
    }

    function spawn() {
      const b = pool.find(x => !x.visible);
      if (!b) return;

      const side = Math.floor(Math.random() * 4); // 0 top, 1 right, 2 bottom, 3 left
      const pad = 0.12;
      let x = 0, y = 0, vx = 0, vy = 0;

      if (side === 0) { // top -> baja
        x = THREE.MathUtils.randFloat(-aspect, aspect);
        y = 1 + pad; vx = THREE.MathUtils.randFloatSpread(0.25); vy = THREE.MathUtils.randFloat(-0.35, -0.15);
      } else if (side === 2) { // bottom -> sube
        x = THREE.MathUtils.randFloat(-aspect, aspect);
        y = -1 - pad; vx = THREE.MathUtils.randFloatSpread(0.25); vy = THREE.MathUtils.randFloat(0.15, 0.35);
      } else if (side === 1) { // right -> izquierda
        x = aspect + pad; y = THREE.MathUtils.randFloat(-1, 1);
        vx = THREE.MathUtils.randFloat(-0.35, -0.15); vy = THREE.MathUtils.randFloatSpread(0.25);
      } else { // left -> derecha
        x = -aspect - pad; y = THREE.MathUtils.randFloat(-1, 1);
        vx = THREE.MathUtils.randFloat(0.15, 0.35); vy = THREE.MathUtils.randFloatSpread(0.25);
      }

      b.position.set(x, y, THREE.MathUtils.randFloat(-0.3, 0.3));
      const d = b.userData;
      d.vx = vx; d.vy = vy;
      d.base = THREE.MathUtils.randFloat(0.06, 0.18);
      b.scale.setScalar(d.base);
      d.life = 0; d.maxLife = THREE.MathUtils.randFloat(6, 12);
      b.material.opacity = 0.3;
      b.visible = true; active.add(b);
    }

    function keep() { while (active.size < TARGET) spawn(); }

    const clock = new THREE.Clock();
    let rafId = null;
    let running = true;

    function frame(dt) {
      active.forEach(b => {
        const d = b.userData;
        b.position.x += d.vx * dt;
        b.position.y += d.vy * dt;

        d.wobble += dt * 2;
        const s = d.base * (1 + Math.sin(d.wobble) * 0.05);
        b.scale.setScalar(s);

        d.life += dt;
        const t = d.life / d.maxLife;
        const fade = t < 0.08 ? t / 0.08 : (t > 0.9 ? (1 - t) / 0.1 : 1);
        b.material.opacity = 0.3 * Math.max(0, Math.min(1, fade));

        const outX = Math.abs(b.position.x) > (aspect + 0.25);
        const outY = Math.abs(b.position.y) > (1 + 0.25);
        if (d.life >= d.maxLife || outX || outY) { b.visible = false; active.delete(b); }
      });
      keep();
      renderer.render(scene, camera);
    }

    function loop() {
      if (!running) return;
      rafId = requestAnimationFrame(loop);
      const dt = Math.min(clock.getDelta(), 0.033);
      frame(dt);
    }

    function resize() {
      const w = window.innerWidth, h = window.innerHeight;
      renderer.setSize(w, h);
      aspect = w / h;
      camera.left = -aspect; camera.right = aspect; camera.top = 1; camera.bottom = -1;
      camera.updateProjectionMatrix();
    }

    const onResize = () => resize();
    const onOrient = () => setTimeout(resize, 200);

    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('orientationchange', onOrient, { passive: true });

    document.addEventListener('visibilitychange', () => {
      const hidden = document.hidden;
      running = !hidden;
      if (!running) cancelAnimationFrame(rafId);
      else { clock.getDelta(); loop(); } // reancla delta y reanuda
    });

    // Context lost (Safari etc.)
    renderer.getContext().canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      // podrías re-crear escena si lo deseas; aquí solo pausamos
      running = false;
      cancelAnimationFrame(rafId);
    }, { passive: false });

    // Exponer un dispose opcional para futuras reinicializaciones
    function dispose() {
      running = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onOrient);

      scene.traverse(o => {
        o.geometry?.dispose?.();
        o.material?.dispose?.();
      });
      renderer.dispose();
      host.innerHTML = '';
      window.__bubblesRunning = false;
    }
    window.disposeBubbles = dispose;

    // Arranque
    resize();
    keep();
    loop();
  }

  // Auto-init cuando el DOM y Three están listos
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBubbles, { once: true });
  } else {
    initBubbles();
  }

  // Export por si quieres llamarlo manualmente (no es necesario)
  window.initBubbles = initBubbles;
})();
