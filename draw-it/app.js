import * as THREE from "three";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/controls/OrbitControls.js";

const BONE = 0xe1d6bc;
const SIDES = ["L", "R"];
const muscles = [
  ["deltoid", "Deltoïde", "Deltoideus"], ["pectoralis", "Grand pectoral", "Pectoralis major"],
  ["trapezius", "Trapèze", "Trapezius"], ["biceps", "Biceps brachial", "Biceps brachii"],
  ["triceps", "Triceps brachial", "Triceps brachii"], ["forearm", "Fléchisseurs de l’avant-bras", "Flexores antebrachii"],
  ["rectus", "Droit de l’abdomen", "Rectus abdominis"], ["obliques", "Obliques externes", "Obliquus externus"],
  ["gluteus", "Grand fessier", "Gluteus maximus"], ["quadriceps", "Quadriceps", "Quadriceps femoris"],
  ["hamstrings", "Ischio-jambiers", "Hamstrings"], ["gastrocnemius", "Gastrocnémien", "Gastrocnemius"],
  ["tibialis", "Tibial antérieur", "Tibialis anterior"],
].map(([id, name, latin]) => ({ id, name, latin }));
const visibleMuscles = Object.fromEntries(muscles.map(({ id }) => [id, false]));

function emptyPose() {
  const sides = () => ({ L: {}, R: {} });
  return { shoulder: sides(), elbow: sides(), wrist: sides(), hip: sides(), knee: sides(), ankle: sides() };
}
function poseWithDefaults() {
  const pose = emptyPose();
  for (const side of SIDES) {
    Object.assign(pose.shoulder[side], { lift: 0, swing: 0 });
    Object.assign(pose.elbow[side], { bend: 0 });
    Object.assign(pose.wrist[side], { bend: 0 });
    Object.assign(pose.hip[side], { flex: 0 });
    Object.assign(pose.knee[side], { bend: 0 });
    Object.assign(pose.ankle[side], { bend: 0 });
  }
  return pose;
}
const pose = poseWithDefaults();
const deg = THREE.MathUtils.degToRad;

function getJoints() {
  const joints = {};
  for (const sideName of SIDES) {
    const side = sideName === "L" ? 1 : -1;
    const shoulderAngle = deg(pose.shoulder[sideName].lift);
    const swing = deg(pose.shoulder[sideName].swing);
    const elbowAngle = deg(pose.elbow[sideName].bend);
    const shoulder = new THREE.Vector3(side * .39, 1.56, 0);
    const upper = new THREE.Vector3(side * .62 * Math.cos(shoulderAngle) * Math.cos(swing), .62 * Math.sin(shoulderAngle), .62 * Math.cos(shoulderAngle) * Math.sin(swing));
    const elbow = shoulder.clone().add(upper);
    const armAngle = shoulderAngle + elbowAngle;
    const forearm = new THREE.Vector3(side * .52 * Math.cos(armAngle) * Math.cos(swing), .52 * Math.sin(armAngle), .52 * Math.cos(armAngle) * Math.sin(swing));
    const wrist = elbow.clone().add(forearm);
    const handAngle = armAngle + deg(pose.wrist[sideName].bend);
    const hand = wrist.clone().add(new THREE.Vector3(side * .22 * Math.cos(handAngle), .22 * Math.sin(handAngle), .03));
    const hip = new THREE.Vector3(side * .17, .88, 0);
    const hipAngle = deg(pose.hip[sideName].flex);
    const thigh = new THREE.Vector3(side * .045, -.61 * Math.cos(hipAngle), .61 * Math.sin(hipAngle));
    const knee = hip.clone().add(thigh);
    const shinAngle = hipAngle - deg(pose.knee[sideName].bend);
    const shin = new THREE.Vector3(side * .025, -.57 * Math.cos(shinAngle), .57 * Math.sin(shinAngle));
    const ankle = knee.clone().add(shin);
    const footAngle = deg(pose.ankle[sideName].bend);
    const toe = ankle.clone().add(new THREE.Vector3(0, .22 * Math.sin(footAngle), .22 * Math.cos(footAngle)));
    joints[sideName] = { shoulder, elbow, wrist, hand, hip, knee, ankle, toe };
  }
  return joints;
}

