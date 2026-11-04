/**
 * World Module for 3D RPG Mobile Prototype
 * Initializes Three.js Scene, WebGLRenderer, balanced bright lighting rig,
 * solid white sky background, and horizon depth fog.
 */
import * as THREE from 'three';

export class World {
  /**
   * @param {HTMLElement} container DOM container for canvas
   */
  constructor(container) {
    this.container = container;

    // Safe detection for software WebGL (prevents crashes if extensions are restricted)
    this.isSoftwareGl = false;
    try {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
      if (gl) {
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        if (ext) {
          const gpu = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '');
          this.isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
        }
      }
    } catch (_) {
      this.isSoftwareGl = false;
    }

    // 1. Scene Setup
    this.scene = new THREE.Scene();
    // Solid white background as requested
    this.scene.background = new THREE.Color(0xFFFFFF);
    // Subtle horizon fog (starts at 60 units to keep the active 100x100 arena crystal clear)
    this.scene.fog = new THREE.Fog(0xFFFFFF, 60, 220);

    // 2. Camera Setup
    const width = Math.max(1, window.innerWidth);
    const height = Math.max(1, window.innerHeight);
    const aspect = width / height;
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 500);

    // 3. WebGL Renderer Setup
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    // Cap pixel ratio at 2.0 for smooth mobile 60fps
    const pixelRatio = this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(width, height);

    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // 4. Lighting Rig
    this._setupLighting();
  }

  /**
   * Sets up balanced 3-point lighting so checkerboard pattern & player pop cleanly.
   */
  _setupLighting() {
    // Ambient / Hemisphere Fill Light (Soft cool sky, warm ground)
    const hemiLight = new THREE.HemisphereLight(0xFFFFFF, 0xCBD5E1, 0.85);
    this.scene.add(hemiLight);

    // Primary Directional Key Light (Sun)
    this.keyLight = new THREE.DirectionalLight(0xFFFBEB, 1.15);
    this.keyLight.position.set(25, 35, 25);
    this.keyLight.castShadow = !this.isSoftwareGl;

    if (this.keyLight.castShadow) {
      this.keyLight.shadow.mapSize.width = 1024;
      this.keyLight.shadow.mapSize.height = 1024;
      this.keyLight.shadow.camera.near = 1.0;
      this.keyLight.shadow.camera.far = 100;
      const d = 30;
      this.keyLight.shadow.camera.left = -d;
      this.keyLight.shadow.camera.right = d;
      this.keyLight.shadow.camera.top = d;
      this.keyLight.shadow.camera.bottom = -d;
      this.keyLight.shadow.bias = -0.0005;
      this.keyLight.shadow.normalBias = 0.02;
    }
    this.scene.add(this.keyLight);

    // Secondary Cool Fill Light (Prevents dark unlit sides)
    const fillLight = new THREE.DirectionalLight(0xE2E8F0, 0.45);
    fillLight.position.set(-25, 20, -25);
    this.scene.add(fillLight);
  }

  /**
   * Updates directional light position to keep shadow frustum centered near player.
   * @param {THREE.Vector3} playerPosition
   */
  updateLightTarget(playerPosition) {
    if (this.keyLight && this.keyLight.castShadow) {
      this.keyLight.position.x = playerPosition.x + 25;
      this.keyLight.position.z = playerPosition.z + 25;
      this.keyLight.target.position.copy(playerPosition);
      this.keyLight.target.updateMatrixWorld();
    }
  }

  /**
   * Handles window resizing.
   * @param {number} width
   * @param {number} height
   */
  resize(width, height) {
    this.camera.aspect = width / Math.max(1, height);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Renders the scene.
   */
  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
