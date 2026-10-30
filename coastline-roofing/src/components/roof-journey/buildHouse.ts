import * as THREE from "three";

/**
 * Procedurally builds a stylised British residential property: brick
 * walls, a tiled pitched gable roof (individual slate tiles via
 * instancing, not a flat textured plane), a ridge, fascias, guttering,
 * downpipes, a chimney with flashing, and a small flat-roof extension.
 *
 * Deliberately not photoreal -- there's no licensed 3D model or texture
 * set available for this fictional job, so the goal is a *credible*,
 * clearly-roof-shaped composition with real tile geometry and coursing,
 * not a flat box standing in for a house.
 */

const COLOR = {
  tile: 0x333b40, // --slate
  tileDamaged: 0x6b6256,
  ridge: 0x272e32,
  wall: 0xe3dccd,
  fascia: 0xf5f4f0, // --background
  gutter: 0x20231f,
  chimney: 0x8a5a3f,
  chimneyMortar: 0x6e4631,
  flashing: 0x2c2f2b,
  window: 0x242a2c,
  windowFrame: 0xf5f4f0,
  door: 0xb86b43, // --accent
  ground: 0x3c4038,
  flatRoof: 0x2a2d27,
};

export type HouseParts = {
  group: THREE.Group;
  chimneyTop: THREE.Vector3;
  eaveFront: THREE.Vector3;
  ridgeMid: THREE.Vector3;
  flatRoofCenter: THREE.Vector3;
  patchCenter: THREE.Vector3;
  /** Call once per frame with 0..1 to blend the repair -> replacement patch. */
  setRepairProgress: (t: number) => void;
  dispose: () => void;
};

