// Fregona + cubo/escurridor con burbujas en fondo full-screen
window.initThree = function () {
  try {
    if (typeof THREE === 'undefined') throw new Error('THREE no cargó');

    const wrap = document.getElementById('canvas-wrap');
    if (!wrap) throw new Error('#canvas-wrap no existe');

    // renderer a pantalla completa (fondo)
    const W = innerWidth, H = innerHeight;
    const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    wrap.innerHTML = '';
    wrap.appendChild(renderer.domElement);

    // escena / cámara
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xf4f6f8, 3, 9);
    const camera = new THREE.PerspectiveCamera(45, W/H, 0.1, 100);
    camera.position.set(0.4, 0.6, 4.2);

    // luces
    scene.add(new THREE.HemisphereLight(0xffffff, 0x9fc8e8, 1.2));
    const dir = new THREE.DirectionalLight(0xffffff, 0.75);
    dir.position.set(2, 3, 4);
    scene.add(dir);

    // base/“sombra”
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(2.8, 64),
      new THREE.MeshStandardMaterial({ color:0xeff3f7, roughness:0.95, metalness:0, transparent:true, opacity:0.8 })
    );
    ground.rotation.x = -Math.PI/2; ground.position.y = -0.8;
    scene.add(ground);

    // ======== CUBO + ESCURRIDOR =========
    const brandBlue = 0x29648e, steel = 0xd9dee5;
    const bucket = new THREE.Group();
    const outer = new THREE.Mesh(
      new THREE.CylinderGeometry(0.75, 0.9, 0.9, 64, 1, false),
      new THREE.MeshStandardMaterial({ color:brandBlue, roughness:0.45, metalness:0.25 })
    );
    const lip = new THREE.Mesh(
      new THREE.TorusGeometry(0.48, 0.03, 16, 64),
      new THREE.MeshStandardMaterial({ color:0x2d7bb0, roughness:0.5, metalness:0.25 })
    );
    lip.rotation.x = Math.PI/2; lip.position.y = 0.45;
    const wring = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.55, 0.12, 40, 1, true),
      new THREE.MeshStandardMaterial({ color:steel, roughness:0.3, metalness:0.7, side:THREE.DoubleSide })
    );
    wring.position.y = 0.46;
    const handleArc = new THREE.Mesh(
      new THREE.TorusGeometry(0.55, 0.02, 12, 64, Math.PI),
      new THREE.MeshStandardMaterial({ color:steel, roughness:0.35, metalness:0.85 })
    );
    handleArc.rotation.z = Math.PI; handleArc.position.y = 0.25;
    bucket.add(outer, lip, wring, handleArc);
    bucket.position.set(-0.7, -0.35, 0); bucket.rotation.y = -0.25;
    scene.add(bucket);

    // ======== FREGONA =========
    const mop = new THREE.Group();
    const stick = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 1.8, 16),
      new THREE.MeshStandardMaterial({ color:0x8b5e3c, roughness:0.7 })
    );
    stick.position.y = 0.2;
    const headCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.16, 0.12, 24),
      new THREE.MeshStandardMaterial({ color:brandBlue, roughness:0.45, metalness:0.2 })
    );
    headCap.position.y = -0.75;
    const strands = new THREE.Group();
    const strandMat = new THREE.MeshStandardMaterial({ color:0xffffff, roughness:0.85, metalness:0.05 });
    for (let i=0;i<18;i++){
      const s = new THREE.Mesh(new THREE.CapsuleGeometry(0.02, 0.6, 2, 8), strandMat);
      s.position.set(Math.cos(i/18*Math.PI*2)*0.12, -1.05, Math.sin(i/18*Math.PI*2)*0.12);
      s.rotation.x = 0.25 + Math.random()*0.25;
      strands.add(s);
    }
    mop.add(stick, headCap, strands);
    mop.position.set(0.6, -0.1, 0);
    mop.rotation.z = -0.25; mop.rotation.y = 0.3;
    scene.add(mop);

    // ======== BURBUJAS EN PROFUNDIDAD (fondo inmersivo) ========
    const bubbles = new THREE.Group(); scene.add(bubbles);
    const bubbleCount = Math.round((innerWidth * innerHeight) / 15000);
    const bubbleMatBase = new THREE.MeshStandardMaterial({ color:0x9fc8e8, transparent:true, opacity:0.5, roughness:0.2, metalness:0.1 });

    for (let i=0;i<bubbleCount;i++){
      const r = 0.015 + Math.random()*0.07;
      const mat = bubbleMatBase.clone(); mat.opacity = 0.25 + Math.random()*0.5;
      const b = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 16), mat);
      b.position.set((Math.random()-0.5)*10, -2 + Math.random()*4, -2.5 + Math.random()*2.5);
      b.userData.speed = 0.004 + Math.random()*0.01;
      bubbles.add(b);
    }

    // interacciones
    let tx=0, ty=0;
    addEventListener('pointermove', e=>{
      tx = (e.clientX/innerWidth - .5) * .5;
      ty = (e.clientY/innerHeight - .5) * .35;
    }, {passive:true});

    if (window.gsap && window.ScrollTrigger){
      gsap.registerPlugin(ScrollTrigger);
      gsap.to(camera.position, {
        z: 4.8,
        scrollTrigger:{
          trigger: document.body,
          start: "top top",
          end: "bottom bottom",
          scrub: 1
        }
      });
    }

    function anim(t){
      requestAnimationFrame(anim);

      bubbles.children.forEach(s=>{
        s.position.y += s.userData.speed;
        if (s.position.y > 2) s.position.y = -2;
      });

      const k = t*0.0012;
      bucket.position.y = -0.35 + Math.sin(k)*0.02;
      mop.position.y = -0.1 + Math.cos(k*1.1)*0.02;

      camera.position.x += (tx - camera.position.x)*0.06;
      camera.position.y += (ty - camera.position.y)*0.06;

      renderer.render(scene, camera);
    }
    anim(0);

    addEventListener('resize', ()=>{
      const w2 = innerWidth, h2 = innerHeight;
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

// auto‑arranque
window.initThree && window.initThree();
