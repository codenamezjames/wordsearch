/**
 * GameStateStorage.js
 * Adapter for game state persistence using StorageService
 */
import { storageService } from './StorageService'

// Storage keys
const KEYS = {
  GAME_STATE: 'gameState',
  TIMER: 'gameTimer',
  SCORING: 'gameScoring',
  CHALLENGE: 'challengeMode',
  SETTINGS: 'settings',
}

/**
 * Save game state to storage
 * @param {Object} state - Game state to save
 * @returns {boolean} - Success status
 */
export function saveGameState(state) {
  return storageService.setItem(KEYS.GAME_STATE, state)
}

/**
 * Load game state from storage
 * @param {Object} defaultState - Default state if none exists
 * @returns {Object} - Loaded game state
 */
export function loadGameState(defaultState = {}) {
  const state = storageService.getItem(KEYS.GAME_STATE, defaultState)

  // Handle special data types (like Set for foundWords)
  if (state && state.foundWords && !(state.foundWords instanceof Set)) {
    state.foundWords = new Set(state.foundWords)
  }

  return state
}

/**
 * Save timer state to storage
 * @param {Object} state - Timer state to save
 * @returns {boolean} - Success status
 */
export function saveTimerState(state) {
  return storageService.setItem(KEYS.TIMER, state)
}

/**
 * Load timer state from storage
 * @param {Object} defaultState - Default state if none exists
 * @returns {Object} - Loaded timer state
 */
export function loadTimerState(defaultState = {}) {
  return storageService.getItem(KEYS.TIMER, defaultState)
}

/**
 * Save scoring state to storage
 * @param {Object} state - Scoring state to save
 * @returns {boolean} - Success status
 */
export function saveScoringState(state) {
  return storageService.setItem(KEYS.SCORING, state)
}

/**
 * Load scoring state from storage
 * @param {Object} defaultState - Default state if none exists
 * @returns {Object} - Loaded scoring state
 */
export function loadScoringState(defaultState = {}) {
  return storageService.getItem(KEYS.SCORING, defaultState)
}

/**
 * Save challenge mode state to storage
 * @param {Object} state - Challenge mode state to save
 * @returns {boolean} - Success status
 */
export function saveChallengeState(state) {
  return storageService.setItem(KEYS.CHALLENGE, state)
}

/**
 * Load challenge mode state from storage
 * @param {Object} defaultState - Default state if none exists
 * @returns {Object} - Loaded challenge mode state
 */
export function loadChallengeState(defaultState = {}) {
  return storageService.getItem(KEYS.CHALLENGE, defaultState)
}

/**
 * Save user settings to storage
 * @param {Object} settings - Settings to save
 * @returns {boolean} - Success status
 */
export function saveSettings(settings) {
  return storageService.setItem(KEYS.SETTINGS, settings)
}

/**
 * Load user settings from storage
 * @param {Object} defaultSettings - Default settings if none exist
 * @returns {Object} - Loaded settings
 */
export function loadSettings(defaultSettings = {}) {
  return storageService.getItem(KEYS.SETTINGS, defaultSettings)
}

/**
 * Clear all game data from storage
 * @returns {boolean} - Success status
 */
export function clearAllGameData() {
  let success = true

  success = storageService.removeItem(KEYS.GAME_STATE) && success
  success = storageService.removeItem(KEYS.TIMER) && success
  success = storageService.removeItem(KEYS.SCORING) && success
  success = storageService.removeItem(KEYS.CHALLENGE) && success

  return success
}

/**
 * Check if a saved game exists
 * @returns {boolean} - Whether a saved game exists
 */
export function hasSavedGame() {
  return storageService.getItem(KEYS.GAME_STATE) !== null
}

/**
 * Get high scores from storage
 * @param {string} difficulty - Difficulty level
 * @param {number} limit - Maximum number of scores to return
 * @returns {Array} - Array of high scores
 */
export function getHighScores(difficulty = 'medium', limit = 10) {
  const key = `highScores_${difficulty}`
  return storageService.getItem(key, []).slice(0, limit)
}

/**
 * Save a new high score
 * @param {string} difficulty - Difficulty level
 * @param {Object} scoreData - Score data to save
 * @returns {boolean} - Success status
 */
export function saveHighScore(difficulty, scoreData) {
  const key = `highScores_${difficulty}`
  const scores = getHighScores(difficulty, 100) // Get all scores

  // Add new score
  scores.push({
    ...scoreData,
    timestamp: Date.now(),
  })

  // Sort by score (descending)
  scores.sort((a, b) => b.score - a.score)

  // Keep only top 100
  const trimmedScores = scores.slice(0, 100)

  return storageService.setItem(key, trimmedScores)
}

/**
 * Get user statistics
 * @returns {Object} - User statistics
 */
export function getUserStats() {
  return storageService.getItem('userStats', {
    gamesPlayed: 0,
    wordsFound: 0,
    totalScore: 0,
    averageScore: 0,
    bestScore: 0,
    totalPlayTime: 0,
    challengesCompleted: 0,
    challengesWon: 0,
  })
}

/**
 * Update user statistics
 * @param {Object} statsUpdate - Statistics to update
 * @returns {Object} - Updated statistics
 */
export function updateUserStats(statsUpdate) {
  const currentStats = getUserStats()
  const newStats = { ...currentStats, ...statsUpdate }

  // Recalculate derived stats
  if (newStats.gamesPlayed > 0) {
    newStats.averageScore = Math.round(newStats.totalScore / newStats.gamesPlayed)
  }

  storageService.setItem('userStats', newStats)
  return newStats
}

export default {
  saveGameState,
  loadGameState,
  saveTimerState,
  loadTimerState,
  saveScoringState,
  loadScoringState,
  saveChallengeState,
  loadChallengeState,
  saveSettings,
  loadSettings,
  clearAllGameData,
  hasSavedGame,
  getHighScores,
  saveHighScore,
  getUserStats,
  updateUserStats,
}