function mesh(parent, geometry, material, position, scale, rotation) {
  const item = new THREE.Mesh(geometry, material);
  item.position.set(...position);
  item.scale.set(...scale);
  if (rotation) item.rotation.set(...rotation);
  parent.add(item);
  return item;
}
function bone(parent, radius = 1) {
  return mesh(parent, new THREE.CylinderGeometry(.054 * radius, .07 * radius, 1, 10),
    new THREE.MeshStandardMaterial({ color: BONE, roughness: .65 }), [0, 0, 0], [1, 1, 1]);
}
function putBone(item, a, b) {
  const direction = b.clone().sub(a);
  item.position.copy(a).add(b).multiplyScalar(.5);
  item.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
  item.scale.set(1, direction.length(), 1);
}

function buildSkeleton(scene) {
  const root = new THREE.Group();
  scene.add(root);
  const ivory = new THREE.MeshStandardMaterial({ color: BONE, roughness: .64 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xc5a66a, roughness: .45, metalness: .12 });
  const shadow = new THREE.MeshStandardMaterial({ color: 0x77828a, roughness: .75 });
  const ball = new THREE.SphereGeometry(1, 16, 12);
  mesh(root, ball, ivory, [0, 2.13, 0], [.18, .23, .16]);
  mesh(root, ball, ivory, [0, 2.015, .015], [.13, .1, .13]);
  mesh(root, ball, shadow, [-.061, 2.17, .133], [.035, .04, .018]);
  mesh(root, ball, shadow, [.061, 2.17, .133], [.035, .04, .018]);
  mesh(root, ball, ivory, [0, 1.83, 0], [.09, .15, .09]);
  for (let i = 0; i < 14; i++) mesh(root, ball, ivory, [0, .94 + i * .064, .018], [.064, .041, .053]);
  mesh(root, ball, ivory, [0, 1.49, 0], [.31, .2, .18]);
  mesh(root, ball, ivory, [0, 1.23, 0], [.22, .16, .12]);
  mesh(root, ball, ivory, [0, .86, 0], [.2, .15, .13]);
  mesh(root, ball, ivory, [-.15, .89, 0], [.14, .12, .12], [0, 0, -.25]);
  mesh(root, ball, ivory, [.15, .89, 0], [.14, .12, .12], [0, 0, .25]);
  for (const side of [-1, 1]) putBone(bone(root, .65), new THREE.Vector3(0, 1.63, .005), new THREE.Vector3(side * .4, 1.57, 0));
  mesh(root, ball, ivory, [0, 1.45, .11], [.055, .27, .045]);
  for (let i = 0; i < 6; i++) for (const side of [-1, 1]) {
    const y = 1.57 - i * .065;
    const path = new THREE.CatmullRomCurve3([
      new THREE.Vector3(.025 * side, y, .1), new THREE.Vector3(.18 * side, y + .045, .11),
      new THREE.Vector3(.31 * side, y, .03), new THREE.Vector3(.28 * side, y - .045, -.075),
    ]);
    root.add(new THREE.Mesh(new THREE.TubeGeometry(path, 18, .016, 5), ivory));
  }
  const limbs = {};
  for (const side of SIDES) {
    limbs[side] = {
      upper: bone(root), forearm: bone(root), hand: bone(root, .72), femur: bone(root, 1.14),
      patella: mesh(root, ball, ivory, [0, 0, 0], [.065, .09, .045]), tibia: bone(root, .78), foot: bone(root, .8), joints: {},
    };
    for (const name of ["shoulder", "elbow", "wrist", "hip", "knee", "ankle"]) limbs[side].joints[name] = mesh(root, ball, gold, [0, 0, 0], [.061, .061, .061]);
  }
  return { limbs };
}

