/**
 * Utility functions for 3D RPG Mobile Prototype
 * Provides clamping, linear interpolation, angle wrapping lerp, and vector helpers.
 */
import * as THREE from 'three';

/**
 * Clamp a number between min and max bounds.
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation between start and end.
 * @param {number} start
 * @param {number} end
 * @param {number} factor
 * @returns {number}
 */
export function lerp(start, end, factor) {
  return start + (end - start) * factor;
}

/**
 * Shortest path angular linear interpolation (-PI to PI).
 * Prevents 360-degree wrapping spin when crossing boundary.
 * @param {number} start
 * @param {number} end
 * @param {number} factor
 * @returns {number}
 */
export function lerpAngle(start, end, factor) {
  const diff = ((end - start + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
  return start + diff * factor;
}

/**
 * Frame-rate independent exponential damping.
 * @param {number} current
 * @param {number} target
 * @param {number} lambda
 * @param {number} delta
 * @returns {number}
 */
export function damp(current, target, lambda, delta) {
  return lerp(current, target, 1 - Math.exp(-lambda * delta));
}

/**
 * Pre-allocated scratch vectors to prevent GC allocations in requestAnimationFrame loop.
 */
export const _scratchVec3A = new THREE.Vector3();
export const _scratchVec3B = new THREE.Vector3();
export const _scratchVec3C = new THREE.Vector3();
