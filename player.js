/**
 * Player Module for 3D RPG Mobile Prototype
 * Cube player character with 3D directional arrow, smooth rotation interpolation,
 * 3D movement system, ground detection, and jump physics.
 */
import * as THREE from 'three';
import { lerpAngle, clamp } from './utils.js';

export class Player {
  /**
   * @param {THREE.Scene} scene
   */
  constructor(scene) {
    this.scene = scene;

    // Movement configuration
    this.moveSpeed = 8.0; // Units per second
    this.rotationSpeed = 14.0; // Interpolation factor for smooth turning

    // Jump & Gravity configuration
    this.jumpForce = 9.8; // Initial vertical launch velocity
    this.gravity = -24.0; // Gravity acceleration (units/sec^2)
    this.verticalVelocity = 0.0;
    this.isGrounded = true;

    // Character dimensions
    this.size = 1.4; // 1.4x1.4x1.4 cube
    this.halfHeight = this.size / 2; // 0.7 units

    // Rotation state (facing direction in radians)
    this.facingAngle = 0;

    // Build 3D character hierarchy
    this.mesh = this._createPlayerMesh();
    this.shadowMesh = this._createContactShadow();

    // Initial position in world center
    this.mesh.position.set(0, 0, 0);
    this.shadowMesh.position.set(0, 0.01, 0);

    scene.add(this.mesh);
    scene.add(this.shadowMesh);
  }

  /**
   * Builds the Cube player character with a 3D directional arrow.
   * @returns {THREE.Group}
   */
  _createPlayerMesh() {
    const group = new THREE.Group();

    // 1. Main Cube Character
    const cubeGeometry = new THREE.BoxGeometry(this.size, this.size, this.size);
    const cubeMaterial = new THREE.MeshStandardMaterial({
      color: 0x2563EB, // Vibrant solid royal blue
      roughness: 0.35,
      metalness: 0.2,
    });
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cube.position.y = this.halfHeight; // Center at half height so bottom is at Y=0
    cube.castShadow = true;
    cube.receiveShadow = false;
    group.add(cube);

    // 2. Decorative Face Trim (Provides subtle high-end depth to the cube)
    const visorGeo = new THREE.BoxGeometry(this.size * 0.75, 0.28, 0.08);
    const visorMat = new THREE.MeshStandardMaterial({
      color: 0x0F172A, // Deep navy visor
      roughness: 0.15,
      metalness: 0.8,
    });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    // Position on front face (+Z)
    visor.position.set(0, this.halfHeight + 0.15, this.halfHeight + 0.02);
    group.add(visor);

    // 3. 3D Directional Indicator Arrow (Points forward along facing direction)
    const arrowGroup = new THREE.Group();
    // Position on top of the cube
    arrowGroup.position.set(0, this.size + 0.15, 0);

    // Arrow shaft (aligned along Z axis)
    const shaftGeo = new THREE.BoxGeometry(0.18, 0.06, 0.5);
    const arrowMat = new THREE.MeshStandardMaterial({
      color: 0x38BDF8, // Luminous bright cyan
      roughness: 0.2,
      metalness: 0.4,
      emissive: 0x0284C7,
      emissiveIntensity: 0.25,
    });
    const shaft = new THREE.Mesh(shaftGeo, arrowMat);
    shaft.position.set(0, 0, -0.05);
    arrowGroup.add(shaft);

    // Arrow tip (Cone pointing towards +Z)
    const tipGeo = new THREE.ConeGeometry(0.24, 0.42, 16);
    tipGeo.rotateX(Math.PI / 2); // Point towards +Z
    const tip = new THREE.Mesh(tipGeo, arrowMat);
    tip.position.set(0, 0, 0.35);
    arrowGroup.add(tip);

    group.add(arrowGroup);

    return group;
  }

  /**
   * Creates a grounded soft radial contact shadow plane.
   * @returns {THREE.Mesh}
   */
  _createContactShadow() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(64, 64, 8, 64, 64, 60);
      gradient.addColorStop(0, 'rgba(15, 23, 42, 0.45)');
      gradient.addColorStop(0.5, 'rgba(15, 23, 42, 0.2)');
      gradient.addColorStop(1, 'rgba(15, 23, 42, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 128, 128);
    }

    const texture = new THREE.CanvasTexture(canvas);
    const geometry = new THREE.PlaneGeometry(2.4, 2.4);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      opacity: 0.6,
    });

    const shadow = new THREE.Mesh(geometry, material);
    shadow.rotation.x = -Math.PI / 2;
    shadow.renderOrder = 1;
    return shadow;
  }

  /**
   * Triggers a jump if the character is grounded.
   * Prevents multi-jumping while in mid-air.
   * @returns {boolean} Whether jump was successfully initiated.
   */
  jump() {
    if (!this.isGrounded) {
      return false; // Cannot jump while in air
    }

    this.verticalVelocity = this.jumpForce;
    this.isGrounded = false;
    return true;
  }

  /**
   * Updates player physics, position, rotation, and jumping.
   * @param {number} delta Delta time in seconds
   * @param {THREE.Vector3} moveDirection World-space normalized movement vector
   */
  update(delta, moveDirection) {
    const isMoving = moveDirection.lengthSq() > 0.001;

    // 1. Horizontal Movement
    if (isMoving) {
      this.mesh.position.x += moveDirection.x * this.moveSpeed * delta;
      this.mesh.position.z += moveDirection.z * this.moveSpeed * delta;

      // Target angle: standard Three.js facing (+Z forward)
      const targetAngle = Math.atan2(moveDirection.x, moveDirection.z);
      // Smoothly interpolate rotation to prevent abrupt snapping
      this.facingAngle = lerpAngle(this.facingAngle, targetAngle, Math.min(1.0, this.rotationSpeed * delta));
      this.mesh.rotation.y = this.facingAngle;
    }

    // 2. Vertical Jump & Gravity Physics
    if (!this.isGrounded) {
      this.verticalVelocity += this.gravity * delta;
      this.mesh.position.y += this.verticalVelocity * delta;

      // Ground collision detection (Ground is at Y = 0)
      if (this.mesh.position.y <= 0) {
        this.mesh.position.y = 0;
        this.verticalVelocity = 0.0;
        this.isGrounded = true;
      }
    }

    // 3. Update Contact Shadow Position & Scale
    this.shadowMesh.position.x = this.mesh.position.x;
    this.shadowMesh.position.z = this.mesh.position.z;

    // Softly fade and shrink shadow when jumping
    const heightAboveGround = this.mesh.position.y;
    const shadowScale = clamp(1.0 - heightAboveGround * 0.15, 0.45, 1.0);
    this.shadowMesh.scale.set(shadowScale, shadowScale, 1.0);
    this.shadowMesh.material.opacity = clamp(0.6 - heightAboveGround * 0.1, 0.15, 0.6);
  }

  /**
   * Current position of the player in world space.
   * @returns {THREE.Vector3}
   */
  getPosition() {
    return this.mesh.position;
  }
}
