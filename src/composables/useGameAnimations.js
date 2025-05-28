import { ref, onUnmounted } from 'vue'
import confetti from 'canvas-confetti'
import gsap from 'gsap'

/**
 * @typedef {Object} AnimationFrame
 * @property {number} id - The animation frame ID
 */

/**
 * Game animations composable for visual feedback and effects
 * @returns {{
 *   confettiContainer: import('vue').Ref<HTMLElement|null>,
 *   createFloatingText: (text: string, x: number, y: number) => void,
 *   createParticles: (x: number, y: number, color: string) => void,
 *   createSparkles: (element: HTMLElement) => void,
 *   triggerVictoryConfetti: () => void,
 *   cleanup: () => void
 * }}
 */
export function useGameAnimations() {
  /** @type {import('vue').Ref<HTMLElement|null>} */
  const confettiContainer = ref(null)

  /**
   * Creates floating text animation
   * @param {string} text - Text to display
   * @param {number} x - Starting X position
   * @param {number} y - Starting Y position
   * @returns {void}
   */
  const createFloatingText = (text, x, y) => {
    console.log('Animation starting for:', text, 'at', x, y)

    // Create the floating text element
    const element = document.createElement('div')
    element.textContent = text
    element.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      font-size: 28px;
      font-weight: 600;
      color: var(--q-primary);
      pointer-events: none;
      z-index: 99999;
      transform: translate(-50%, -50%);
      opacity: 0;
      text-shadow: 0 0 15px currentColor,
                   0 0 5px currentColor,
                   0 2px 4px rgba(0, 0, 0, 0.2);
    `
    document.body.appendChild(element)

    // Simple two-part animation
    gsap
      .timeline()
      .to(element, {
        opacity: 1,
        duration: 0.2,
        ease: 'power1.out',
      })
      .to(element, {
        y: '-=60',
        opacity: 0,
        duration: 0.8,
        ease: 'power1.in',
        onComplete: () => element.remove(),
      })
  }

  /**
   * Creates particle burst animation
   * @param {number} x - Starting X position
   * @param {number} y - Starting Y position
   * @param {string} color - Particle color
   * @returns {void}
   */
  const createParticles = (x, y, color) => {
    const count = 12
    const particles = []

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div')
      particle.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        width: 8px;
        height: 8px;
        background: ${color};
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
      `
      document.body.appendChild(particle)
      particles.push(particle)

      const angle = (i / count) * Math.PI * 2
      const velocity = 2 + Math.random() * 2
      const dx = Math.cos(angle) * velocity
      const dy = Math.sin(angle) * velocity

      gsap.to(particle, {
        x: `+=${dx * 40}`,
        y: `+=${dy * 40}`,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
        onComplete: () => particle.remove(),
      })
    }
  }

  /**
   * Creates sparkle animation around an element
   * @param {HTMLElement} element - Target element
   * @returns {void}
   */
  const createSparkles = (element) => {
    const rect = element.getBoundingClientRect()
    const sparkleCount = 6
    const sparkles = []

    for (let i = 0; i < sparkleCount; i++) {
      const sparkle = document.createElement('div')
      sparkle.style.cssText = `
        position: fixed;
        width: 4px;
        height: 4px;
        background: gold;
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        box-shadow: 0 0 4px gold;
      `
      document.body.appendChild(sparkle)
      sparkles.push(sparkle)

      const startX = rect.left + rect.width * Math.random()
      const startY = rect.top + rect.height * Math.random()
      sparkle.style.left = `${startX}px`
      sparkle.style.top = `${startY}px`

      gsap.to(sparkle, {
        scale: 0,
        opacity: 0,
        duration: 0.6,
        delay: i * 0.1,
        ease: 'power2.out',
        onComplete: () => sparkle.remove(),
      })
    }
  }

  /**
   * Triggers victory confetti animation
   * @returns {void}
   */
  const triggerVictoryConfetti = () => {
    if (!confettiContainer.value) return

    const myConfetti = confetti.create(confettiContainer.value, {
      resize: true,
      useWorker: false,
    })

    const end = Date.now() + 1000

    const colors = ['#26a69a', '#4caf50', '#ffc107']

    ;(function frame() {
      myConfetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
      })
      myConfetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    })()
  }

  /**
   * Cleanup function to cancel active animations
   * @returns {void}
   */
  const cleanup = () => {
    // Remove any remaining animation elements
    const elements = document.querySelectorAll('.animation-element')
    elements.forEach((el) => el.remove())
  }

  // Cleanup on unmount
  onUnmounted(cleanup)

  return {
    confettiContainer,
    createFloatingText,
    createParticles,
    createSparkles,
    triggerVictoryConfetti,
    cleanup,
  }
}
