// Fondo de burbujas 3D que ocupa TODA la ventana sin empujar el layout.
(function () {
  function initBubbles() {
    if (typeof THREE === 'undefined') return;

    const host = document.getElementById('bg3d');
    if (!host) return;

    // Asegurar estilo correcto (fondo fijo)
    Object.assign(host.style, {
      position: 'fixed',
      inset: '0px',
      zIndex: '0',
      pointerEvents: 'none',
      display: 'block'
    });

    // Renderer transparente
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    host.innerHTML = '';
    host.appendChild(renderer.domElement);

    // Escena y cámara ortográfica (pantalla normalizada -aspect..aspect, -1..1)
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

    // Material "vidrio claro"
    const base = new THREE.MeshPhysicalMaterial({
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

    // Pool
    const MAX_POOL = 40, TARGET = 10;
    const pool = [];
    const active = new Set();

    for (let i = 0; i < MAX_POOL; i++) {
      const m = new THREE.Mesh(geo, base.clone());
      m.visible = false;
      m.userData = { vx: 0, vy: 0, life: 0, maxLife: 0, base: 1, wobble: Math.random() * Math.PI * 2 };
      scene.add(m);
      pool.push(m);
    }

    function spawn() {
      const b = pool.find(x => !x.visible);
      if (!b) return;

      const side = Math.floor(Math.random() * 4);  // 0 top, 1 right, 2 bottom, 3 left
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
      d.base = THREE.MathUtils.randFloat(0.06, 0.18); // radio relativo
      b.scale.setScalar(d.base);
      d.life = 0; d.maxLife = THREE.MathUtils.randFloat(6, 12);
      b.material.opacity = 0.3;
      b.visible = true; active.add(b);
    }

    function keep() {
      while (active.size < TARGET) spawn();
    }

    const clock = new THREE.Clock();
    function loop() {
      requestAnimationFrame(loop);
      const dt = Math.min(clock.getDelta(), 0.033);

      active.forEach(b => {
        const d = b.userData;
        b.position.x += d.vx * dt;
        b.position.y += d.vy * dt;

        // respiración sutil
        d.wobble += dt * 2;
        const s = d.base * (1 + Math.sin(d.wobble) * 0.05);
        b.scale.setScalar(s);

        d.life += dt;
        const t = d.life / d.maxLife;
        const fade = t < 0.08 ? t / 0.08 : (t > 0.9 ? (1 - t) / 0.1 : 1);
        b.material.opacity = 0.3 * Math.max(0, Math.min(1, fade));

        const outX = Math.abs(b.position.x) > (aspect + 0.25);
        const outY = Math.abs(b.position.y) > (1 + 0.25);
        if (d.life >= d.maxLife || outX || outY) {
          b.visible = false; active.delete(b);
        }
      });

      keep();
      renderer.render(scene, camera);
    }

    function resize() {
      const w = window.innerWidth, h = window.innerHeight;
      renderer.setSize(w, h);
      aspect = w / h;
      camera.left = -aspect; camera.right = aspect; camera.top = 1; camera.bottom = -1;
      camera.updateProjectionMatrix();
    }

    window.addEventListener('resize', resize, { passive: true });
    resize();
    keep();
    loop();
  }

  // Export
  window.initBubbles = initBubbles;
})();
