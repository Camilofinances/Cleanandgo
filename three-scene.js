// three-scene.js — Fondo de burbujas en toda la pantalla
(function () {
  // Si Three.js no cargó, salimos silenciosamente
  if (typeof THREE === 'undefined') return;

  const container = document.getElementById('bg3d');
  if (!container) return;

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  // Escena y cámara
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 6);

  // Luces suaves (estilo “limpio”)
  scene.add(new THREE.HemisphereLight(0xffffff, 0xdfe9f3, 1.15));
  const dir = new THREE.DirectionalLight(0xffffff, 0.6);
  dir.position.set(2, 3, 4);
  scene.add(dir);

  // Parámetros de burbujas
  const MAX_POOL = 32;       // máximo en pool
  const TARGET_ACTIVE = 10;  // visibles simultáneamente
  const ACTIVE = new Set();

  // Geometría y material compartidos (performance)
  const bubbleGeo = new THREE.SphereGeometry(1, 24, 24);
  const bubbleMat = new THREE.MeshPhysicalMaterial({
    color: 0x9fd6ff,      // azul celeste
    metalness: 0.0,
    roughness: 0.15,
    transmission: 0.75,   // “vidrio” (si no lo soporta, cae en transparente)
    transparent: true,
    opacity: 0.9,
    thickness: 0.5,
    clearcoat: 0.6,
    clearcoatRoughness: 0.2
  });

  // Pool
  const pool = [];
  for (let i = 0; i < MAX_POOL; i++) {
    const m = new THREE.Mesh(bubbleGeo, bubbleMat);
    m.visible = false;
    // Propiedades custom
    m.__data = {
      vx: 0, vy: 0, vz: 0,
      life: 0, maxLife: 0,
      baseScale: 1,
      wobble: Math.random() * Math.PI * 2
    };
    scene.add(m);
    pool.push(m);
  }

  // Spawner
  function spawnBubble() {
    const m = pool.find(b => !b.visible);
    if (!m) return;

    // Posición inicial (repartido por toda la pantalla, un poco por detrás)
    m.position.set(
      THREE.MathUtils.randFloatSpread(8),     // x ~[-4,4]
      THREE.MathUtils.randFloat(-3.5, -1.0),  // y bajo
      THREE.MathUtils.randFloat(-1.5, 0.5)    // z
    );

    // Velocidades
    const d = m.__data;
    d.vx = THREE.MathUtils.randFloatSpread(0.12); // leve deriva horizontal
    d.vy = THREE.MathUtils.randFloat(0.35, 0.8);  // ascenso
    d.vz = THREE.MathUtils.randFloatSpread(0.04);

    // Tamaño
    d.baseScale = THREE.MathUtils.randFloat(0.25, 0.6);
    m.scale.setScalar(d.baseScale);

    // Vida
    d.life = 0;
    d.maxLife = THREE.MathUtils.randFloat(6, 12); // seg

    m.visible = true;
    ACTIVE.add(m);
  }

  // Mantener siempre ~10 activas
  function ensureActive() {
    while (ACTIVE.size < TARGET_ACTIVE) spawnBubble();
  }

  // Animación
  const clock = new THREE.Clock();
  function tick() {
    requestAnimationFrame(tick);
    const dt = Math.min(clock.getDelta(), 0.033); // cap 30 FPS delta

    // Animar activas
    ACTIVE.forEach(m => {
      const d = m.__data;

      // Movimiento
      m.position.x += d.vx * dt;
      m.position.y += d.vy * dt;
      m.position.z += d.vz * dt;

      // Wobble/respiración
      d.wobble += dt * 2;
      const s = d.baseScale * (1 + Math.sin(d.wobble) * 0.06);
      m.scale.setScalar(s);

      // Desvanecer al final de la vida
      d.life += dt;
      const t = d.life / d.maxLife;
      const fade = t < 0.1 ? t / 0.1 : (t > 0.85 ? (1 - t) / 0.15 : 1);
      m.material.opacity = 0.9 * Math.max(0, Math.min(1, fade));

      // Reciclar: si sale por arriba/tiempo agotado/fuera lateral
      if (m.position.y > 4.2 || d.life >= d.maxLife || Math.abs(m.position.x) > 6) {
        m.visible = false;
        ACTIVE.delete(m);
      }
    });

    ensureActive();
    renderer.render(scene, camera);
  }

  // Resize
  function onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', onResize, { passive: true });
  onResize();
  ensureActive();
  tick();
})();
