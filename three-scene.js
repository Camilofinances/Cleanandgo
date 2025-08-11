// three-scene.js — Fregona + cubo/escurridor con burbujas interactivas
window.initThree = function () {
  try {
    if (typeof THREE === 'undefined') throw new Error('THREE no cargó');

    const wrap = document.getElementById('canvas-wrap');
    if (!wrap) throw new Error('#canvas-wrap no existe');

    // asegurar altura visible
    if ((wrap.clientHeight || 0) < 150) {
      wrap.style.display = 'block';
      wrap.style.minHeight = '320px';
      wrap.style.height = '40vh';
    }

    const W = wrap.clientWidth || innerWidth * 0.9;
    const H = wrap.clientHeight || Math.max(innerHeight * 0.4, 320);

    // renderer / cámara / escena
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    wrap.innerHTML = '';
    wrap.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    camera.position.set(0.4, 0.6, 4.2);

    // luces
    scene.add(new THREE.HemisphereLight(0xffffff, 0x9fc8e8, 1.2));
    const dir = new THREE.DirectionalLight(0xffffff, 0.7);
    dir.position.set(2, 3, 4);
    scene.add(dir);

    // SUELO SUAVE (solo para sombra visual)
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(2.8, 64),
      new THREE.MeshStandardMaterial({
        color: 0xeff3f7, roughness: 0.95, metalness: 0, transparent: true, opacity: 0.8
      })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.8;
    scene.add(ground);

    // ======== CUBO + ESCURRIDOR =========
    const brandBlue = 0x29648e;
    const steel = 0xd9dee5;

    // cuerpo del cubo
    const bucket = new THREE.Group();
    const outer = new THREE.Mesh(
      new THREE.CylinderGeometry(0.75, 0.9, 0.9, 64, 1, false),
      new THREE.MeshStandardMaterial({ color: brandBlue, roughness: 0.5, metalness: 0.2 })
    );
    const lip = new THREE.Mesh(
      new THREE.TorusGeometry(0.48, 0.03, 16, 64),
      new THREE.MeshStandardMaterial({ color: 0x2d7bb0, roughness: 0.6, metalness: 0.2 })
    );
    lip.rotation.x = Math.PI / 2;
    lip.position.y = 0.45;

    // escurridor (rejilla superior)
    const wring = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.55, 0.12, 40, 1, true),
      new THREE.MeshStandardMaterial({ color: steel, roughness: 0.3, metalness: 0.7, side: THREE.DoubleSide })
    );
    wring.position.y = 0.46;

    // asa simple
    const handleArc = new THREE.Mesh(
      new THREE.TorusGeometry(0.55, 0.02, 12, 64, Math.PI),
      new THREE.MeshStandardMaterial({ color: steel, roughness: 0.4, metalness: 0.8 })
    );
    handleArc.rotation.z = Math.PI;
    handleArc.position.y = 0.25;

    bucket.add(outer, lip, wring, handleArc);
    bucket.position.set(-0.7, -0.35, 0);
    bucket.rotation.y = -0.25;
    scene.add(bucket);

    // ======== FREGONA =========
    const mop = new THREE.Group();

    // palo
    const stick = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 1.8, 16),
      new THREE.MeshStandardMaterial({ color: 0x8b5e3c, roughness: 0.7 })
    );
    stick.position.y = 0.2;

    // cabezal (pieza azul)
    const headCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.16, 0.12, 24),
      new THREE.MeshStandardMaterial({ color: brandBlue, roughness: 0.5, metalness: 0.2 })
    );
    headCap.position.y = -0.75;

    // faldas de microfibra (simples tiras curvas)
    const strands = new THREE.Group();
    const strandMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, metalness: 0.05 });
    for (let i = 0; i < 18; i++) {
      const s = new THREE.Mesh(new THREE.CapsuleGeometry(0.02, 0.6, 2, 8), strandMat);
      s.position.set(
        Math.cos((i / 18) * Math.PI * 2) * 0.12,
        -1.05,
        Math.sin((i / 18) * Math.PI * 2) * 0.12
      );
      s.rotation.x = 0.25 + Math.random() * 0.25;
      strands.add(s);
    }

    mop.add(stick, headCap, strands);
    mop.position.set(0.6, -0.1, 0);
    mop.rotation.z = -0.25;
    mop.rotation.y = 0.3;
    scene.add(mop);

    // ======== BURBUJAS INTERACTIVAS DE FONDO =========
    const bubbles = new THREE.Group();
    const bubbleMat = new THREE.MeshStandardMaterial({ color: 0x9fc8e8, transparent: true, opacity: 0.55, metalness: 0.1, roughness: 0.2 });
    for (let i = 0; i < 80; i++) {
      const r = 0.02 + Math.random() * 0.06;
      const b = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 16), bubbleMat.clone());
      b.position.set((Math.random() - 0.5) * 6, -1.2 + Math.random() * 2.2, -1 + Math.random() * 0.5);
      b.userData.speed = 0.003 + Math.random() * 0.006;
      bubbles.add(b);
    }
    scene.add(bubbles);

    // interactividad sutil
    let tx = 0, ty = 0;
    addEventListener('pointermove', e => {
      tx = (e.clientX / innerWidth - 0.5) * 0.5;
      ty = (e.clientY / innerHeight - 0.5) * 0.35;
    }, { passive: true });

    // animación
    function anim(t) {
      requestAnimationFrame(anim);

      // burbujas ascendentes
      bubbles.children.forEach(s => {
        s.position.y += s.userData.speed;
        if (s.position.y > 1.2) s.position.y = -1.2;
      });

      // flotación ligera del cubo y la fregona
      const k = t * 0.0012;
      bucket.position.y = -0.35 + Math.sin(k) * 0.02;
      mop.position.y = -0.1 + Math.cos(k * 1.1) * 0.02;

      // cámara “persigue” puntero
      camera.position.x += (tx - camera.position.x) * 0.06;
      camera.position.y += (ty - camera.position.y) * 0.06;

      renderer.render(scene, camera);
    }
    anim(0);

    // resize
    addEventListener('resize', () => {
      const w2 = wrap.clientWidth || innerWidth * 0.9;
      const h2 = wrap.clientHeight || Math.max(innerHeight * 0.4, 320);
      renderer.setSize(w2, h2);
      camera.aspect = w2 / h2;
      camera.updateProjectionMatrix();
    });
  } catch (e) {
    const box = document.createElement('div');
    box.style.cssText = 'position:fixed;bottom:10px;left:10px;background:#fff;padding:8px 10px;border:1px solid #ddd;border-radius:8px;color:#c00;font:12px/1.2 system-ui;z-index:99999';
    box.textContent = '3D error: ' + e.message;
    document.body.appendChild(box);
  }
};

// auto‑arranque por si el main tarda en llamarlo
window.initThree && window.initThree();
