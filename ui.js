/**
 * UI Module for 3D RPG Mobile Prototype
 * Creates high-contrast, minimalist, inline SVG touch controls:
 * 1. Virtual Joystick (bottom-left)
 * 2. Jump Button (bottom-right)
 * 3. Portrait orientation overlay with "Mainkan Sekarang" fallback
 */

/**
 * Injects the minimalist inline SVG UI hierarchy into the DOM.
 * @returns {Object} References and control methods for interactive UI elements.
 */
export function createUI() {
  // Main overlay container
  const uiContainer = document.createElement('div');
  uiContainer.id = 'ui-container';

  // 1. Virtual Joystick (Bottom Left)
  const joystickContainer = document.createElement('div');
  joystickContainer.id = 'joystick-container';
  joystickContainer.setAttribute('role', 'region');
  joystickContainer.setAttribute('aria-label', 'Virtual Joystick');
  joystickContainer.innerHTML = `
    <svg class="joystick-svg" viewBox="0 0 140 140" width="140" height="140" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="ctrl-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#000000" flood-opacity="0.45" />
        </filter>
      </defs>
      <!-- Base Background & Outer Ring -->
      <circle cx="70" cy="70" r="58" fill="rgba(15, 23, 42, 0.45)" stroke="rgba(255, 255, 255, 0.85)" stroke-width="2.5" filter="url(#ctrl-shadow)" />
      <!-- Inner Guide Ring -->
      <circle cx="70" cy="70" r="28" fill="none" stroke="rgba(255, 255, 255, 0.35)" stroke-width="1.5" stroke-dasharray="4,4" />
      <!-- Center Movable Knob -->
      <g id="joystick-knob" style="transform: translate(0px, 0px);">
        <circle cx="70" cy="70" r="26" fill="rgba(255, 255, 255, 0.9)" stroke="rgba(15, 23, 42, 0.75)" stroke-width="2.5" filter="url(#ctrl-shadow)" />
        <circle cx="70" cy="70" r="7" fill="#2563EB" />
      </g>
    </svg>
  `;

  // 2. Jump Button (Bottom Right)
  const jumpButton = document.createElement('div');
  jumpButton.id = 'jump-button';
  jumpButton.setAttribute('role', 'button');
  jumpButton.setAttribute('aria-label', 'Jump');
  jumpButton.innerHTML = `
    <svg class="jump-svg" viewBox="0 0 88 88" width="86" height="86" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="jump-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#000000" flood-opacity="0.45" />
        </filter>
      </defs>
      <!-- Outer Button Circle with Dark Backing & Crisp White Border -->
      <circle class="jump-btn-bg" cx="44" cy="44" r="38" fill="rgba(15, 23, 42, 0.5)" stroke="rgba(255, 255, 255, 0.85)" stroke-width="2.5" filter="url(#jump-shadow)" />
      <!-- Up Arrow Icon -->
      <path d="M 44 24 L 62 42 L 51 42 L 51 62 L 37 62 L 37 42 L 26 42 Z" fill="#FFFFFF" />
    </svg>
  `;

  // 3. Portrait Orientation Warning Overlay (with Play Anyway button)
  const portraitOverlay = document.createElement('div');
  portraitOverlay.id = 'portrait-overlay';
  portraitOverlay.innerHTML = `
    <div class="portrait-card">
      <svg class="rotate-icon" viewBox="0 0 120 120" width="84" height="84" xmlns="http://www.w3.org/2000/svg">
        <!-- Phone Outline -->
        <rect x="42" y="20" width="36" height="66" rx="5" fill="rgba(15, 23, 42, 0.6)" stroke="#FFFFFF" stroke-width="2.5" />
        <circle cx="60" cy="78" r="2.5" fill="#FFFFFF" />
        <line x1="53" y1="26" x2="67" y2="26" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" />
        <!-- Rotating Curved Arrow -->
        <path d="M 94 48 A 42 42 0 0 1 54 100" fill="none" stroke="#38BDF8" stroke-width="3.5" stroke-linecap="round" />
        <polygon points="56,92 50,102 62,106" fill="#38BDF8" />
      </svg>
      <div class="portrait-text">Putar ke mode Landscape</div>
      <div class="portrait-subtext">Putar perangkat ke samping untuk tampilan optimal</div>
      <button id="btn-portrait-play" class="portrait-play-btn" type="button">
        Mainkan Sekarang
      </button>
    </div>
  `;

  uiContainer.appendChild(joystickContainer);
  uiContainer.appendChild(jumpButton);
  uiContainer.appendChild(portraitOverlay);
  document.body.appendChild(uiContainer);

  const knobElement = document.getElementById('joystick-knob');
  const playAnywayBtn = document.getElementById('btn-portrait-play');

  let userBypassedPortrait = false;

  const updateVisibility = (isPortrait) => {
    if (isPortrait && !userBypassedPortrait) {
      portraitOverlay.style.display = 'flex';
      joystickContainer.style.display = 'none';
      jumpButton.style.display = 'none';
    } else {
      portraitOverlay.style.display = 'none';
      joystickContainer.style.display = 'block';
      jumpButton.style.display = 'block';
    }
  };

  // Allow player to bypass overlay and play immediately in portrait
  if (playAnywayBtn) {
    playAnywayBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userBypassedPortrait = true;
      // Try orientation lock & fullscreen
      if (screen.orientation && typeof screen.orientation.lock === 'function') {
        screen.orientation.lock('landscape').catch(() => {});
      }
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
      updateVisibility(false);
    });
  }

  return {
    uiContainer,
    joystickContainer,
    jumpButton,
    portraitOverlay,
    knobElement,
    /**
     * Updates visual displacement of the joystick knob.
     * @param {number} dx
     * @param {number} dy
     * @param {boolean} immediate
     */
    setKnobPosition: (dx, dy, immediate = true) => {
      if (knobElement) {
        knobElement.style.transition = immediate ? 'none' : 'transform 0.15s ease-out';
        knobElement.style.transform = `translate(${dx}px, ${dy}px)`;
      }
    },
    /**
     * Visual feedback for jump button press.
     * @param {boolean} isPressed
     */
    setJumpActive: (isPressed) => {
      if (jumpButton) {
        if (isPressed) {
          jumpButton.classList.add('active');
        } else {
          jumpButton.classList.remove('active');
        }
      }
    },
    /**
     * Controls visibility of the portrait overlay.
     * @param {boolean} isPortrait
     */
    setPortraitOverlayVisible: (isPortrait) => {
      updateVisibility(isPortrait);
    },
  };
}
