/**
 * Floral Delight - Genuine 3D Flower Bouquet Engine
 * Powered by Three.js (WebGL)
 *
 * Implements a true 3D botanical bouquet featuring:
 * - Handcrafted 3D roses with multi-tiered curved petal whorls
 * - Delicate filler florets and sage green foliage leaves
 * - 3D origami wrapping paper sleeve and tied satin ribbon
 * - Realistic 3D falling kinematics with perspective expansion and landing bounce
 * - Detached 3D petals swirling in full 3D space
 * - Interactive 360° drag rotation and mouse parallax inspection
 */

(function () {
  'use strict';

  // Ensure Three.js is loaded
  if (typeof THREE === 'undefined') {
    console.error('Three.js library is required for the 3D bouquet experience.');
    return;
  }

  let scene, camera, renderer;
  let bouquetGroup, groundShadowMesh;
  let floatingPetals = [];
  let isAnimating = true;
  let animationTime = 0;
  let containerEl = null;

  // Kinematic state for falling animation
  const FALL_DURATION = 1.9; // seconds
  let fallStartTime = null;
  let isLanded = false;

  // Interactive rotation state (drag + mouse parallax)
  let isPointerDown = false;
  let pointerStart = { x: 0, y: 0 };
  let manualRotation = { x: 0.12, y: -0.15 };
  let targetManualRotation = { x: 0.12, y: -0.15 };
  let mouseParallax = { x: 0, y: 0 };

  /* ==========================================================================
     1. Botanical Palette & Shared Materials
     ========================================================================== */
  const PALETTE = {
    dustyRose: 0xB95D70,
    velvetWine: 0x9E3B4E,
    blushPink: 0xE8B5B4,
    peachBlush: 0xF5C2B2,
    creamIvory: 0xFAF2EF,
    sageLeaf: 0x7E9177,
    sageDark: 0x66785F,
    stemGreen: 0x4B6841,
    wrapPaper: 0xF6EDE9,
    wrapLining: 0xE8C5C4,
    ribbonSatin: 0xB9828C,
    pollenGold: 0xF0C05A
  };

  /* ==========================================================================
     2. Parametric 3D Geometries (Petals & Leaves)
     ========================================================================== */

  /**
   * Generates a curved, organic 3D rose petal with cup depth and reflex curl.
   */
  function createCurvedPetalGeometry(width, height, cup, curl, segmentsX = 6, segmentsY = 8) {
    const geom = new THREE.BufferGeometry();
    const positions = [];
    const uvs = [];
    const indices = [];

    for (let j = 0; j <= segmentsY; j++) {
      const v = j / segmentsY;
      const widthFactor = Math.sin(Math.pow(v, 0.72) * Math.PI);
      const halfW = (width / 2) * widthFactor;

      for (let i = 0; i <= segmentsX; i++) {
        const u = (i / segmentsX) * 2 - 1; // -1 to 1
        const x = u * halfW;
        const y = v * height;
        const zCup = (1 - u * u) * Math.sin(v * Math.PI) * cup;
        const zCurl = -Math.pow(v, 2.3) * curl;

        positions.push(x, y, zCup + zCurl);
        uvs.push(i / segmentsX, v);
      }
    }

    for (let j = 0; j < segmentsY; j++) {
      for (let i = 0; i < segmentsX; i++) {
        const a = j * (segmentsX + 1) + i;
        const b = (j + 1) * (segmentsX + 1) + i;
        const c = (j + 1) * (segmentsX + 1) + (i + 1);
        const d = j * (segmentsX + 1) + (i + 1);
        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    return geom;
  }

  /**
   * Generates an arched botanical leaf with center crease.
   */
  function createLeafGeometry(width, length, arch = 0.22) {
    const geom = new THREE.BufferGeometry();
    const positions = [];
    const uvs = [];
    const indices = [];
    const segsY = 7;

    for (let j = 0; j <= segsY; j++) {
      const v = j / segsY;
      const w = Math.sin(v * Math.PI) * (width / 2);
      const y = v * length;
      const zArch = -Math.sin(v * Math.PI * 0.75) * (length * arch);

      positions.push(-w, y, zArch - Math.abs(w) * 0.25);
      positions.push(0, y, zArch);
      positions.push(w, y, zArch - Math.abs(w) * 0.25);
      uvs.push(0, v, 0.5, v, 1, v);
    }

    for (let j = 0; j < segsY; j++) {
      const r1 = j * 3;
      const r2 = (j + 1) * 3;
      indices.push(r1, r2, r2 + 1);
      indices.push(r1, r2 + 1, r1 + 1);
      indices.push(r1 + 1, r2 + 1, r2 + 2);
      indices.push(r1 + 1, r2 + 2, r1 + 2);
    }

    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    return geom;
  }

  /* ==========================================================================
     3. 3D Rose Blossom Builder
     ========================================================================== */
  function create3DRose(colorHex, scale = 1.0) {
    const roseGroup = new THREE.Group();
    const petalMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.46,
      metalness: 0.04,
      side: THREE.DoubleSide
    });

    // Concentric whorl layers (Center bud -> Unfurling -> Reflexed outer)
    const whorls = [
      { count: 3, radius: 0.08, w: 0.44, h: 0.85, cup: 0.35, curl: -0.04, tilt: 0.18, y: 0.0 },
      { count: 4, radius: 0.16, w: 0.65, h: 1.05, cup: 0.40, curl: 0.12, tilt: 0.38, y: -0.05 },
      { count: 5, radius: 0.28, w: 0.85, h: 1.25, cup: 0.45, curl: 0.28, tilt: 0.65, y: -0.12 },
      { count: 7, radius: 0.42, w: 1.05, h: 1.35, cup: 0.40, curl: 0.48, tilt: 0.95, y: -0.22 },
      { count: 8, radius: 0.58, w: 1.25, h: 1.45, cup: 0.35, curl: 0.65, tilt: 1.25, y: -0.32 }
    ];

    whorls.forEach((whorl, wIdx) => {
      const geom = createCurvedPetalGeometry(whorl.w, whorl.h, whorl.cup, whorl.curl);
      for (let i = 0; i < whorl.count; i++) {
        const angle = (i * (Math.PI * 2 / whorl.count)) + (wIdx * 2.39996);
        const petal = new THREE.Mesh(geom, petalMat);
        petal.position.set(
          Math.cos(angle) * whorl.radius,
          whorl.y,
          Math.sin(angle) * whorl.radius
        );
        petal.rotation.y = -angle + Math.PI / 2;
        petal.rotation.x = whorl.tilt;
        petal.castShadow = true;
        petal.receiveShadow = true;
        roseGroup.add(petal);
      }
    });

    // Calyx & 5 Lanceolate Green Sepals
    const sepalMat = new THREE.MeshStandardMaterial({
      color: PALETTE.sageLeaf,
      roughness: 0.6,
      side: THREE.DoubleSide
    });
    const sepalGeom = createCurvedPetalGeometry(0.32, 0.75, 0.18, 0.4);
    for (let s = 0; s < 5; s++) {
      const sAngle = s * (Math.PI * 2 / 5);
      const sepal = new THREE.Mesh(sepalGeom, sepalMat);
      sepal.position.set(Math.cos(sAngle) * 0.42, -0.38, Math.sin(sAngle) * 0.42);
      sepal.rotation.y = -sAngle + Math.PI / 2;
      sepal.rotation.x = 1.65;
      roseGroup.add(sepal);
    }

    roseGroup.scale.setScalar(scale);
    return roseGroup;
  }

  /* ==========================================================================
     4. 3D Filler Florets (Baby's Breath / Star Jasmine)
     ========================================================================== */
  function create3DFillerBloom(colorHex = PALETTE.creamIvory) {
    const floret = new THREE.Group();
    const floretMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.4,
      side: THREE.DoubleSide
    });
    const pGeom = createCurvedPetalGeometry(0.24, 0.45, 0.12, 0.15, 4, 6);

    for (let p = 0; p < 5; p++) {
      const angle = p * (Math.PI * 2 / 5);
      const petal = new THREE.Mesh(pGeom, floretMat);
      petal.position.set(Math.cos(angle) * 0.08, 0, Math.sin(angle) * 0.08);
      petal.rotation.y = -angle + Math.PI / 2;
      petal.rotation.x = 0.9;
      floret.add(petal);
    }

    // Golden pollen center
    const centerGeom = new THREE.SphereGeometry(0.09, 8, 8);
    const centerMat = new THREE.MeshStandardMaterial({
      color: PALETTE.pollenGold,
      roughness: 0.3
    });
    const center = new THREE.Mesh(centerGeom, centerMat);
    center.position.y = 0.06;
    floret.add(center);

    return floret;
  }

  /* ==========================================================================
     5. 3D Origami Wrapping Sleeve & Satin Ribbon
     ========================================================================== */
  function buildBouquetPackaging() {
    const packGroup = new THREE.Group();

    // Outer origami wrap cone
    const coneGeom = new THREE.CylinderGeometry(2.25, 0.65, 4.3, 24, 4, true);
    const pos = coneGeom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const angle = Math.atan2(z, x);
      const foldVariation = 1 + 0.09 * Math.sin(angle * 3.5);
      pos.setX(i, x * foldVariation);
      pos.setZ(i, z * foldVariation);
    }
    coneGeom.computeVertexNormals();

    const outerPaperMat = new THREE.MeshStandardMaterial({
      color: PALETTE.wrapPaper,
      roughness: 0.88,
      side: THREE.DoubleSide
    });
    const coneMesh = new THREE.Mesh(coneGeom, outerPaperMat);
    coneMesh.position.y = -1.95;
    coneMesh.castShadow = true;
    packGroup.add(coneMesh);

    // Inner soft blush collar lining
    const collarGeom = new THREE.CylinderGeometry(2.35, 1.8, 1.3, 24, 2, true);
    const innerPaperMat = new THREE.MeshStandardMaterial({
      color: PALETTE.wrapLining,
      roughness: 0.82,
      side: THREE.DoubleSide
    });
    const collarMesh = new THREE.Mesh(collarGeom, innerPaperMat);
    collarMesh.position.y = -0.55;
    packGroup.add(collarMesh);

    // Satin Ribbon around the waist
    const ribbonMat = new THREE.MeshStandardMaterial({
      color: PALETTE.ribbonSatin,
      roughness: 0.28,
      metalness: 0.12,
      side: THREE.DoubleSide
    });

    // Ribbon Knot
    const knotGeom = new THREE.SphereGeometry(0.26, 16, 12);
    const knot = new THREE.Mesh(knotGeom, ribbonMat);
    knot.scale.set(1.2, 0.9, 0.7);
    knot.position.set(0, -1.2, 1.25);
    packGroup.add(knot);

    // Left Bow Loop
    const loopGeom = new THREE.TorusGeometry(0.46, 0.09, 12, 24, Math.PI * 1.55);
    const leftLoop = new THREE.Mesh(loopGeom, ribbonMat);
    leftLoop.position.set(-0.52, -1.1, 1.2);
    leftLoop.rotation.set(0.2, 0.4, 0.6);
    packGroup.add(leftLoop);

    // Right Bow Loop
    const rightLoop = new THREE.Mesh(loopGeom, ribbonMat);
    rightLoop.position.set(0.52, -1.1, 1.2);
    rightLoop.rotation.set(0.2, -0.4, -0.6);
    packGroup.add(rightLoop);

    // Cascading Ribbon Tails
    function createRibbonTail(startX, dirX) {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(startX, -1.25, 1.2),
        new THREE.Vector3(startX + dirX * 0.25, -2.1, 1.15),
        new THREE.Vector3(startX + dirX * 0.45, -3.1, 1.05)
      ]);
      const tubeGeom = new THREE.TubeGeometry(curve, 16, 0.07, 8, false);
      return new THREE.Mesh(tubeGeom, ribbonMat);
    }
    packGroup.add(createRibbonTail(-0.15, -0.6));
    packGroup.add(createRibbonTail(0.15, 0.6));

    return packGroup;
  }

  /* ==========================================================================
     6. Assemble Master 3D Bouquet
     ========================================================================== */
  function buildMasterBouquet() {
    bouquetGroup = new THREE.Group();

    // Primary Rose Bloom Configurations (Lush organic 3D dome)
    const roseArrangements = [
      // Central Top Crown Rose
      { color: PALETTE.dustyRose, x: 0.0, y: 1.25, z: 0.2, rotX: 0.2, rotY: 0.0, rotZ: 0.0, scale: 1.15 },
      // Ring Tier (Surrounding blooms)
      { color: PALETTE.blushPink, x: -0.92, y: 0.85, z: 0.45, rotX: 0.42, rotY: -0.6, rotZ: 0.25, scale: 1.0 },
      { color: PALETTE.creamIvory, x: 0.92, y: 0.85, z: 0.45, rotX: 0.42, rotY: 0.6, rotZ: -0.25, scale: 1.0 },
      { color: PALETTE.velvetWine, x: 0.0, y: 0.72, z: 1.05, rotX: 0.58, rotY: 0.0, rotZ: 0.0, scale: 1.05 },
      { color: PALETTE.peachBlush, x: 0.0, y: 0.95, z: -0.65, rotX: -0.32, rotY: 0.0, rotZ: 0.0, scale: 0.95 },
      // Lower Facing Blooms
      { color: PALETTE.blushPink, x: -1.28, y: 0.25, z: 0.68, rotX: 0.62, rotY: -0.78, rotZ: 0.45, scale: 0.95 },
      { color: PALETTE.dustyRose, x: 1.28, y: 0.25, z: 0.68, rotX: 0.62, rotY: 0.78, rotZ: -0.45, scale: 0.95 },
      { color: PALETTE.creamIvory, x: 0.0, y: 0.15, z: 1.35, rotX: 0.82, rotY: 0.0, rotZ: 0.0, scale: 0.96 }
    ];

    roseArrangements.forEach(cfg => {
      const rose = create3DRose(cfg.color, cfg.scale);
      rose.position.set(cfg.x, cfg.y, cfg.z);
      rose.rotation.set(cfg.rotX, cfg.rotY, cfg.rotZ);
      bouquetGroup.add(rose);
    });

    // Filler Blooms nestled between roses
    const fillerPositions = [
      { x: -0.55, y: 1.05, z: 0.85, rotX: 0.3, rotY: -0.3, scale: 0.9 },
      { x: 0.55, y: 1.05, z: 0.85, rotX: 0.3, rotY: 0.3, scale: 0.9 },
      { x: -0.85, y: 0.45, z: 1.15, rotX: 0.5, rotY: -0.5, scale: 0.85 },
      { x: 0.85, y: 0.45, z: 1.15, rotX: 0.5, rotY: 0.5, scale: 0.85 },
      { x: -1.05, y: 0.95, z: -0.15, rotX: 0.2, rotY: -0.8, scale: 0.8 },
      { x: 1.05, y: 0.95, z: -0.15, rotX: 0.2, rotY: 0.8, scale: 0.8 },
      { x: -0.45, y: 0.2, z: 1.45, rotX: 0.7, rotY: -0.2, scale: 0.85 },
      { x: 0.45, y: 0.2, z: 1.45, rotX: 0.7, rotY: 0.2, scale: 0.85 }
    ];

    fillerPositions.forEach(fp => {
      const filler = create3DFillerBloom(Math.random() > 0.4 ? PALETTE.creamIvory : PALETTE.peachBlush);
      filler.position.set(fp.x, fp.y, fp.z);
      filler.rotation.set(fp.rotX, fp.rotY, 0);
      filler.scale.setScalar(fp.scale);
      bouquetGroup.add(filler);
    });

    // Sage Green Foliage Leaves framing the perimeter
    const leafMat = new THREE.MeshStandardMaterial({
      color: PALETTE.sageLeaf,
      roughness: 0.55,
      side: THREE.DoubleSide
    });
    const leafGeom = createLeafGeometry(0.55, 1.55);

    for (let l = 0; l < 14; l++) {
      const angle = l * (Math.PI * 2 / 14);
      const leaf = new THREE.Mesh(leafGeom, leafMat);
      const radius = 1.62 + Math.sin(l * 2) * 0.2;
      leaf.position.set(
        Math.cos(angle) * radius,
        0.12 + Math.sin(l * 1.5) * 0.32,
        Math.sin(angle) * radius
      );
      leaf.rotation.y = -angle + Math.PI / 2;
      leaf.rotation.x = 1.25 + Math.cos(l) * 0.28;
      leaf.rotation.z = (Math.random() - 0.5) * 0.25;
      bouquetGroup.add(leaf);
    }

    // Stem Bundle extending downward
    const stemMat = new THREE.MeshStandardMaterial({ color: PALETTE.stemGreen, roughness: 0.7 });
    for (let s = 0; s < 10; s++) {
      const sAngle = s * (Math.PI * 2 / 10);
      const stemGeom = new THREE.CylinderGeometry(0.06, 0.05, 3.8, 8);
      const stem = new THREE.Mesh(stemGeom, stemMat);
      stem.position.set(Math.cos(sAngle) * 0.24, -1.8, Math.sin(sAngle) * 0.24);
      stem.rotation.z = (Math.random() - 0.5) * 0.08;
      bouquetGroup.add(stem);
    }

    // Add Origami Wrap and Satin Ribbon
    bouquetGroup.add(buildBouquetPackaging());

    // Ground Shadow (Circular soft shadow texture)
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sCtx = shadowCanvas.getContext('2d');
    const grad = sCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(69, 59, 59, 0.55)');
    grad.addColorStop(0.35, 'rgba(69, 59, 59, 0.28)');
    grad.addColorStop(0.7, 'rgba(69, 59, 59, 0.08)');
    grad.addColorStop(1, 'rgba(69, 59, 59, 0)');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 128, 128);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowGeom = new THREE.PlaneGeometry(6.2, 6.2);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.0,
      depthWrite: false
    });
    groundShadowMesh = new THREE.Mesh(shadowGeom, shadowMat);
    groundShadowMesh.rotation.x = -Math.PI / 2;
    groundShadowMesh.position.set(0, -4.1, 0);
    scene.add(groundShadowMesh);

    scene.add(bouquetGroup);
  }

  /* ==========================================================================
     7. Detached 3D Flying Petals
     ========================================================================== */
  function create3DFloatingPetals(count = 38) {
    const petalColors = [
      PALETTE.blushPink,
      PALETTE.dustyRose,
      PALETTE.peachBlush,
      PALETTE.creamIvory,
      PALETTE.sageLeaf
    ];

    floatingPetals = [];

    for (let i = 0; i < count; i++) {
      const color = petalColors[i % petalColors.length];
      const pMat = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.48,
        metalness: 0.04,
        side: THREE.DoubleSide
      });

      const geom = createCurvedPetalGeometry(0.55, 0.85, 0.28, 0.32, 5, 7);
      const mesh = new THREE.Mesh(geom, pMat);

      // Start clustered near the bouquet top
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.5 + Math.random() * 1.8;
      const startX = Math.cos(angle) * radius;
      const startY = 0.5 + Math.random() * 2.5;
      const startZ = Math.sin(angle) * radius + 0.4;

      mesh.position.set(startX, startY, startZ);
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      mesh.scale.setScalar(0.75 + Math.random() * 0.45);
      mesh.visible = false;

      scene.add(mesh);

      // Physics dynamics
      const outSpeed = 1.8 + Math.random() * 3.4;
      const elevationAngle = (Math.random() - 0.2) * 0.9;

      floatingPetals.push({
        mesh: mesh,
        detached: false,
        detachDelay: 0.25 + Math.random() * 0.95, // Staggered detachment as bouquet falls
        vel: new THREE.Vector3(
          Math.cos(angle) * outSpeed,
          Math.sin(elevationAngle) * outSpeed,
          Math.sin(angle) * outSpeed + (Math.random() - 0.5) * 1.5
        ),
        angVel: new THREE.Vector3(
          (Math.random() - 0.5) * 4.0,
          (Math.random() - 0.5) * 4.0,
          (Math.random() - 0.5) * 4.0
        ),
        driftPhase: Math.random() * Math.PI * 2,
        driftSpeed: 1.2 + Math.random() * 1.8,
        floatBaseY: (Math.random() - 0.5) * 4.0
      });
    }
  }

  /* ==========================================================================
     8. Falling Kinematics & Landing Sequence
     ========================================================================== */
  function startFallingSequence() {
    fallStartTime = performance.now();
    isLanded = false;

    // Initial state: high above screen and slightly tilted back
    bouquetGroup.position.set(0, 13.5, -5.5);
    bouquetGroup.rotation.set(-0.65, 0.35, -0.15);

    if (groundShadowMesh) {
      groundShadowMesh.material.opacity = 0;
      groundShadowMesh.scale.setScalar(0.3);
    }

    // Reset detached petals
    floatingPetals.forEach(p => {
      p.detached = false;
      p.mesh.visible = false;
      p.mesh.position.set(
        bouquetGroup.position.x + (Math.random() - 0.5) * 1.5,
        bouquetGroup.position.y + (Math.random() - 0.5) * 1.5,
        bouquetGroup.position.z + (Math.random() - 0.5) * 1.5
      );
    });
  }

  function updateFallingKinematics(now) {
    if (!fallStartTime) return;

    const elapsed = (now - fallStartTime) / 1000; // in seconds
    const progress = Math.min(1.0, elapsed / FALL_DURATION);

    // Easing: Cubic Bezier ease-out with gentle bounce overshoot
    // Fast initial descent -> deceleration -> elastic landing
    if (progress < 1.0) {
      // Custom ease-out cubic
      const t = 1 - Math.pow(1 - progress, 3);

      // Y position: from 13.5 to 0
      const startY = 13.5;
      const targetY = 0;
      let curY = startY * (1 - t) + targetY * t;

      // Gentle elastic bounce as it touches down (progress > 0.75)
      if (progress > 0.75) {
        const bounceT = (progress - 0.75) / 0.25; // 0 to 1
        const bounceAmp = 0.35 * Math.exp(-bounceT * 3.5) * Math.sin(bounceT * Math.PI * 2.5);
        curY += bounceAmp;
      }

      // Z position: sweeps from -5.5 (distance) forward to 0 (focal point)
      const startZ = -5.5;
      const curZ = startZ * (1 - t);

      bouquetGroup.position.y = curY;
      bouquetGroup.position.z = curZ;

      // Natural orientation rotation during descent
      const startRotX = -0.65;
      const startRotY = 0.35;
      const startRotZ = -0.15;

      bouquetGroup.rotation.x = startRotX * (1 - t) + targetManualRotation.x * t;
      bouquetGroup.rotation.y = startRotY * (1 - t) + targetManualRotation.y * t;
      bouquetGroup.rotation.z = startRotZ * (1 - t);

      // Ground shadow expands and darkens dynamically as bouquet lands
      if (groundShadowMesh) {
        groundShadowMesh.material.opacity = Math.min(0.42, t * 0.42);
        groundShadowMesh.scale.setScalar(0.3 + t * 0.7);
      }
    } else {
      isLanded = true;
    }

    // Detach and animate floating petals as bouquet falls
    const dt = 0.016; // approximate delta time
    floatingPetals.forEach(p => {
      if (!p.detached && elapsed >= p.detachDelay) {
        p.detached = true;
        p.mesh.visible = true;
        p.mesh.position.copy(bouquetGroup.position);
        p.mesh.position.x += (Math.random() - 0.5) * 1.8;
        p.mesh.position.y += 0.8 + Math.random() * 1.2;
        p.mesh.position.z += (Math.random() - 0.5) * 1.8;
      }

      if (p.detached) {
        // Apply velocity with air resistance
        p.mesh.position.addScaledVector(p.vel, dt);
        p.vel.multiplyScalar(0.975); // Air drag

        // Downward gravity drift with sinusoidal turbulence
        p.mesh.position.y -= 0.012;
        p.mesh.position.x += Math.sin(animationTime * p.driftSpeed + p.driftPhase) * 0.008;
        p.mesh.position.z += Math.cos(animationTime * p.driftSpeed + p.driftPhase) * 0.008;

        // Aerodynamic tumbling
        p.mesh.rotation.x += p.angVel.x * dt;
        p.mesh.rotation.y += p.angVel.y * dt;
        p.mesh.rotation.z += p.angVel.z * dt;
        p.angVel.multiplyScalar(0.985);

        // Ambient wrapping: keep petals gently floating across the hero scene
        if (p.mesh.position.y < -5.5) {
          p.mesh.position.y = 5.2 + Math.random() * 2.0;
          p.mesh.position.x = (Math.random() - 0.5) * 9.0;
          p.mesh.position.z = (Math.random() - 0.5) * 5.0;
          p.vel.set((Math.random() - 0.5) * 0.4, -0.2, (Math.random() - 0.5) * 0.4);
        }
      }
    });
  }

  /* ==========================================================================
     9. Interactive Pointer Drag & Mouse Parallax
     ========================================================================== */
  function setupInteractionListeners(domElement) {
    // Mouse Parallax across hero
    window.addEventListener('mousemove', (e) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      mouseParallax.x = nx * 0.25;
      mouseParallax.y = -ny * 0.18;
    }, { passive: true });

    // Drag Orbit / 360° Inspection
    domElement.addEventListener('pointerdown', (e) => {
      isPointerDown = true;
      pointerStart.x = e.clientX;
      pointerStart.y = e.clientY;
      domElement.style.cursor = 'grabbing';
    });

    window.addEventListener('pointermove', (e) => {
      if (!isPointerDown) return;
      const deltaX = (e.clientX - pointerStart.x) * 0.008;
      const deltaY = (e.clientY - pointerStart.y) * 0.008;

      targetManualRotation.y += deltaX;
      targetManualRotation.x = Math.max(-0.6, Math.min(0.8, targetManualRotation.x + deltaY));

      pointerStart.x = e.clientX;
      pointerStart.y = e.clientY;
    }, { passive: true });

    window.addEventListener('pointerup', () => {
      if (isPointerDown) {
        isPointerDown = false;
        if (domElement) domElement.style.cursor = 'grab';
      }
    });

    // Replay button listener
    const replayBtn = document.getElementById('replay-3d-entrance-btn') || document.getElementById('replay-entrance-btn');
    if (replayBtn) {
      replayBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        startFallingSequence();
      });
    }
  }

  /* ==========================================================================
     10. Main Render Loop
     ========================================================================== */
  function animate(now) {
    requestAnimationFrame(animate);

    animationTime = now * 0.001;

    // Update falling kinematics
    updateFallingKinematics(now);

    // If landed, apply gentle living breathing float + interactive rotation
    if (isLanded && bouquetGroup) {
      // Smooth interpolation towards manual/drag rotation + subtle mouse parallax
      manualRotation.x += (targetManualRotation.x + mouseParallax.y - manualRotation.x) * 0.08;
      manualRotation.y += (targetManualRotation.y + mouseParallax.x - manualRotation.y) * 0.08;

      // Subtle breathing float on Y
      const breathingY = Math.sin(animationTime * 1.6) * 0.12;
      const breathingTiltZ = Math.sin(animationTime * 1.2) * 0.025;

      bouquetGroup.position.y = breathingY;
      bouquetGroup.rotation.x = manualRotation.x;
      bouquetGroup.rotation.y = manualRotation.y;
      bouquetGroup.rotation.z = breathingTiltZ;

      // Pulse ground shadow in sync with breathing
      if (groundShadowMesh) {
        const shadowScale = 1.0 - breathingY * 0.12;
        groundShadowMesh.scale.setScalar(shadowScale);
        groundShadowMesh.material.opacity = 0.38 - breathingY * 0.05;
      }
    }

    renderer.render(scene, camera);
  }

  /* ==========================================================================
     11. Initialization & Responsive Resize
     ========================================================================== */
  function init() {
    containerEl = document.getElementById('three-bouquet-container');
    if (!containerEl) {
      console.warn('Three.js bouquet container #three-bouquet-container not found.');
      return;
    }

    // Measure container size
    const width = containerEl.clientWidth || 500;
    const height = containerEl.clientHeight || 560;

    // 1. Scene
    scene = new THREE.Scene();

    // 2. Camera (Focal angle calibrated for luxury bouquet presentation)
    camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    const isMobile = window.innerWidth < 768;
    camera.position.set(0, 0.2, isMobile ? 13.5 : 11.2);
    camera.lookAt(0, -0.4, 0);

    // 3. Renderer with high-performance WebGL settings
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    containerEl.appendChild(renderer.domElement);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.cursor = 'grab';

    // 4. Lighting: Luxury Atelier Warm Atmosphere
    const ambientLight = new THREE.AmbientLight(0xFFF7F5, 0.95);
    scene.add(ambientLight);

    // Key Light (Warm sunlight, soft shadows)
    const keyLight = new THREE.DirectionalLight(0xFFFFFF, 1.25);
    keyLight.position.set(6, 10, 8);
    scene.add(keyLight);

    // Fill Light (Soft blush bounce from bottom-left)
    const fillLight = new THREE.DirectionalLight(0xFCECE8, 0.72);
    fillLight.position.set(-7, 3.5, 6);
    scene.add(fillLight);

    // Rim / Backlight (Sage botanical highlight on petal edges)
    const rimLight = new THREE.DirectionalLight(0xDFE9DC, 0.58);
    rimLight.position.set(0, 6, -7);
    scene.add(rimLight);

    // 5. Build Master 3D Bouquet & Detached Floating Petals
    buildMasterBouquet();
    create3DFloatingPetals(38);

    // 6. Setup Interactive Pointer Listeners
    setupInteractionListeners(renderer.domElement);

    // 7. Handle Window Resize
    window.addEventListener('resize', onWindowResize, { passive: true });

    // 8. Start Falling Animation & Render Loop
    startFallingSequence();
    requestAnimationFrame(animate);
  }

  function onWindowResize() {
    if (!containerEl || !renderer || !camera) return;
    const w = containerEl.clientWidth || 500;
    const h = containerEl.clientHeight || 560;

    camera.aspect = w / h;
    const isMobile = window.innerWidth < 768;
    camera.position.z = isMobile ? 13.5 : 11.2;
    camera.updateProjectionMatrix();

    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  }

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