function buildMuscles(scene) {
  const objects = Object.fromEntries(muscles.map(({ id }) => [id, []]));
  const materials = Object.fromEntries(muscles.map(({ id }) => [id, new THREE.MeshStandardMaterial({ color: 0xc96f5a, roughness: .72, transparent: true, opacity: 0, depthWrite: false })]));
  const updates = [];
  const ball = new THREE.SphereGeometry(1, 18, 12);
  const addOval = (id, position, scale, rotation) => objects[id].push(mesh(scene, ball, materials[id], position, scale, rotation));
  const strap = (id, from, to, thickness, offset) => {
    const item = mesh(scene, ball, materials[id], [0, 0, 0], [1, 1, 1]);
    objects[id].push(item);
    updates.push((joints) => {
      const start = from(joints), end = to(joints), direction = end.clone().sub(start);
      item.position.copy(start).add(end).multiplyScalar(.5).add(offset);
      item.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
      item.scale.set(thickness, direction.length() * .59, thickness * .78);
    });
  };
  for (const sideName of SIDES) {
    const side = sideName === "L" ? 1 : -1;
    const point = (name) => (joints) => joints[sideName][name];
    addOval("deltoid", [side * .46, 1.51, .035], [.13, .15, .135]);
    addOval("pectoralis", [side * .155, 1.55, .156], [.17, .105, .064], [0, 0, side * -.17]);
    addOval("trapezius", [side * .15, 1.68, -.09], [.13, .17, .055], [0, 0, side * .42]);
    strap("biceps", point("shoulder"), point("elbow"), .085, new THREE.Vector3(0, .05, .105));
    strap("triceps", point("shoulder"), point("elbow"), .088, new THREE.Vector3(0, .035, -.095));
    strap("forearm", point("elbow"), point("wrist"), .072, new THREE.Vector3(0, .015, .07));
    addOval("rectus", [side * .075, 1.27, .132], [.062, .17, .045]);
    addOval("obliques", [side * .225, 1.27, .09], [.06, .15, .045], [0, 0, side * -.35]);
    addOval("gluteus", [side * .14, .86, -.105], [.12, .13, .065], [0, 0, side * -.15]);
    strap("quadriceps", point("hip"), point("knee"), .13, new THREE.Vector3(0, .05, .105));
    strap("hamstrings", point("hip"), point("knee"), .125, new THREE.Vector3(0, .035, -.095));
    strap("gastrocnemius", point("knee"), point("ankle"), .105, new THREE.Vector3(0, .015, -.075));
    strap("tibialis", point("knee"), point("ankle"), .057, new THREE.Vector3(0, .025, .07));
  }
  return { objects, materials, updates };
}

