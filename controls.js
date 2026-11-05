/**
 * Controls Module for 3D RPG Mobile Prototype
 * Handles:
 * 1. Virtual Joystick pointer tracking (independent pointerId)
 * 2. Jump button touch and visual feedback (independent pointerId)
 * 3. Camera drag & 360-degree orbit swipe (independent pointerId)
 * 4. Full multi-touch concurrency (move + camera + jump simultaneously)
 * 5. Configurable sensitivity variables (cameraSensitivity, cameraPitchSensitivity, cameraInvertY)
 * 6. Keyboard & mouse fallback for testing and desktop
 */

export class MobileControls {
  /**
   * @param {Object} ui UI interface returned by createUI()
   * @param {HTMLElement} canvasElement WebGL canvas element
   * @param {Function} onJump Jump trigger callback
   * @param {Function} onCameraRotate Camera orbit delta callback (deltaYaw, deltaPitch)
   */
  constructor(ui, canvasElement, onJump, onCameraRotate) {
    this.ui = ui;
    this.canvas = canvasElement;
    this.onJump = onJump;
    this.onCameraRotate = onCameraRotate;

    // Movement vector output (-1 to 1 for both axes)
    // x: -1 (left) to +1 (right)
    // y: -1 (backward) to +1 (forward)
    this.inputVector = { x: 0, y: 0 };

    // Multi-touch Pointer ID tracking
    this.joystickPointerId = null;
    this.jumpPointerId = null;
    this.cameraPointerId = null;

    // Joystick measurement properties
    this.joystickCenterX = 0;
    this.joystickCenterY = 0;
    this.maxJoystickRadius = 46; // Max knob displacement in px

    // Camera drag tracking & Configurable Sensitivity Variables
    this.lastCameraX = 0;
    this.lastCameraY = 0;
    this.cameraSensitivity = 0.005; // Configurable horizontal sensitivity
    this.cameraPitchSensitivity = 0.004; // Configurable vertical sensitivity
    this.cameraInvertY = false; // Invert vertical swipe direction

    // Keyboard state fallback
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
    };