export function buildHouse(): HouseParts {
  const group = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [];

  const houseWidth = 10;
  const houseDepth = 6.4;
  const wallHeight = 2.9;
  const pitchDeg = 33;
  const pitchRad = (pitchDeg * Math.PI) / 180;
  const eaveOverhang = 0.45;
  const gableOverhang = 0.3;

  const roofHalfSpan = houseDepth / 2 + eaveOverhang;
  const ridgeHeight = wallHeight + roofHalfSpan * Math.tan(pitchRad);
  const slopeLength = roofHalfSpan / Math.cos(pitchRad);
  const roofWidth = houseWidth + gableOverhang * 2;

  const materials = {
    tile: new THREE.MeshStandardMaterial({ color: COLOR.tile, roughness: 0.72, metalness: 0.08 }),
    tileDamaged: new THREE.MeshStandardMaterial({ color: COLOR.tileDamaged, roughness: 0.95, metalness: 0.0 }),
    ridge: new THREE.MeshStandardMaterial({ color: COLOR.ridge, roughness: 0.6, metalness: 0.1 }),
    wall: new THREE.MeshStandardMaterial({ color: COLOR.wall, roughness: 0.92, metalness: 0.0 }),
    fascia: new THREE.MeshStandardMaterial({ color: COLOR.fascia, roughness: 0.5, metalness: 0.0 }),
    gutter: new THREE.MeshStandardMaterial({ color: COLOR.gutter, roughness: 0.35, metalness: 0.55 }),
    chimney: new THREE.MeshStandardMaterial({ color: COLOR.chimney, roughness: 0.85, metalness: 0.0 }),
    chimneyCap: new THREE.MeshStandardMaterial({ color: COLOR.chimneyMortar, roughness: 0.7, metalness: 0.05 }),
    flashing: new THREE.MeshStandardMaterial({ color: COLOR.flashing, roughness: 0.4, metalness: 0.5 }),
    window: new THREE.MeshStandardMaterial({ color: COLOR.window, roughness: 0.3, metalness: 0.1 }),
    lantern: new THREE.MeshStandardMaterial({ color: 0x3a4248, roughness: 0.3, metalness: 0.1 }),
    windowFrame: new THREE.MeshStandardMaterial({ color: COLOR.windowFrame, roughness: 0.6 }),
    door: new THREE.MeshStandardMaterial({ color: COLOR.door, roughness: 0.55 }),
    ground: new THREE.MeshStandardMaterial({ color: COLOR.ground, roughness: 1 }),
    flatRoof: new THREE.MeshStandardMaterial({ color: COLOR.flatRoof, roughness: 0.5, metalness: 0.1 }),
  };
  Object.values(materials).forEach((m) => disposables.push(m));

  /* ---------------- Ground ---------------- */
  const ground = new THREE.Mesh(new THREE.CircleGeometry(40, 48), materials.ground);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  ground.receiveShadow = true;
  group.add(ground);
  disposables.push(ground.geometry);

  /* ---------------- Walls ---------------- */
  const wallGeo = new THREE.BoxGeometry(houseWidth, wallHeight, houseDepth);
  const walls = new THREE.Mesh(wallGeo, materials.wall);
  walls.position.y = wallHeight / 2;
  walls.castShadow = true;
  walls.receiveShadow = true;
  group.add(walls);
  disposables.push(wallGeo);

  // Windows + door on the front face (+Z)
  const windowGeo = new THREE.PlaneGeometry(0.95, 1.15);
  const frameGeo = new THREE.PlaneGeometry(1.08, 1.28);
  disposables.push(windowGeo, frameGeo);
  const windowXs = [-houseWidth / 2 + 1.6, -houseWidth / 2 + 3.4, houseWidth / 2 - 1.8, houseWidth / 2 - 3.6];
  windowXs.forEach((x) => {
    const frame = new THREE.Mesh(frameGeo, materials.windowFrame);
    frame.position.set(x, wallHeight * 0.58, houseDepth / 2 + 0.01);
    group.add(frame);
    const win = new THREE.Mesh(windowGeo, materials.window);
    win.position.set(x, wallHeight * 0.58, houseDepth / 2 + 0.02);
    group.add(win);
  });
  const doorGeo = new THREE.PlaneGeometry(1.0, 2.0);
  disposables.push(doorGeo);
  const door = new THREE.Mesh(doorGeo, materials.door);
  door.position.set(0.1, 1.0, houseDepth / 2 + 0.01);
  group.add(door);

  /* ---------------- Tiled roof slopes ---------------- */
  const tileWidth = 0.46;
  const tileLength = 0.62;
  const tileThickness = 0.035;
  const rowStep = tileLength * 0.58; // overlap between courses
  const numRows = Math.ceil(slopeLength / rowStep) + 1;
  const numCols = Math.ceil(roofWidth / (tileWidth * 0.97)) + 1;

  const tileGeo = new THREE.BoxGeometry(tileWidth, tileThickness, tileLength);
  disposables.push(tileGeo);

  // Patch region (front slope only) reserved for the repair -> replacement beat.
  const patchColStart = Math.floor(numCols * 0.32);
  const patchColEnd = Math.floor(numCols * 0.52);
  const patchRowStart = Math.floor(numRows * 0.28);
  const patchRowEnd = Math.floor(numRows * 0.55);

  function isPatch(side: 1 | -1, row: number, col: number) {
    return (
      side === 1 &&
      col >= patchColStart &&
      col < patchColEnd &&
      row >= patchRowStart &&
      row < patchRowEnd
    );
  }

  type Placement = { matrix: THREE.Matrix4; damaged: boolean };
  const mainPlacements: Placement[] = [];
  const patchGoodPlacements: Placement[] = [];
  const patchDamagedPlacements: Placement[] = [];

  const dummy = new THREE.Object3D();

  ([1, -1] as const).forEach((side) => {
    for (let row = 0; row < numRows; row++) {
      const t = Math.min(1, (row * rowStep) / slopeLength);
      const y = ridgeHeight - t * (ridgeHeight - wallHeight) + tileThickness * 0.5;
      const zDist = t * roofHalfSpan;
      const rowOffset = row % 2 === 0 ? 0 : tileWidth / 2;

      for (let col = -1; col <= numCols; col++) {
        const x = -roofWidth / 2 + col * tileWidth * 0.97 + rowOffset;
        if (x < -roofWidth / 2 - tileWidth || x > roofWidth / 2 + tileWidth) continue;

        dummy.position.set(x, y, side * zDist);
        dummy.rotation.set(side === 1 ? pitchRad : -pitchRad, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();

        const patch = isPatch(side, row, col);
        if (patch) {
          patchGoodPlacements.push({ matrix: dummy.matrix.clone(), damaged: false });

          // Damaged version: a few tiles missing entirely, the rest
          // knocked slightly askew with a weathered colour.
          const skip = (row + col) % 5 === 0;
          if (!skip) {
            dummy.rotation.set(
              (side === 1 ? pitchRad : -pitchRad) + (Math.random() - 0.5) * 0.12,
              (Math.random() - 0.5) * 0.1,
              0
            );
            dummy.position.y -= Math.random() * 0.02;
            dummy.updateMatrix();
            patchDamagedPlacements.push({ matrix: dummy.matrix.clone(), damaged: true });
          }
        } else {
          mainPlacements.push({ matrix: dummy.matrix.clone(), damaged: false });
        }
      }
    }
  });

  function makeInstanced(placements: Placement[], material: THREE.Material) {
    const mesh = new THREE.InstancedMesh(tileGeo, material, Math.max(placements.length, 1));
    placements.forEach((p, i) => mesh.setMatrixAt(i, p.matrix));
    mesh.count = placements.length;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.instanceMatrix.needsUpdate = true;
    group.add(mesh);
    return mesh;
  }

  makeInstanced(mainPlacements, materials.tile);
  const patchGood = makeInstanced(patchGoodPlacements, materials.tile);
  const patchDamaged = makeInstanced(patchDamagedPlacements, materials.tileDamaged);
  patchGood.visible = false;

  function setRepairProgress(t: number) {
    // t < 0.5 -> damaged patch visible; t >= 0.5 -> repaired patch visible.
    patchDamaged.visible = t < 0.5;
    patchGood.visible = t >= 0.5;
  }

  /* ---------------- Ridge cap ---------------- */
  const ridgeGeo = new THREE.CylinderGeometry(0.16, 0.16, roofWidth, 10, 1, false, 0, Math.PI);
  disposables.push(ridgeGeo);
  const ridge = new THREE.Mesh(ridgeGeo, materials.ridge);
  ridge.rotation.z = Math.PI / 2;
  ridge.position.set(0, ridgeHeight, 0);
  ridge.castShadow = true;
  group.add(ridge);

  /* ---------------- Gable end walls (triangular infill) ---------------- */
  const gableShape = new THREE.Shape();
  gableShape.moveTo(-houseDepth / 2, 0);
  gableShape.lineTo(houseDepth / 2, 0);
  gableShape.lineTo(0, ridgeHeight - wallHeight);
  gableShape.closePath();
  const gableGeo = new THREE.ExtrudeGeometry(gableShape, { depth: 0.12, bevelEnabled: false });
  disposables.push(gableGeo);
  [-1, 1].forEach((side) => {
    const gable = new THREE.Mesh(gableGeo, materials.wall);
    gable.rotation.y = Math.PI / 2;
    gable.position.set((side * houseWidth) / 2 - (side * 0.06), wallHeight, 0);
    gable.castShadow = true;
    gable.receiveShadow = true;
    group.add(gable);
  });

  /* ---------------- Fascia + guttering + downpipes ---------------- */
  const fasciaGeo = new THREE.BoxGeometry(roofWidth, 0.22, 0.05);
  const gutterGeo = new THREE.BoxGeometry(roofWidth, 0.1, 0.16);
  disposables.push(fasciaGeo, gutterGeo);
  ([1, -1] as const).forEach((side) => {
    const fascia = new THREE.Mesh(fasciaGeo, materials.fascia);
    fascia.position.set(0, wallHeight - 0.05, side * (roofHalfSpan + 0.03));
    fascia.rotation.x = side === 1 ? 0 : 0;
    group.add(fascia);

    const gutter = new THREE.Mesh(gutterGeo, materials.gutter);
    gutter.position.set(0, wallHeight + 0.05, side * (roofHalfSpan + 0.1));
    group.add(gutter);
  });

  const downpipeGeo = new THREE.CylinderGeometry(0.06, 0.06, wallHeight + 0.2, 8);
  disposables.push(downpipeGeo);
  [
    [-houseWidth / 2 + 0.1, 1],
    [houseWidth / 2 - 0.1, 1],
  ].forEach(([x, side]) => {
    const pipe = new THREE.Mesh(downpipeGeo, materials.gutter);
    pipe.position.set(x, (wallHeight + 0.2) / 2, (side as number) * (roofHalfSpan + 0.1));
    pipe.castShadow = true;
    group.add(pipe);
  });

  /* ---------------- Chimney ---------------- */
  const chimneyWidth = 0.9;
  const chimneyDepth = 0.6;
  const chimneyHeight = 1.7;
  const chimneyX = houseWidth * 0.2;
  // Chimney sits astride the ridge.
  const chimneyBaseY = ridgeHeight - 0.3;
  const chimneyGeo = new THREE.BoxGeometry(chimneyWidth, chimneyHeight, chimneyDepth);
  disposables.push(chimneyGeo);
  const chimney = new THREE.Mesh(chimneyGeo, materials.chimney);
  chimney.position.set(chimneyX, chimneyBaseY + chimneyHeight / 2, 0);
  chimney.castShadow = true;
  chimney.receiveShadow = true;
  group.add(chimney);

  const chimneyCapGeo = new THREE.BoxGeometry(chimneyWidth + 0.16, 0.14, chimneyDepth + 0.16);
  disposables.push(chimneyCapGeo);
  const chimneyCap = new THREE.Mesh(chimneyCapGeo, materials.chimneyCap);
  chimneyCap.position.set(chimneyX, chimneyBaseY + chimneyHeight + 0.07, 0);
  group.add(chimneyCap);

  const potGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.42, 10);
  disposables.push(potGeo);
  [-0.22, 0.22].forEach((dx) => {
    const pot = new THREE.Mesh(potGeo, materials.chimneyCap);
    pot.position.set(chimneyX + dx, chimneyBaseY + chimneyHeight + 0.14 + 0.21, 0);
    group.add(pot);
  });

  // Flashing: a slim trim band where the chimney meets the roof.
  const flashingGeo = new THREE.BoxGeometry(chimneyWidth + 0.26, 0.08, chimneyDepth + 0.26);
  disposables.push(flashingGeo);
  const flashing = new THREE.Mesh(flashingGeo, materials.flashing);
  flashing.position.set(chimneyX, chimneyBaseY + 0.04, 0);
  group.add(flashing);

  /* ---------------- Flat-roof extension (single-storey, side of house) ---------------- */
  const flatW = 3.2;
  const flatD = 3.0;
  const flatH = 2.1;
  const flatX = -houseWidth / 2 - flatW / 2 + 0.1;
  const flatZ = houseDepth / 2 - flatD / 2 - 0.2;

  const flatWallGeo = new THREE.BoxGeometry(flatW, flatH, flatD);
  disposables.push(flatWallGeo);
  const flatWalls = new THREE.Mesh(flatWallGeo, materials.wall);
  flatWalls.position.set(flatX, flatH / 2, flatZ);
  flatWalls.castShadow = true;
  flatWalls.receiveShadow = true;
  group.add(flatWalls);

  const flatRoofGeo = new THREE.BoxGeometry(flatW + 0.3, 0.14, flatD + 0.3);
  disposables.push(flatRoofGeo);
  const flatRoof = new THREE.Mesh(flatRoofGeo, materials.flatRoof);
  flatRoof.position.set(flatX, flatH + 0.07, flatZ);
  flatRoof.castShadow = true;
  flatRoof.receiveShadow = true;
  group.add(flatRoof);

  // A small roof lantern on the flat roof -- a nice concrete nod to the
  // "flat roofing" beat without inventing unrelated content.
  const lanternBaseGeo = new THREE.BoxGeometry(0.9, 0.18, 0.9);
  const lanternGlassGeo = new THREE.BoxGeometry(0.74, 0.3, 0.74);
  disposables.push(lanternBaseGeo, lanternGlassGeo);
  const lanternBase = new THREE.Mesh(lanternBaseGeo, materials.flashing);
  lanternBase.position.set(flatX, flatH + 0.14 + 0.09, flatZ);
  group.add(lanternBase);
  const lanternGlass = new THREE.Mesh(lanternGlassGeo, materials.lantern);
  lanternGlass.position.set(flatX, flatH + 0.14 + 0.18 + 0.15, flatZ);
  group.add(lanternGlass);

  function dispose() {
    disposables.forEach((d) => d.dispose());
  }

  const patchRowMid = (patchRowStart + patchRowEnd) / 2;
  const patchColMid = (patchColStart + patchColEnd) / 2;
  const patchT = Math.min(1, (patchRowMid * rowStep) / slopeLength);
  const patchCenter = new THREE.Vector3(
    -roofWidth / 2 + patchColMid * tileWidth * 0.97,
    ridgeHeight - patchT * (ridgeHeight - wallHeight),
    patchT * roofHalfSpan
  );

  return {
    group,
    chimneyTop: new THREE.Vector3(chimneyX, chimneyBaseY + chimneyHeight + 0.5, 0),
    eaveFront: new THREE.Vector3(0, wallHeight, roofHalfSpan),
    ridgeMid: new THREE.Vector3(0, ridgeHeight, 0),
    flatRoofCenter: new THREE.Vector3(flatX, flatH + 0.3, flatZ),
    patchCenter,
    setRepairProgress,
    dispose,
  };
}