function makeView(host, hero = false) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 60);
  camera.position.set(hero ? .25 : 3.35, hero ? 2 : 2.25, hero ? 5.4 : 4.9);
  camera.lookAt(0, 1.12, 0);
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  host.replaceChildren(renderer.domElement);
  scene.add(new THREE.HemisphereLight(0xc4d7e0, 0x101a21, 2.3));
  const key = new THREE.DirectionalLight(0xffe1ad, 3.5); key.position.set(3, 5, 5); scene.add(key);
  const fill = new THREE.DirectionalLight(0x91bac9, 2.1); fill.position.set(-4, 2, -2); scene.add(fill);
  const rim = new THREE.PointLight(0xc5a66a, 65, 7); rim.position.set(-2.3, 2.5, 2); scene.add(rim);
  const grid = new THREE.GridHelper(8, 24, 0x435665, 0x293d4a); grid.position.y = -.015; grid.material.transparent = true; grid.material.opacity = .28; scene.add(grid);
  const skeleton = buildSkeleton(scene), muscleModel = buildMuscles(scene);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1.16, 0); controls.enableDamping = true; controls.dampingFactor = .07;
  controls.minDistance = 2.55; controls.maxDistance = 8; controls.maxPolarAngle = Math.PI * .94; controls.minPolarAngle = Math.PI * .06;
  controls.enablePan = !hero; controls.autoRotate = hero; controls.autoRotateSpeed = .42;
  let cameraFit;
  const observer = new ResizeObserver(([entry]) => {
    const { width, height } = entry.contentRect;
    if (width && height) {
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      const narrow = width < 520;
      if (cameraFit !== narrow) {
        cameraFit = narrow;
        camera.position.set(hero ? .25 : narrow ? 4.1 : 3.35, hero ? 2 : narrow ? 2.35 : 2.25, hero ? narrow ? 7.2 : 5.4 : narrow ? 6.5 : 4.9);
        camera.lookAt(0, 1.16, 0);
      }
      camera.updateProjectionMatrix();
    }
  });
  observer.observe(host);
  let frame;
  function animate() {
    frame = requestAnimationFrame(animate);
    const joints = getJoints();
    for (const side of SIDES) {
      const p = joints[side], l = skeleton.limbs[side];
      putBone(l.upper, p.shoulder, p.elbow); putBone(l.forearm, p.elbow, p.wrist); putBone(l.hand, p.wrist, p.hand);
      putBone(l.femur, p.hip, p.knee); putBone(l.tibia, p.knee, p.ankle); putBone(l.foot, p.ankle, p.toe);
      l.patella.position.copy(p.knee).add(new THREE.Vector3(0, 0, .052));
      for (const name of Object.keys(l.joints)) l.joints[name].position.copy(p[name]);
    }
    muscleModel.updates.forEach((update) => update(joints));
    for (const [index, { id }] of muscles.entries()) {
      const material = muscleModel.materials[id];
      if (hero) material.opacity = THREE.MathUtils.clamp((performance.now() - startAt - index * 240) / 650, 0, .9);
      else material.opacity = visibleMuscles[id] ? .9 : 0;
      material.depthWrite = material.opacity > .89;
    }
    controls.update(); renderer.render(scene, camera);
  }
  const startAt = performance.now(); animate();
  return { renderer, controls, dispose() { cancelAnimationFrame(frame); observer.disconnect(); controls.dispose(); renderer.dispose(); } };
}

