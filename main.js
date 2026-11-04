/**
 * Main Entry Point for 3D RPG Mobile Prototype
 * Orchestrates World, Floor, Player, Camera, Controls, and UI.
 * Runs 60fps game loop with delta timing and handles resize & orientation.
 */
import * as THREE from 'three';
import { World } from './world.js';
import { createFloor } from './floor.js';
import { Player } from './player.js';
import { ThirdPersonCamera } from './camera.js';
import { MobileControls } from './controls.js';
import { createUI } from './ui.js';

class GameApp {
  constructor() {
    this.canvasContainer = document.getElementById('canvas-container');
    if (!this.canvasContainer) {
      this.canvasContainer = document.createElement('div');
      this.canvasContainer.id = 'canvas-container';
      document.body.prepend(this.canvasContainer);
    }

    // 1. Initialize 3D World (Scene, WebGLRenderer, Lighting, Fog)
    this.world = new World(this.canvasContainer);

    // 2. Initialize 3D Procedural Floor (Y = 0) with crisp checkerboard & landmark pillars
    this.floor = createFloor(this.world.renderer, 140);
    this.world.scene.add(this.floor);

    // 3. Initialize Cube Player Character
    this.player = new Player(this.world.scene);

    // 4. Initialize Third-Person Camera System
    this.cameraSystem = new ThirdPersonCamera(this.world.camera);

    // 5. Initialize Minimalist High-Contrast Inline SVG UI
    this.ui = createUI();

    // 6. Initialize Mobile Controls (Joystick, Jump, Camera Orbit)
    this.controls = new MobileControls(
      this.ui,
      this.world.renderer.domElement,
      () => this.player.jump(),
      (deltaYaw, deltaPitch) => this.cameraSystem.rotate(deltaYaw, deltaPitch)
    );

    // Reusable scratch vector for movement
    this.moveDirection = new THREE.Vector3();

    // Clock for consistent delta timing across all frame rates
    this.clock = new THREE.Clock();

    // Setup window event listeners
    this._setupWindowEvents();

    // Initial render call to guarantee immediate view on load
    this.world.render();

    // Start game loop
    this._startLoop();
  }

  /**
   * Sets up window resize, orientation checking, and fullscreen/orientation lock gestures.
   */
  _setupWindowEvents() {
    const handleResize = () => {
      const width = Math.max(1, window.innerWidth);
      const height = Math.max(1, window.innerHeight);
      this.world.resize(width, height);

      // Check portrait vs landscape
      const isPortrait = height > width;
      this.ui.setPortraitOverlayVisible(isPortrait);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    handleResize();

    // Request fullscreen and landscape lock on first user interaction if supported
    const handleFirstGesture = () => {
      if (screen.orientation && typeof screen.orientation.lock === 'function') {
        screen.orientation.lock('landscape').catch(() => {});
      }

      if (!document.fullscreenElement) {
        const el = document.documentElement;
        if (el.requestFullscreen) {
          el.requestFullscreen().catch(() => {});
        } else if (el.webkitRequestFullscreen) {
          el.webkitRequestFullscreen();
        }
      }

      window.removeEventListener('pointerdown', handleFirstGesture);
    };

    window.addEventListener('pointerdown', handleFirstGesture, { once: true });
  }

  /**
   * Game loop running on requestAnimationFrame.
   */
  _startLoop() {
    const animate = () => {
      requestAnimationFrame(animate);

      // Delta time in seconds, clamped to 0.05 to avoid huge physics jumps
      const rawDelta = this.clock.getDelta();
      const delta = Math.min(rawDelta, 0.05);

      // 1. Retrieve composite movement input (-1 to 1)
      const input = this.controls.getMovementInput();

      // 2. Transform input relative to camera horizontal orientation
      this.cameraSystem.getMovementDirection(input.x, input.y, this.moveDirection);

      // 3. Update player movement, rotation, and jump physics
      this.player.update(delta, this.moveDirection);

      // 4. Update third-person camera following player
      this.cameraSystem.update(delta, this.player.getPosition());

      // 5. Update key directional light shadow target to follow player
      this.world.updateLightTarget(this.player.getPosition());

      // 6. Render current frame
      this.world.render();
    };

    animate();
  }
}

// Instantiate application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new GameApp());
} else {
  new GameApp();
}
