/**
 * Floor Module for 3D RPG Mobile Prototype
 * Generates a 3D ground plane with procedural high-contrast checkerboard CanvasTexture.
 * Guarantees visible, sharp, non-blurry 2x2 unit tiles at Y = 0.
 */
import * as THREE from 'three';

/**
 * Creates a procedural 2x2 checkerboard CanvasTexture with crisp contrast and tile borders.
 * @param {THREE.WebGLRenderer} renderer
 * @returns {THREE.CanvasTexture}
 */
function createProceduralCheckerTexture(renderer) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const half = 256;
    // High-contrast clean colors: rich slate-grey and bright off-white
    const colorDark = '#475569';  // Crisp slate-600
    const colorLight = '#F8FAFC'; // Crisp slate-50
    const borderColor = '#334155'; // Subtle border between tiles

    // Top-left: Dark slate
    ctx.fillStyle = colorDark;
    ctx.fillRect(0, 0, half, half);

    // Top-right: Bright white
    ctx.fillStyle = colorLight;
    ctx.fillRect(half, 0, half, half);

    // Bottom-left: Bright white
    ctx.fillStyle = colorLight;
    ctx.fillRect(0, half, half, half);

    // Bottom-right: Dark slate
    ctx.fillStyle = colorDark;
    ctx.fillRect(half, half, half, half);

    // Sharp tile division lines for crystal clarity
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, half, half);
    ctx.strokeRect(half, 0, half, half);
    ctx.strokeRect(0, half, half, half);
    ctx.strokeRect(half, half, half, half);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  // On a 120x120 plane, 2x2 tiles per texture repeated 30x gives 60x60 grid tiles.
  // 120 / 60 = exactly 2.0 units per square in 3D world space!
  texture.repeat.set(30, 30);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.NearestFilter; // Sharp edges, no blur

  if (renderer && renderer.capabilities) {
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  }

  texture.needsUpdate = true;
  return texture;
}

/**
 * Creates and configures the 3D floor mesh and world boundary markers.
 * @param {THREE.WebGLRenderer} renderer
 * @param {number} size Plane dimensions (default: 120 units)
 * @returns {THREE.Group}
 */
export function createFloor(renderer, size = 120) {
  const group = new THREE.Group();

  const texture = createProceduralCheckerTexture(renderer);

  const geometry = new THREE.PlaneGeometry(size, size);
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.75,
    metalness: 0.1,
  });

  const floorMesh = new THREE.Mesh(geometry, material);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.position.set(0, 0, 0); // Exactly at Y = 0
  floorMesh.receiveShadow = true;
  group.add(floorMesh);

  // Add 4 subtle corner obelisks/pillars around the arena (distance = 45 units)
  // to give clear spatial depth, orientation, and sense of scale
  const pillarGeo = new THREE.CylinderGeometry(0.6, 0.8, 4, 8);
  const pillarMat = new THREE.MeshStandardMaterial({
    color: 0x64748B,
    roughness: 0.6,
    metalness: 0.2,
  });

  const pillarPositions = [
    [25, 25],
    [-25, 25],
    [25, -25],
    [-25, -25],
  ];

  pillarPositions.forEach(([x, z]) => {
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.set(x, 2, z);
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    group.add(pillar);
  });

  return group;
}