function init() {
  const heroHost = document.querySelector("#hero-view"), studioHost = document.querySelector("#studio-view");
  let hero, studio;
  try { hero = makeView(heroHost, true); studio = makeView(studioHost); }
  catch (error) {
    console.error("Impossible d’initialiser la scène Three.js", error);
    for (const host of [heroHost, studioHost]) host.innerHTML = "<p class='webgl-error'>La scène 3D n’a pas pu démarrer. Vérifie WebGL et la connexion à Three.js.</p>";
    return;
  }

  const list = document.querySelector("#muscle-list"), status = document.querySelector("#muscle-status");
  const jointSelect = document.querySelector("#joint-select"), sliders = document.querySelector("#joint-sliders");
  for (const muscle of muscles) {
    const button = document.createElement("button"); button.className = "muscle-toggle"; button.type = "button";
    button.dataset.muscle = muscle.id; button.setAttribute("aria-pressed", "false");
    button.setAttribute("aria-label", `${muscle.name}, ${muscle.latin}`);
    button.innerHTML = `<span class="muscle-swatch" aria-hidden="true"></span><span class="muscle-name">${muscle.name}</span><span class="muscle-latin">${muscle.latin}</span>`;
    button.addEventListener("click", () => { visibleMuscles[muscle.id] = !visibleMuscles[muscle.id]; button.setAttribute("aria-pressed", String(visibleMuscles[muscle.id])); updateStatus(); });
    list.append(button);
  }
  function updateStatus() {
    const count = Object.values(visibleMuscles).filter(Boolean).length;
    status.textContent = `SQUELETTE · ${count} GROUPE${count === 1 ? "" : "S"} MUSCULAIRE${count === 1 ? "" : "S"}`;
    document.querySelector("#toggle-all-muscles").textContent = count === muscles.length ? "Tout masquer" : "Tout afficher";
  }
  const sliderSpec = {
    shoulder: [["lift", "Élévation", -100, 130], ["swing", "Rotation avant / arrière", -90, 90]],
    elbow: [["bend", "Flexion", 0, 145]], wrist: [["bend", "Flexion", -75, 75]],
    hip: [["flex", "Flexion", -40, 120]], knee: [["bend", "Flexion", 0, 140]], ankle: [["bend", "Flexion", -30, 45]],
  };
  function drawSliders() {
    const [group, side] = jointSelect.value.split("-"); sliders.replaceChildren();
    for (const [key, label, min, max] of sliderSpec[group]) {
      const row = document.createElement("div"); row.className = "slider-row";
      const heading = document.createElement("label"); heading.className = "slider-heading"; heading.htmlFor = `angle-${key}`;
      heading.innerHTML = `<span>${label}</span><span class="slider-value">${pose[group][side][key]}°</span>`;
      const input = document.createElement("input"); input.id = `angle-${key}`; input.type = "range"; input.min = min; input.max = max; input.value = pose[group][side][key];
      input.setAttribute("aria-label", `${label}, côté ${side === "L" ? "gauche" : "droit"}`);
      input.addEventListener("input", () => { pose[group][side][key] = Number(input.value); heading.lastElementChild.textContent = `${input.value}°`; });
      row.append(heading, input); sliders.append(row);
    }
  }
  jointSelect.addEventListener("change", drawSliders); drawSliders();

  function applyPreset(name) {
    const next = poseWithDefaults();
    if (name === "relaxed") { next.shoulder.L.lift = -32; next.shoulder.R.lift = -32; }
    if (name === "stride") {
      next.shoulder.L.lift = 26; next.shoulder.R.lift = -26; next.elbow.L.bend = 72; next.elbow.R.bend = 72;
      next.hip.L.flex = 34; next.hip.R.flex = -24; next.knee.L.bend = 28; next.knee.R.bend = 52;
    }
    if (name === "sit") {
      for (const side of SIDES) { next.shoulder[side].lift = 8; next.elbow[side].bend = 78; next.hip[side].flex = 82; next.knee[side].bend = 88; next.ankle[side].bend = -10; }
    }
    for (const group of Object.keys(pose)) for (const side of SIDES) Object.assign(pose[group][side], next[group][side]);
    document.querySelectorAll("[data-pose]").forEach((button) => button.classList.toggle("is-active", button.dataset.pose === name));
    drawSliders();
  }
  document.querySelectorAll("[data-pose]").forEach((button) => button.addEventListener("click", () => applyPreset(button.dataset.pose)));
  document.querySelector("#reset-pose").addEventListener("click", () => { applyPreset("t-pose"); studio.controls.reset(); });
  document.querySelector("#toggle-all-muscles").addEventListener("click", () => {
    const show = Object.values(visibleMuscles).some((value) => !value);
    for (const { id } of muscles) { visibleMuscles[id] = show; list.querySelector(`[data-muscle="${id}"]`).setAttribute("aria-pressed", String(show)); }
    updateStatus();
  });
  document.querySelector("#capture-pose").addEventListener("click", () => {
    const message = document.querySelector("#capture-message");
    studio.renderer.domElement.toBlob((blob) => {
      if (!blob) { message.textContent = "Capture indisponible dans ce navigateur."; }
      else {
        const url = URL.createObjectURL(blob), link = document.createElement("a");
        link.href = url; link.download = "draw-it-pose.png"; link.click(); URL.revokeObjectURL(url);
        message.textContent = "Pose capturée · draw-it-pose.png";
      }
      message.classList.add("is-visible"); window.setTimeout(() => message.classList.remove("is-visible"), 2400);
    }, "image/png");
  });
  updateStatus();
  window.addEventListener("beforeunload", () => { hero.dispose(); studio.dispose(); }, { once: true });
}
init();
