// Fondo de burbujas realistas, cubriendo toda la pantalla, ~10 activas siempre.
// Cámara ORTOGRÁFICA para mapear directamente al viewport.
(() => {
  if (typeof THREE === 'undefined') return;
  const host = document.getElementById('bg3d');
  if (!host) return;

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  host.innerHTML = '';
  host.appendChild(renderer.domElement);

  // Escena + cámara ortográfica
  const scene = new THREE.Scene();
  let camera, aspect;

  function makeOrthoCamera() {
    aspect = window.innerWidth / window.innerHeight;
    // Ortho que cubre [-aspect, +aspect] en X y [-1, +1] en Y => pantalla completa.
    camera = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, -10, 10);
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);
  }
  makeOrthoCamera();

  // Luces suaves
  scene.add(new THREE.HemisphereLight(0xffffff, 0xe6f0f7, 1.15));
  const dir = new THREE.DirectionalLight(0xffffff, 0.65);
  dir.position.set(1.5, 2.5, 3);
  scene.add(dir);

  // Material "realista" (vidrio/gel)
  const bubbleMat = new THREE.MeshPhysicalMaterial({
    color: 0x9fd6ff,
    metalness: 0.0,
    roughness: 0.12,
    transmission: 0.85,  // efecto vidrio
    transparent: true,
    opacity: 0.95,
    thickness: 0.6,
    clearcoat: 0.7,
    clearcoatRoughness: 0.25
  });
  const bubbleGeo = new THREE.SphereGeometry(1, 32, 32);

  // Pool + estado
  const MAX_POOL = 40;
  const TARGET = 10;
  const pool = [];
  const active = new Set();

  for (let i = 0; i < MAX_POOL; i++) {
    const m = new THREE.Mesh(bubbleGeo, bubbleMat.clone());
    m.visible = false;
    m.userData = {
      vx: 0, vy: 0, // velocidad
      life: 0, maxLife: 0,
      baseScale: 1,
      wobble: Math.random() * Math.PI * 2
    };
    scene.add(m);
    pool.push(m);
  }

  // Spawning en TODA la pantalla (entra por cualquier borde aleatorio)
  function spawn() {
    const b = pool.find(x => !x.visible);
    if (!b) return;

    const side = Math.floor(Math.random() * 4); // 0 top,1 right,2 bottom,3 left
    const pad = 0.1; // fuera un poco del borde
    let x = 0, y = 0, vx = 0, vy = 0;

    if (side === 0) { // top → baja
      x = THREE.MathUtils.randFloat(-aspect, aspect);
      y = 1 + pad;
      vx = THREE.MathUtils.randFloatSpread(0.25);
      vy = THREE.MathUtils.randFloat(-0.35, -0.15);
    } else if (side === 2) { // bottom → sube
      x = THREE.MathUtils.randFloat(-aspect, aspect);
      y = -1 - pad;
      vx = THREE.MathUtils.randFloatSpread(0.25);
      vy = THREE.MathUtils.randFloat(0.15, 0.35);
    } else if (side === 1) { // right → izquierda
      x = aspect + pad;
      y = THREE.MathUtils.randFloat(-1, 1);
      vx = THREE.MathUtils.randFloat(-0.35, -0.15);
      vy = THREE.MathUtils.randFloatSpread(0.25);
    } else { // left → derecha
      x = -aspect - pad;
      y = THREE.MathUtils.randFloat(-1, 1);
      vx = THREE.MathUtils.randFloat(0.15, 0.35);
      vy = THREE.MathUtils.randFloatSpread(0.25);
    }

    b.position.set(x, y, THREE.MathUtils.randFloat(-0.3, 0.3));
    const ud = b.userData;
    ud.vx = vx; ud.vy = vy;
    ud.baseScale = THREE.MathUtils.randFloat(0.06, 0.18); // radio en coords pantalla
    b.scale.setScalar(ud.baseScale);
    ud.life = 0;
    ud.maxLife = THREE.MathUtils.randFloat(6, 12);
    b.material.opacity = 0.95;
    b.visible = true;
    active.add(b);
  }

  function keepTarget() {
    while (active.size < TARGET) spawn();
  }

  // Animación
  const clock = new THREE.Clock();
  function frame() {
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.033);

    active.forEach(b => {
      const ud = b.userData;
      // movimiento
      b.position.x += ud.vx * dt;
      b.position.y += ud.vy * dt;

      // ligero “respirar”
      ud.wobble += dt * 2.2;
      const s = ud.baseScale * (1 + Math.sin(ud.wobble) * 0.06);
      b.scale.setScalar(s);

      // fade in/out
      ud.life += dt;
      const t = ud.life / ud.maxLife;
      const fade = t < 0.1 ? t / 0.1 : (t > 0.85 ? (1 - t) / 0.15 : 1);
      b.material.opacity = 0.95 * Math.max(0, Math.min(1, fade));

      // si sale del viewport + margen → reciclar
      const outX = Math.abs(b.position.x) > (aspect + 0.2);
      const outY = Math.abs(b.position.y) > (1 + 0.2);
      if (ud.life >= ud.maxLife || outX || outY) {
        b.visible = false;
        active.delete(b);
      }
    });

    keepTarget();
    renderer.render(scene, camera);
  }

  // Resize: actualizar renderer y cámara ortográfica
  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h);
    aspect = w / h;
    camera.left = -aspect;
    camera.right = aspect;
    camera.top = 1;
    camera.bottom = -1;
    camera.updateProjectionMatrix();
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();
  keepTarget();
  frame();
})();
