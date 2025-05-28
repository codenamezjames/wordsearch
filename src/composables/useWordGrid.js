// useWordGrid.js - Grid generation and word placement logic
import { ref, computed, watch } from 'vue'
import { useGameStore } from '../stores/game'

/**
 * @typedef {Object} GridCell
 * @property {string} letter - The letter in the cell
 * @property {boolean} isSelected - Whether the cell is currently selected
 * @property {boolean} isFound - Whether the cell is part of a found word
 * @property {number} row - The row index of the cell
 * @property {number} col - The column index of the cell
 */

/**
 * @typedef {Object} WordPlacement
 * @property {string} word - The word to place
 * @property {number} row - Starting row
 * @property {number} col - Starting column
 * @property {number} direction - Direction index (0-7)
 */

/**
 * @typedef {Object} GridConfig
 * @property {number} size - Grid size (width/height)
 * @property {string[]} words - Words to place in the grid
 */

/**
 * Word grid composable for managing the game grid
 * @returns {{
 *   grid: import('vue').Ref<string[][]>,
 *   gridSize: import('vue').ComputedRef<number>,
 *   initializeGrid: () => void,
 *   placeWords: (words: string[]) => { placedWords: string[], failedWords: string[] },
 *   selectCell: (row: number, col: number) => void,
 *   clearSelection: () => void,
 *   reset: () => void
 * }}
 */
export function useWordGrid() {
  const gameStore = useGameStore()

  /** @type {import('vue').Ref<string[][]>} */
  const grid = ref([])

  /** @type {import('vue').ComputedRef<number>} */
  const gridSize = computed(() => gameStore.gridSize)

  // Directions for word placement (8 possible directions)
  const directions = [
    [0, 1], // right
    [1, 0], // down
    [1, 1], // diagonal down-right
    [-1, 1], // diagonal up-right
    [0, -1], // left
    [-1, 0], // up
    [-1, -1], // diagonal up-left
    [1, -1], // diagonal down-left
  ]

  /**
   * Initialize an empty grid
   * @param {boolean} [shouldPlaceWords=true] - Whether to place words after initialization
   * @returns {void}
   */
  const initializeGrid = (shouldPlaceWords = true) => {
    const size = gridSize.value

    if (size <= 0) {
      return
    }

    // Initialize with empty cells
    grid.value = Array(size)
      .fill(null)
      .map(() => Array(size).fill(''))

    // Get words from game store and place them
    if (shouldPlaceWords) {
      const words = gameStore.words
      if (words.length > 0) {
        placeWordsOnGrid(words)
      }
    }

    // Update game store grid
    gameStore.updateGrid(grid.value)
  }

  /**
   * Check if a word can be placed at a position in a direction
   * @param {string} word - Word to check
   * @param {number} row - Starting row
   * @param {number} col - Starting column
   * @param {number[]} direction - Direction vector [dy, dx]
   * @returns {boolean} - Whether the word can be placed
   */
  const canPlaceWord = (word, row, col, direction) => {
    const size = gridSize.value
    const [dy, dx] = direction

    // Check if word fits within grid bounds
    if (
      row + dy * (word.length - 1) < 0 ||
      row + dy * (word.length - 1) >= size ||
      col + dx * (word.length - 1) < 0 ||
      col + dx * (word.length - 1) >= size
    ) {
      return false
    }

    // Check if path is clear or matches existing letters
    for (let i = 0; i < word.length; i++) {
      const y = row + dy * i
      const x = col + dx * i
      const cell = grid.value[y][x]
      if (cell !== '' && cell !== word[i]) {
        return false
      }
    }

    return true
  }

  /**
   * Place a word on the grid
   * @param {string} word - Word to place
   * @param {number} row - Starting row
   * @param {number} col - Starting column
   * @param {number[]} direction - Direction vector [dy, dx]
   */
  const placeWord = (word, row, col, direction) => {
    const [dy, dx] = direction
    for (let i = 0; i < word.length; i++) {
      const y = row + dy * i
      const x = col + dx * i
      grid.value[y][x] = word[i]
    }
  }

  /**
   * Fill empty cells with random letters
   */
  const fillEmptyCells = () => {
    const size = gridSize.value
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (grid.value[y][x] === '') {
          grid.value[y][x] = getRandomLetter()
        }
      }
    }
  }

  /**
   * Get a random letter
   * @returns {string} - Random letter
   */
  const getRandomLetter = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    return letters[Math.floor(Math.random() * letters.length)]
  }

  /**
   * Place words on the grid
   * @param {string[]} words - Words to place
   * @returns {{ placedWords: string[], failedWords: string[] }} - Results of word placement
   */
  const placeWordsOnGrid = (words) => {
    const placedWords = []
    const failedWords = []
    const size = gridSize.value

    // Sort words by length (longest first for better placement)
    const sortedWords = [...words].sort((a, b) => b.length - a.length)

    // Try to place each word
    for (const word of sortedWords) {
      let placed = false
      // Try multiple times with random positions
      for (let attempts = 0; attempts < 100 && !placed; attempts++) {
        const row = Math.floor(Math.random() * size)
        const col = Math.floor(Math.random() * size)
        const direction = directions[Math.floor(Math.random() * directions.length)]

        if (canPlaceWord(word, row, col, direction)) {
          placeWord(word, row, col, direction)
          placedWords.push(word)
          placed = true
        }
      }
      if (!placed) {
        failedWords.push(word)
      }
    }

    // Fill remaining cells with random letters
    fillEmptyCells()

    // Update game store grid
    gameStore.updateGrid(grid.value)

    return { placedWords, failedWords }
  }

  /**
   * Place words on the grid and initialize
   * @param {string[]} words - Words to place
   * @returns {{ placedWords: string[], failedWords: string[] }} - Results of word placement
   */
  const placeWords = (words) => {
    // Initialize empty grid without placing words
    initializeGrid(false)
    // Place words on the empty grid
    return placeWordsOnGrid(words)
  }

  /**
   * Select a cell in the grid
   * @param {number} row - Row index
   * @param {number} col - Column index
   * @returns {void}
   */
  const selectCell = (/*row, col*/) => {
    // TODO: Implement cell selection logic
  }

  /**
   * Clear current selection
   * @returns {void}
   */
  const clearSelection = () => {
    // TODO: Implement selection clearing
  }

  /**
   * Reset the grid
   * @returns {void}
   */
  const reset = () => {
    grid.value = []
  }

  // Watch for grid size changes and reinitialize
  watch(
    [gridSize, () => gameStore.words],
    ([newSize, newWords]) => {
      if (newSize > 0 && newWords?.length > 0) {
        placeWords(newWords)
      } else if (newSize > 0) {
        initializeGrid(false)
      }
    },
    { immediate: true },
  )

  // Watch grid changes and sync with game store
  watch(
    grid,
    (newGrid) => {
      if (newGrid.length > 0) {
        gameStore.updateGrid(newGrid)
      }
    },
    { deep: true },
  )

  return {
    grid,
    gridSize,
    initializeGrid,
    placeWords,
    selectCell,
    clearSelection,
    reset,
  }
}
