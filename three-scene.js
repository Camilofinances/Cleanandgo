// three-scene.js — estilo "Pixar" + burbujas que explotan al tocarlas
window.initThree = function () {
  try {
    if (typeof THREE === 'undefined') throw new Error('THREE no cargó');
    const wrap = document.getElementById('canvas-wrap');
    if (!wrap) throw new Error('#canvas-wrap no existe');

    // ---------- RENDERER FULLSCREEN ----------
    const W = innerWidth, H = innerHeight;
    const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    wrap.innerHTML = '';
    wrap.appendChild(renderer.domElement);

    // ---------- ESCENA / CÁMARA ----------
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xf4f6f8, 3, 9);
    const camera = new THREE.PerspectiveCamera(45, W/H, 0.1, 100);
    camera.position.set(0.6, 0.8, 4.4);

    // ---------- LUCES (suaves y cálidas) ----------
    const hemi = new THREE.HemisphereLight(0xffffff, 0xcfe6ff, 1.1);
    scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(2.5, 3.5, 3.5);
    dir.castShadow = true;
    dir.shadow.mapSize.set(1024, 1024);
    dir.shadow.camera.near = 0.5;
    dir.shadow.camera.far = 12;
    scene.add(dir);
    // kick de rim‑light para "Pixar"
    const rim = new THREE.DirectionalLight(0xbfdfff, 0.35);
    rim.position.set(-3, 2, -2);
    scene.add(rim);

    // ---------- TOON GRADIENT (para materiales tipo Pixar) ----------
    function toonGradient(steps = 4) {
      const c = document.createElement('canvas'); c.width = 256; c.height = 1;
      const ctx = c.getContext('2d');
      const g = ctx.createLinearGradient(0,0,256,0);
      // bandas suaves
      for (let i=0;i<=steps;i++){
        const t = i/steps;
        g.addColorStop(t, `rgb(${255*t},${255*t},${255*t})`);
      }
      ctx.fillStyle = g; ctx.fillRect(0,0,256,1);
      const tex = new THREE.CanvasTexture(c);
      tex.minFilter = THREE.NearestFilter;
      tex.magFilter = THREE.NearestFilter;
      tex.generateMipmaps = false;
      return tex;
    }
    const gradientMap = toonGradient(5);

    // ---------- SUELO (recibe sombra) ----------
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(3.2, 64),
      new THREE.MeshStandardMaterial({
        color:0xeff3f7, roughness:0.95, metalness:0,
        transparent:true, opacity:0.9
      })
    );
    ground.rotation.x = -Math.PI/2;
    ground.position.y = -0.85;
    ground.receiveShadow = true;
    scene.add(ground);

    const brandBlue = 0x29648e, steel = 0xd9dee5;

    // ---------- CUBO / ESCURRIDOR (toon) ----------
    const bucket = new THREE.Group();
    const bucketMat = new THREE.MeshToonMaterial({ color:brandBlue, gradientMap, toneMapped:true });
    const bucketBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.78, 0.95, 0.95, 64),
      bucketMat
    );
    bucketBody.castShadow = true; bucketBody.receiveShadow = false;

    const lip = new THREE.Mesh(
      new THREE.TorusGeometry(0.50, 0.035, 16, 64),
      new THREE.MeshToonMaterial({ color:0x2d7bb0, gradientMap })
    );
    lip.rotation.x = Math.PI/2; lip.position.y = 0.48; lip.castShadow = true;

    const wring = new THREE.Mesh(
      new THREE.CylinderGeometry(0.58, 0.58, 0.12, 42, 1, true),
      new THREE.MeshStandardMaterial({ color:steel, roughness:0.25, metalness:0.75, side:THREE.DoubleSide })
    );
    wring.position.y = 0.49; wring.castShadow = true;

    const handle = new THREE.Mesh(
      new THREE.TorusGeometry(0.57, 0.022, 12, 64, Math.PI),
      new THREE.MeshStandardMaterial({ color:steel, roughness:0.35, metalness:0.85 })
    );
    handle.rotation.z = Math.PI; handle.position.y = 0.26; handle.castShadow = true;

    bucket.add(bucketBody, lip, wring, handle);
    bucket.position.set(-0.7, -0.32, 0);
    bucket.rotation.y = -0.28;
    scene.add(bucket);

    // ---------- FREGONA (toon + piezas redondeadas) ----------
    const mop = new THREE.Group();
    const stick = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 1.9, 16),
      new THREE.MeshToonMaterial({ color:0x9a6a46, gradientMap })
    );
    stick.position.y = 0.25; stick.castShadow = true;

    const headCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.18, 0.12, 24),
      new THREE.MeshToonMaterial({ color:brandBlue, gradientMap })
    );
    headCap.position.y = -0.78; headCap.castShadow = true;

    const strands = new THREE.Group();
    const strandMat = new THREE.MeshToonMaterial({ color:0xffffff, gradientMap });
    for (let i=0;i<20;i++){
      const s = new THREE.Mesh(new THREE.CapsuleGeometry(0.022, 0.62, 3, 10), strandMat);
      s.position.set(Math.cos(i/20*Math.PI*2)*0.13, -1.08, Math.sin(i/20*Math.PI*2)*0.13);
      s.rotation.x = 0.25 + Math.random()*0.28;
      s.castShadow = true;
      strands.add(s);
    }
    mop.add(stick, headCap, strands);
    mop.position.set(0.65, -0.08, 0);
    mop.rotation.z = -0.22; mop.rotation.y = 0.32;
    scene.add(mop);

    // ---------- BURBUJAS (profundidad + estallido) ----------
    const bubbles = new THREE.Group(); scene.add(bubbles);
    const bubbleCount = Math.round((innerWidth * innerHeight) / 14000);
    const baseBubbleMat = new THREE.MeshStandardMaterial({
      color:0xbfe6ff, emissive:0x000000,
      transparent:true, opacity:0.55, roughness:0.15, metalness:0.2
    });

    for (let i=0;i<bubbleCount;i++){
      const r = 0.016 + Math.random()*0.075;
      const m = baseBubbleMat.clone(); m.opacity = 0.25 + Math.random()*0.6;
      const b = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 24), m);
      b.position.set((Math.random()-0.5)*10, -2 + Math.random()*4, -2.5 + Math.random()*2.5);
      b.userData = { speed: 0.004 + Math.random()*0.01, r };
      b.castShadow = false; b.receiveShadow = false;
      bubbles.add(b);
    }

    // ---------- PARALLAX Y ANIMACIÓN ----------
    let tx=0, ty=0;
    addEventListener('pointermove', e=>{
      tx = (e.clientX/innerWidth - .5) * .5;
      ty = (e.clientY/innerHeight - .5) * .35;
    }, {passive:true});

    if (window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      gsap.to(camera.position, {
        z: 4.9,
        scrollTrigger:{ trigger: document.body, start:"top top", end:"bottom bottom", scrub:1 }
      });
    }

    // ---------- "POP" de burbujas (raycaster) ----------
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    function onTap(ev){
      const cx = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const cy = ev.touches ? ev.touches[0].clientY : ev.clientY;
      mouse.x = (cx / innerWidth) * 2 - 1;
      mouse.y = -(cy / innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(bubbles.children, false);
      if (!hits.length) return;

      const obj = hits[0].object;
      // animación de estallido con GSAP (si está) o fallback manual
      const pop = () => {
        // mini partículas
        for (let i=0;i<8;i++){
          const p = new THREE.Mesh(new THREE.SphereGeometry(obj.userData.r*0.25, 12, 12),
            new THREE.MeshStandardMaterial({ color:0xbfe6ff, transparent:true, opacity:0.7 }));
          p.position.copy(obj.position);
          p.userData.v = new THREE.Vector3((Math.random()-0.5)*0.06, Math.random()*0.08, (Math.random()-0.5)*0.06);
          scene.add(p);
          setTimeout(()=>scene.remove(p), 400);
          (function animPart(){
            p.position.add(p.userData.v);
            p.material.opacity *= 0.85;
            if (p.material.opacity>0.05) requestAnimationFrame(animPart);
          })();
        }
        bubbles.remove(obj);
      };

      if (window.gsap) {
        gsap.to(obj.scale, { x:1.6, y:1.6, z:1.6, duration:0.1, yoyo:true, repeat:1, onComplete:pop });
        gsap.to(obj.material, { opacity:0, duration:0.2 });
      } else {
        // fallback simple
        let k=0; (function bump(){
          k+=0.12; obj.scale.setScalar(1+k);
          obj.material.opacity *= 0.8;
          if (k<0.6) requestAnimationFrame(bump); else pop();
        })();
      }
    }
    addEventListener('pointerdown', onTap, {passive:true});
    addEventListener('touchstart', onTap, {passive:true});

    // ---------- LOOP ----------
    function loop(t){
      requestAnimationFrame(loop);
      const k = t*0.0012;

      bubbles.children.forEach(s=>{
        s.position.y += s.userData.speed;
        if (s.position.y > 2) s.position.y = -2;
      });

      bucket.position.y = -0.32 + Math.sin(k)*0.02;
      mop.position.y    = -0.08 + Math.cos(k*1.1)*0.02;

      camera.position.x += (tx - camera.position.x)*0.06;
      camera.position.y += (ty - camera.position.y)*0.06;

      renderer.render(scene, camera);
    }
    loop(0);

    // ---------- RESIZE ----------
    addEventListener('resize', ()=>{
      const w2 = innerWidth, h2 = innerHeight;
      renderer.setSize(w2, h2);
      camera.aspect = w2/h2;
      camera.updateProjectionMatrix();
    });

  } catch (e) {
    const box = document.createElement('div');
    box.style.cssText='position:fixed;bottom:10px;left:10px;background:#fff;padding:8px 10px;border:1px solid #ddd;border-radius:8px;color:#c00;font:12px/1.2 system-ui;z-index:99999';
    box.textContent = '3D error: ' + e.message;
    document.body.appendChild(box);
  }
};

// auto‑arranque
window.initThree && window.initThree();
