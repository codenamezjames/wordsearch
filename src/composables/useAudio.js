import { computed } from 'vue'
import { useGameStore } from '../stores/game'

/** @type {AudioContext|null} */
let audioContext = null

/** @type {boolean} */
let userActivated = false

/**
 * Attach user gesture listener for audio activation
 * @returns {void}
 */
const attachUserGestureListener = () => {
  if (attachUserGestureListener._attached) return
  attachUserGestureListener._attached = true

  const activate = () => {
    userActivated = true
    window.removeEventListener('click', activate)
    window.removeEventListener('keydown', activate)
    window.removeEventListener('touchstart', activate)
  }

  window.addEventListener('click', activate, { once: true })
  window.addEventListener('keydown', activate, { once: true })
  window.addEventListener('touchstart', activate, { once: true })
}

/**
 * @typedef {Object} SoundEffect
 * @property {string} name - Sound effect name
 * @property {number} frequency - Base frequency
 * @property {number} duration - Sound duration in seconds
 * @property {OscillatorType} type - Oscillator type
 * @property {number} volume - Sound volume (0-1)
 */

/**
 * Audio composable for game sound effects
 * @returns {{
 *   isSoundEnabled: import('vue').ComputedRef<boolean>,
 *   playSound: (frequency: number, duration: number, type: OscillatorType, volume: number) => void,
 *   playEffect: (effect: SoundEffect) => void,
 *   cleanup: () => void
 * }}
 */
export function useAudio() {
  const gameStore = useGameStore()

  /** @type {import('vue').ComputedRef<boolean>} */
  const isSoundEnabled = computed(() => gameStore.soundEnabled)

  /**
   * Initialize audio context
   * @returns {void}
   */
  const initAudioContext = () => {
    if (!audioContext && userActivated) {
      audioContext = new AudioContext()
    }
  }

  /**
   * Play a sound with given parameters
   * @param {number} frequency - Sound frequency in Hz
   * @param {number} duration - Sound duration in seconds
   * @param {OscillatorType} type - Oscillator type
   * @param {number} volume - Sound volume (0-1)
   * @returns {void}
   */
  const playSound = (frequency, duration, type = 'sine', volume = 0.1) => {
    if (!isSoundEnabled.value) return
    initAudioContext()
    if (!audioContext) return

    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime)

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.start()
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration)
    oscillator.stop(audioContext.currentTime + duration)
  }

  /**
   * Play a predefined sound effect
   * @param {SoundEffect} effect - Sound effect to play
   * @returns {void}
   */
  const playEffect = (effect) => {
    playSound(effect.frequency, effect.duration, effect.type, effect.volume)
  }

  /**
   * Cleanup function
   * @returns {void}
   */
  const cleanup = () => {
    if (audioContext) {
      audioContext.close()
      audioContext = null
    }
  }

  // Attach user gesture listener
  attachUserGestureListener()

  return {
    isSoundEnabled,
    playSound,
    playEffect,
    cleanup,
  }
}
