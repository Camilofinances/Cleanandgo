window.initThree = function() {
  console.log("initThree ejecutado");

  const wrap = document.getElementById("canvas-wrap");
  if (!wrap) {
    console.error("❌ No se encontró #canvas-wrap");
    mostrarError("3D error: #canvas-wrap no existe");
    return;
  }

  // Crear el renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(wrap.clientWidth, wrap.clientHeight);
  wrap.appendChild(renderer.domElement);

  // Crear la escena
  const scene = new THREE.Scene();

  // Cámara
  const camera = new THREE.PerspectiveCamera(50, wrap.clientWidth / wrap.clientHeight, 0.1, 1000);
  camera.position.z = 5;

  // Luz
  const light = new THREE.AmbientLight(0xffffff, 1);
  scene.add(light);

  // Cubo de prueba
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshStandardMaterial({ color: 0x29648e });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  // Animación
  function animate() {
    requestAnimationFrame(animate);
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
  }
  animate();

  console.log("✅ Escena 3D inicializada");
};

function mostrarError(msg) {
  const div = document.createElement("div");
  div.textContent = msg;
  div.style.position = "fixed";
  div.style.bottom = "10px";
  div.style.left = "10px";
  div.style.background = "red";
  div.style.color = "white";
  div.style.padding = "8px";
  div.style.zIndex = "9999";
  div.style.fontSize = "14px";
  document.body.appendChild(div);
}
