// Burbuja realista, completamente transparente sobre fondo blanco.
// ~10 activas siempre, moviéndose por TODA la pantalla (entran/salen por bordes).
window.initBubbles = function(){
  if (typeof THREE === 'undefined') return;
  const host = document.getElementById('bg3d');
  if (!host) return;

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
  renderer.setPixelRatio(Math.min(devicePixelRatio||1, 2));
  host.innerHTML = '';
  host.appendChild(renderer.domElement);

  // Escena + cámara ortográfica (mapea pantalla completa)
  const scene = new THREE.Scene();
  let camera, aspect;

  function setupCamera(){
    aspect = innerWidth / innerHeight;
    camera = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, -10, 10);
    camera.position.set(0,0,5);
  }
  setupCamera();

  // Luz suave; no muy fuerte para no lavar el efecto
  scene.add(new THREE.HemisphereLight(0xffffff, 0xf3f6fa, 1.0));
  const dir = new THREE.DirectionalLight(0xffffff, 0.4);
  dir.position.set(2,3,4);
  scene.add(dir);

  // Material físico “vidrio claro”: transparente, con reflejo suave
  const matBase = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,          // blanco (sobre fondo blanco será sutil)
    metalness: 0.0,
    roughness: 0.08,
    transmission: 1.0,        // máxima translucidez
    transparent: true,
    opacity: 0.3,             // muy transparente
    thickness: 0.5,
    clearcoat: 0.8,
    clearcoatRoughness: 0.15,
    attenuationColor: new THREE.Color(0xffffff),
    attenuationDistance: 1.2
  });
  const geo = new THREE.SphereGeometry(1, 32, 32);

  // Pool de burbujas
  const MAX_POOL = 40, TARGET = 10;
  const pool = [];
  const active = new Set();

  for (let i=0;i<MAX_POOL;i++){
    const m = new THREE.Mesh(geo, matBase.clone());
    m.visible = false;
    m.userData = { vx:0, vy:0, life:0, maxLife:0, base:1, wobble:Math.random()*Math.PI*2 };
    scene.add(m);
    pool.push(m);
  }

  function spawn(){
    const b = pool.find(x=>!x.visible);
    if (!b) return;

    const side = Math.floor(Math.random()*4);
    const pad = 0.12;
    let x=0,y=0,vx=0,vy=0;

    if (side===0){ // top -> baja
      x = THREE.MathUtils.randFloat(-aspect, aspect);
      y = 1+pad; vx = THREE.MathUtils.randFloatSpread(0.25); vy = THREE.MathUtils.randFloat(-0.35,-0.15);
    } else if (side===2){ // bottom -> sube
      x = THREE.MathUtils.randFloat(-aspect, aspect);
      y = -1-pad; vx = THREE.MathUtils.randFloatSpread(0.25); vy = THREE.MathUtils.randFloat(0.15,0.35);
    } else if (side===1){ // right -> izquierda
      x = aspect+pad; y = THREE.MathUtils.randFloat(-1,1);
      vx = THREE.MathUtils.randFloat(-0.35,-0.15); vy = THREE.MathUtils.randFloatSpread(0.25);
    } else { // left -> derecha
      x = -aspect-pad; y = THREE.MathUtils.randFloat(-1,1);
      vx = THREE.MathUtils.randFloat(0.15,0.35); vy = THREE.MathUtils.randFloatSpread(0.25);
    }

    b.position.set(x,y,THREE.MathUtils.randFloat(-0.3,0.3));
    const d = b.userData;
    d.vx=vx; d.vy=vy;
    d.base = THREE.MathUtils.randFloat(0.06,0.18); // radio relativo a pantalla
    b.scale.setScalar(d.base);
    d.life=0; d.maxLife=THREE.MathUtils.randFloat(6,12);
    b.material.opacity = 0.3; // transparente de base
    b.visible = true; active.add(b);
  }

  function keep(){
    while(active.size < TARGET) spawn();
  }

  const clock = new THREE.Clock();
  function loop(){
    requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.033);

    active.forEach(b=>{
      const d = b.userData;
      b.position.x += d.vx * dt;
      b.position.y += d.vy * dt;

      // respiración sutil
      d.wobble += dt*2.0;
      const s = d.base * (1 + Math.sin(d.wobble)*0.05);
      b.scale.setScalar(s);

      d.life += dt;
      const t = d.life/d.maxLife;
      const fade = t<0.08 ? t/0.08 : (t>0.9 ? (1-t)/0.1 : 1);
      b.material.opacity = 0.3 * Math.max(0, Math.min(1, fade));

      const outX = Math.abs(b.position.x) > (aspect+0.25);
      const outY = Math.abs(b.position.y) > (1+0.25);
      if (d.life>=d.maxLife || outX || outY){
        b.visible=false; active.delete(b);
      }
    });

    keep();
    renderer.render(scene, camera);
  }

  function resize(){
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w,h);
    aspect = w/h;
    camera.left = -aspect; camera.right = aspect; camera.top = 1; camera.bottom = -1;
    camera.updateProjectionMatrix();
  }

  addEventListener('resize', resize, { passive:true });
  resize();
  keep();
  loop();
};
