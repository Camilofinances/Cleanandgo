// three-scene.js — robusto en móvil y desktop
window.initThree = function () {
  try {
    if (typeof THREE === 'undefined') return;

    const wrap = document.getElementById('canvas-wrap');
    if (!wrap) return;

    // Asegurar altura visible aunque el CSS falle
    const h0 = wrap.clientHeight;
    if (!h0 || h0 < 150) {
      wrap.style.display = 'block';
      wrap.style.minHeight = '320px';
      wrap.style.height = '40vh';
    }

    const W = wrap.clientWidth || innerWidth * 0.9;
    const H = wrap.clientHeight || Math.max(innerHeight * 0.4, 320);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    camera.position.set(0, 0.2, 4.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    wrap.innerHTML = ''; // limpiar por si se llamó 2 veces
    wrap.appendChild(renderer.domElement);

    // Luces
    scene.add(new THREE.HemisphereLight(0xffffff, 0x9fc8e8, 1.2));
    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(2, 3, 4);
    scene.add(dir);

    // Plano ondulado
    const geo = new THREE.PlaneGeometry(4, 2.2, 80, 40);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.55,
      metalness: 0.05,
      transparent: true,
      opacity: 0.95
    });
    const plane = new THREE.Mesh(geo, mat);
    plane.rotation.x = -0.3;
    plane.position.set(-0.2, -0.1, 0);
    scene.add(plane);

    // Burbujas
    const bubbles = new THREE.Group();
    for (let i = 0; i < 36; i++) {
      const b = new THREE.Mesh(
        new THREE.SphereGeometry(0.03 + Math.random() * 0.05, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0x9fc8e8, transparent: true, opacity: 0.6 })
      );
      b.position.set((Math.random() - 0.5) * 3, -1 + Math.random() * 1.5, -0.2 + Math.random() * 0.6);
      b.scale.setScalar(0.6 + Math.random() * 1.2);
      bubbles.add(b);
    }
    scene.add(bubbles);

    // Interacción
    let tx = 0, ty = 0;
    addEventListener('pointermove', e => {
      tx = (e.clientX / innerWidth - 0.5) * 0.4;
      ty = (e.clientY / innerHeight - 0.5) * 0.25;
    }, { passive: true });

    // Animación
    function anim(t) {
      requestAnimationFrame(anim);
      const time = t * 0.001;

      for (let i = 0; i < geo.attributes.position.count; i++) {
        const ix = i * 3;
        const x = geo.attributes.position.array[ix];
        const y = geo.attributes.position.array[ix + 1];
        geo.attributes.position.array[ix + 2] =
          Math.sin(x * 2 + time) * 0.03 + Math.cos(y * 2 + time * 1.2) * 0.02;
      }
      geo.attributes.position.needsUpdate = true;

      bubbles.children.forEach((p, i) => {
        p.position.y += 0.004 + (i % 5) * 0.0005;
        if (p.position.y > 1) p.position.y = -1;
      });

      camera.position.x += (tx - camera.position.x) * 0.06;
      camera.position.y += (ty - camera.position.y) * 0.06;

      renderer.render(scene, camera);
    }
    anim(0);

    // Resize
    addEventListener('resize', () => {
      const w2 = wrap.clientWidth || innerWidth * 0.9;
      const h2 = wrap.clientHeight || Math.max(innerHeight * 0.4, 320);
      renderer.setSize(w2, h2);
      camera.aspect = w2 / h2;
      camera.updateProjectionMatrix();
    });

  } catch (e) {
    // Muestra el error en pantalla si algo falla (temporal)
    const box = document.createElement('div');
    box.style.cssText = 'position:fixed;bottom:10px;left:10px;background:#fff;padding:8px 10px;border:1px solid #ddd;border-radius:8px;color:#c00;font:12px/1.2 system-ui;z-index:99999';
    box.textContent = '3D error: ' + e.message;
    document.body.appendChild(box);
  }
};

// Forzar arranque por si el main no llega a llamarlo
window.initThree && window.initThree();
