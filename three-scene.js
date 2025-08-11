// three-scene.js — escena final (plano ondulado + burbujas), robusta en móvil/desktop
window.initThree = function () {
  try {
    if (typeof THREE === 'undefined') throw new Error('THREE no cargó');

    const wrap = document.getElementById('canvas-wrap');
    if (!wrap) throw new Error('#canvas-wrap no existe');

    // Asegurar altura visible por si el CSS falla
    if ((wrap.clientHeight || 0) < 150) {
      wrap.style.display = 'block';
      wrap.style.minHeight = '320px';
      wrap.style.height = '40vh';
    }

    const W = wrap.clientWidth || innerWidth * 0.9;
    const H = wrap.clientHeight || Math.max(innerHeight * 0.4, 320);

    // Render/cámara/escena
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    wrap.innerHTML = ''; // limpia si ya había algo (del diagnóstico)
    wrap.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    camera.position.set(0, 0.2, 4.2);

    // Luces
    scene.add(new THREE.HemisphereLight(0xffffff, 0x9fc8e8, 1.2));
    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(2, 3, 4);
    scene.add(dir);

    // Plano ondulado
    const geo = new THREE.PlaneGeometry(4, 2.2, 80, 40);
    const mat = new THREE
