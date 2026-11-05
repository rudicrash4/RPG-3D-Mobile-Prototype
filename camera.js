/**
 * Camera Module for 3D RPG Mobile Prototype
 * Third-person camera with 360-degree horizontal orbit, vertical pitch clamping,
 * exponential damping follow, ground clearance guard, and horizontal XZ movement projection.
 */
import * as THREE from 'three';
import { clamp, lerp } from './utils.js';

export class ThirdPersonCamera {
  /**
   * @param {THREE.PerspectiveCamera} camera
   */
  constructor(camera) {
    this.camera = camera;

    // Configurable Camera Sensitivity & Control Variables
    this.cameraSensitivity = 0.005; // Horizontal yaw sensitivity
    this.cameraPitchSensitivity = 0.004; // Vertical pitch sensitivity
    this.cameraInvertY = false; // Invert vertical swipe direction

    // Camera Orbit Parameters
    this.distance = 7.5; // Distance from target
    this.heightOffset = 1.6; // Target height offset above player base
    this.yaw = 0.0; // Horizontal orbit angle (radians, 360 unbounded)
    this.pitch = 0.38; // Vertical elevation angle (~22 degrees default)

    // Pitch constraints (prevents camera flipping and ground clipping)
    this.minPitch = -0.15; // ~ -8.6 degrees (looking slightly up)
    this.maxPitch = 1.05; // ~ 60 degrees (looking down)

    // Smooth follow target with exponential damping
    this.targetPosition = new THREE.Vector3(0, this.heightOffset, 0);
    this.followSpeed = 9.0; // Damping rate for frame-rate independence

    // Reusable directional vectors for movement calculations (XZ plane)
    this.forward = new THREE.Vector3(0, 0, -1);
    this.right = new THREE.Vector3(1, 0, 0);

    // Initial positioning to ensure correct view on frame 0
    this.update(1.0, new THREE.Vector3(0, 0, 0));
  }

  /**
   * Rotates camera orbit by delta yaw and pitch.
   * Keeps horizontal yaw cleanly wrapping and clamps vertical pitch.
   * @param {number} deltaYaw Horizontal change in radians
   * @param {number} deltaPitch Vertical change in radians
   */
  rotate(deltaYaw, deltaPitch) {
    // 360-degree unbounded horizontal rotation with clean wrapping
    this.yaw += deltaYaw;
    const twoPi = Math.PI * 2;
    this.yaw = ((this.yaw % twoPi) + twoPi) % twoPi;

    // Apply pitch change with vertical clamp
    const effectivePitchDelta = this.cameraInvertY ? -deltaPitch : deltaPitch;
    this.pitch = clamp(this.pitch + effectivePitchDelta, this.minPitch, this.maxPitch);
  }

  /**
   * Smoothly updates camera position and orientation following player using exponential damping.
   * @param {number} delta Delta time in seconds
   * @param {THREE.Vector3} playerPosition
   */
  update(delta, playerPosition) {
    // 1. Frame-rate independent exponential damping: 1 - Math.exp(-followSpeed * delta)
    const desiredTargetX = playerPosition.x;
    const desiredTargetY = playerPosition.y + this.heightOffset;
    const desiredTargetZ = playerPosition.z;

    const followFactor = 1 - Math.exp(-this.followSpeed * delta);
    this.targetPosition.x = lerp(this.targetPosition.x, desiredTargetX, followFactor);
    this.targetPosition.y = lerp(this.targetPosition.y, desiredTargetY, followFactor);
    this.targetPosition.z = lerp(this.targetPosition.z, desiredTargetZ, followFactor);

    // 2. Compute camera spherical position relative to target
    const cosPitch = Math.cos(this.pitch);
    const sinPitch = Math.sin(this.pitch);
    const sinYaw = Math.sin(this.yaw);
    const cosYaw = Math.cos(this.yaw);

    const camX = this.targetPosition.x + this.distance * cosPitch * sinYaw;
    let camY = this.targetPosition.y + this.distance * sinPitch;
    const camZ = this.targetPosition.z + this.distance * cosPitch * cosYaw;

    // Ground penetration guard: Ensure camera never sinks below floor (ground is at Y = 0)
    if (camY < 0.45) {
      camY = 0.45;
    }

    this.camera.position.set(camX, camY, camZ);
    this.camera.lookAt(this.targetPosition.x, this.targetPosition.y, this.targetPosition.z);

    // 3. Compute normalized horizontal forward & right vectors (XZ plane)
    // Forward direction from camera to target projected on horizontal plane
    this.forward.set(-sinYaw, 0, -cosYaw).normalize();
    // Right direction perpendicular to forward
    this.right.set(cosYaw, 0, -sinYaw).normalize();
  }

  /**
   * Calculates world-space movement vector relative to camera horizontal orientation.
   * @param {number} inputX Horizontal joystick/key input (-1 to 1)
   * @param {number} inputY Forward/backward input (-1 to 1, where 1 is forward)
   * @param {THREE.Vector3} outVector Resulting vector written into this parameter
   * @returns {THREE.Vector3}
   */
  getMovementDirection(inputX, inputY, outVector) {
    outVector.set(0, 0, 0);

    if (Math.abs(inputX) > 0.001 || Math.abs(inputY) > 0.001) {
      outVector.addScaledVector(this.forward, inputY);
      outVector.addScaledVector(this.right, inputX);

      // Normalize diagonal movement speed
      if (outVector.lengthSq() > 1.0) {
        outVector.normalize();
      }
    }

    return outVector;
  }
}