    this._initJoystick();
    this._initJumpButton();
    this._initCameraTouch();
    this._initKeyboard();
  }

  /**
   * Initializes virtual joystick touch handling with isolated pointer capture.
   */
  _initJoystick() {
    const el = this.ui.joystickContainer;
    if (!el) return;

    const handlePointerDown = (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (this.joystickPointerId !== null) return;
      this.joystickPointerId = e.pointerId;

      try {
        el.setPointerCapture(e.pointerId);
      } catch (_) {}

      const rect = el.getBoundingClientRect();
      this.joystickCenterX = rect.left + rect.width / 2;
      this.joystickCenterY = rect.top + rect.height / 2;

      this._updateJoystickPos(e.clientX, e.clientY);
    };

    const handlePointerMove = (e) => {
      if (e.pointerId !== this.joystickPointerId) return;
      e.preventDefault();
      e.stopPropagation();

      this._updateJoystickPos(e.clientX, e.clientY);
    };

    const handlePointerEnd = (e) => {
      if (e.pointerId !== this.joystickPointerId) return;
      e.preventDefault();
      e.stopPropagation();

      try {
        el.releasePointerCapture(e.pointerId);
      } catch (_) {}

      this._resetJoystick();
    };

    el.addEventListener('pointerdown', handlePointerDown);
    el.addEventListener('pointermove', handlePointerMove);
    el.addEventListener('pointerup', handlePointerEnd);
    el.addEventListener('pointercancel', handlePointerEnd);
    el.addEventListener('lostpointercapture', () => this._resetJoystick());
  }

  /**
   * Resets virtual joystick state.
   */
  _resetJoystick() {
    this.joystickPointerId = null;
    this.inputVector.x = 0;
    this.inputVector.y = 0;
    this.ui.setKnobPosition(0, 0, false);
  }

  /**
   * Calculates joystick displacement, clamps within radius, and sets normalized input.
   */
  _updateJoystickPos(clientX, clientY) {
    const rawDx = clientX - this.joystickCenterX;
    const rawDy = clientY - this.joystickCenterY;
    const distance = Math.hypot(rawDx, rawDy);

    let clampedDx = rawDx;
    let clampedDy = rawDy;

    if (distance > this.maxJoystickRadius) {
      const angle = Math.atan2(rawDy, rawDx);
      clampedDx = Math.cos(angle) * this.maxJoystickRadius;
      clampedDy = Math.sin(angle) * this.maxJoystickRadius;
    }

    // Normalized components (-1 to 1)
    // Invert Y so upward on screen is positive forward
    this.inputVector.x = clampedDx / this.maxJoystickRadius;
    this.inputVector.y = -clampedDy / this.maxJoystickRadius;

    this.ui.setKnobPosition(clampedDx, clampedDy, true);
  }

  /**
   * Initializes jump button touch handling with isolated pointer capture.
   */
  _initJumpButton() {
    const btn = this.ui.jumpButton;
    if (!btn) return;

    const handleDown = (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (this.jumpPointerId !== null) return;
      this.jumpPointerId = e.pointerId;

      try {
        btn.setPointerCapture(e.pointerId);
      } catch (_) {}

      this.ui.setJumpActive(true);
      if (typeof this.onJump === 'function') {
        this.onJump();
      }
    };

    const handleEnd = (e) => {
      if (e.pointerId !== this.jumpPointerId) return;
      e.preventDefault();
      e.stopPropagation();

      try {
        btn.releasePointerCapture(e.pointerId);
      } catch (_) {}

      this.jumpPointerId = null;
      this.ui.setJumpActive(false);
    };

    btn.addEventListener('pointerdown', handleDown);
    btn.addEventListener('pointerup', handleEnd);
    btn.addEventListener('pointercancel', handleEnd);
    btn.addEventListener('lostpointercapture', () => {
      this.jumpPointerId = null;
      this.ui.setJumpActive(false);
    });
  }

  /**
   * Initializes touch drag orbit for the camera on screen background.
   */
  _initCameraTouch() {
    const handlePointerDown = (e) => {
      // Do not capture pointer if it belongs to joystick or jump button
      if (e.pointerId === this.joystickPointerId || e.pointerId === this.jumpPointerId) {
        return;
      }

      // Ignore if touched inside joystick, jump button, or visible portrait overlay
      if (
        (this.ui.joystickContainer && this.ui.joystickContainer.contains(e.target)) ||
        (this.ui.jumpButton && this.ui.jumpButton.contains(e.target)) ||
        (this.ui.portraitOverlay && this.ui.portraitOverlay.contains(e.target) && this.ui.portraitOverlay.style.display !== 'none')
      ) {
        return;
      }

      // Assign first free touch to camera orbit
      if (this.cameraPointerId === null) {
        this.cameraPointerId = e.pointerId;
        this.lastCameraX = e.clientX;
        this.lastCameraY = e.clientY;
      }
    };

    const handlePointerMove = (e) => {
      if (e.pointerId !== this.cameraPointerId) return;

      const deltaX = e.clientX - this.lastCameraX;
      const deltaY = e.clientY - this.lastCameraY;

      this.lastCameraX = e.clientX;
      this.lastCameraY = e.clientY;

      if (typeof this.onCameraRotate === 'function') {
        // Dragging left turns camera left (yaw); dragging down rotates pitch down
        const deltaYaw = -deltaX * this.cameraSensitivity;
        const deltaPitch = (this.cameraInvertY ? deltaY : -deltaY) * this.cameraPitchSensitivity;
        this.onCameraRotate(deltaYaw, deltaPitch);
      }
    };

    const handlePointerEnd = (e) => {
      if (e.pointerId === this.cameraPointerId) {
        this.cameraPointerId = null;
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerEnd);
    window.addEventListener('pointercancel', handlePointerEnd);
  }

  /**
   * Keyboard fallback for testing & desktop browsers.
   */
  _initKeyboard() {
    window.addEventListener('keydown', (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.keys.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.keys.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.keys.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.keys.right = true;
          break;
        case 'Space':
          if (!e.repeat && typeof this.onJump === 'function') {
            this.onJump();
          }
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.keys.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.keys.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.keys.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.keys.right = false;
          break;
      }
    });

    window.addEventListener('blur', () => {
      this.resetAll();
    });
  }

  /**
   * Cleans up all active touch and keyboard states.
   */
  resetAll() {
    this._resetJoystick();
    this.jumpPointerId = null;
    this.cameraPointerId = null;
    this.ui.setJumpActive(false);
    this.keys.forward = false;
    this.keys.backward = false;
    this.keys.left = false;
    this.keys.right = false;
  }

  /**
   * Retrieves current composite movement input vector.
   * Combines virtual joystick and keyboard inputs.
   * @returns {{ x: number, y: number }}
   */
  getMovementInput() {
    // If virtual joystick is active, use it directly
    if (this.joystickPointerId !== null) {
      return this.inputVector;
    }

    // Otherwise compute from keyboard keys
    let kx = 0;
    let ky = 0;
    if (this.keys.left) kx -= 1;
    if (this.keys.right) kx += 1;
    if (this.keys.forward) ky += 1;
    if (this.keys.backward) ky -= 1;

    // Normalize diagonal keyboard speed
    const mag = Math.hypot(kx, ky);
    if (mag > 0.001) {
      return { x: kx / mag, y: ky / mag };
    }

    return { x: 0, y: 0 };
  }
}
