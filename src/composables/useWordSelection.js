// useWordSelection.js - Selection and interaction logic
import { ref, computed } from 'vue'
import { useGameStore } from '../stores/game'

/**
 * @typedef {Object} Coordinates
 * @property {number} x - X coordinate
 * @property {number} y - Y coordinate
 */

/**
 * @typedef {Object} ScreenCoordinates
 * @property {number} screenX - Screen X coordinate
 * @property {number} screenY - Screen Y coordinate
 * @property {number} x - Grid X coordinate
 * @property {number} y - Grid Y coordinate
 * @property {HTMLElement} element - DOM element
 */

/**
 * @typedef {Object} SelectionLine
 * @property {number} x1 - Start X coordinate
 * @property {number} y1 - Start Y coordinate
 * @property {number} x2 - End X coordinate
 * @property {number} y2 - End Y coordinate
 */

/**
 * Word selection composable for handling user interactions
 */
export function useWordSelection() {
  const gameStore = useGameStore()

  /** @type {import('vue').Ref<boolean>} */
  const isSelecting = ref(false)

  /** @type {import('vue').Ref<ScreenCoordinates|null>} */
  const selectionStart = ref(null)

  /** @type {import('vue').Ref<ScreenCoordinates|null>} */
  const selectionEnd = ref(null)

  /** @type {import('vue').Ref<Coordinates[]>} */
  const selectedCells = ref([])

  /** @type {import('vue').Ref<SelectionLine[]>} */
  const permanentLines = ref([])

  /** @type {import('vue').ComputedRef<SelectionLine|null>} */
  const selectionLine = computed(() => {
    if (!isSelecting.value || !selectionStart.value || !selectionEnd.value) {
      return null
    }

    const startX = selectionStart.value.screenX
    const startY = selectionStart.value.screenY
    const endX = selectionEnd.value.screenX
    const endY = selectionEnd.value.screenY

    // Calculate grid-space direction
    const dx = selectionEnd.value.x - selectionStart.value.x
    const dy = selectionEnd.value.y - selectionStart.value.y

    // If no movement, return line to self
    if (dx === 0 && dy === 0) {
      return {
        x1: startX,
        y1: startY,
        x2: startX,
        y2: startY,
      }
    }

    // Determine the dominant direction
    const isHorizontal = Math.abs(dx) > 0 && dy === 0
    const isVertical = dx === 0 && Math.abs(dy) > 0
    const isDiagonal = Math.abs(dx) === Math.abs(dy)

    let snappedEndX = endX
    let snappedEndY = endY

    if (!isHorizontal && !isVertical && !isDiagonal) {
      // Snap to the closest valid direction
      const absDx = Math.abs(dx)
      const absDy = Math.abs(dy)

      if (absDx > absDy) {
        // Snap to horizontal
        snappedEndY = startY
      } else if (absDy > absDx) {
        // Snap to vertical
        snappedEndX = startX
      } else {
        // Snap to diagonal
        const cellSize = Math.abs(endX - startX) / Math.abs(dx) // Approximate cell size
        const length = Math.min(absDx, absDy)
        const signX = dx > 0 ? 1 : -1
        const signY = dy > 0 ? 1 : -1
        snappedEndX = startX + length * cellSize * signX
        snappedEndY = startY + length * cellSize * signY
      }
    }

    return {
      x1: startX,
      y1: startY,
      x2: snappedEndX,
      y2: snappedEndY,
    }
  })

  /**
   * Get screen coordinates from event
   * @param {Event} event - Mouse or touch event
   * @returns {ScreenCoordinates|null} Screen coordinates
   */
  const getScreenCoordinates = (event) => {
    const element = event.target.closest('.grid-cell')
    if (!element) return null

    const gridContainer = document.querySelector('.game-grid')
    if (!gridContainer) return null

    const rect = element.getBoundingClientRect()
    const containerRect = gridContainer.getBoundingClientRect()
    const x = parseInt(element.dataset.x)
    const y = parseInt(element.dataset.y)

    // Calculate center of cell relative to grid container
    const screenX = rect.left + rect.width / 2 - containerRect.left
    const screenY = rect.top + rect.height / 2 - containerRect.top

    return {
      screenX,
      screenY,
      x,
      y,
      element,
    }
  }

  /**
   * Calculate cell center position
   * @param {number} x - Grid X coordinate
   * @param {number} y - Grid Y coordinate
   * @returns {{ x: number, y: number }|null} Cell center coordinates
   */
  const getCellCenter = (x, y) => {
    const cell = document.querySelector(`.grid-cell[data-x="${x}"][data-y="${y}"]`)
    const gridContainer = document.querySelector('.game-grid')
    if (!cell || !gridContainer) return null

    const rect = cell.getBoundingClientRect()
    const containerRect = gridContainer.getBoundingClientRect()

    return {
      x: rect.left + rect.width / 2 - containerRect.left,
      y: rect.top + rect.height / 2 - containerRect.top,
    }
  }

  /**
   * Update selection based on current cell
   * @param {Coordinates} cell - Current cell coordinates
   */
  const updateSelection = (cell) => {
    if (!selectionStart.value || !gameStore.grid.length) return

    const startCell = {
      x: selectionStart.value.x,
      y: selectionStart.value.y,
    }

    // Validate cell coordinates are within grid bounds
    if (
      cell.x < 0 ||
      cell.x >= gameStore.grid[0].length ||
      cell.y < 0 ||
      cell.y >= gameStore.grid.length ||
      startCell.x < 0 ||
      startCell.x >= gameStore.grid[0].length ||
      startCell.y < 0 ||
      startCell.y >= gameStore.grid.length
    ) {
      return
    }

    // Calculate direction vector
    const dx = cell.x - startCell.x
    const dy = cell.y - startCell.y

    // If no movement, select just the start cell
    if (dx === 0 && dy === 0) {
      selectedCells.value = [startCell]
      return
    }

    // Determine exact direction type
    const isHorizontal = dy === 0
    const isVertical = dx === 0
    const isDiagonalUpRight = Math.abs(dx) === Math.abs(dy) && dy < 0 && dx > 0
    const isDiagonalUpLeft = Math.abs(dx) === Math.abs(dy) && dy < 0 && dx < 0
    const isDiagonalDownRight = Math.abs(dx) === Math.abs(dy) && dy > 0 && dx > 0
    const isDiagonalDownLeft = Math.abs(dx) === Math.abs(dy) && dy > 0 && dx < 0

    // Only allow exact 0, 45, or 90 degree angles
    const isValidDirection =
      isHorizontal ||
      isVertical ||
      isDiagonalUpRight ||
      isDiagonalUpLeft ||
      isDiagonalDownRight ||
      isDiagonalDownLeft

    if (!isValidDirection) {
      // Invalid direction - keep only start cell selected
      selectedCells.value = [startCell]
      return
    }

    // Calculate step size (should always be 1, 0, or -1 in both directions)
    const length = Math.max(Math.abs(dx), Math.abs(dy))
    const stepX = dx / length
    const stepY = dy / length

    // Extra validation to ensure steps are exactly 1, 0, or -1
    if (![-1, 0, 1].includes(stepX) || ![-1, 0, 1].includes(stepY)) {
      selectedCells.value = [startCell]
      return
    }

    // Generate cells along the line
    selectedCells.value = Array.from({ length: length + 1 }, (_, i) => ({
      x: startCell.x + Math.round(stepX * i),
      y: startCell.y + Math.round(stepY * i),
    }))
  }

  /**
   * Check if selected cells form a word
   * @returns {string|null} Found word or null
   */
  const checkForWord = () => {
    if (selectedCells.value.length < 2) return null

    // Get letters from selected cells
    const word = selectedCells.value
      .map((cell) => {
        // Ensure we're within grid bounds
        if (
          cell.y >= 0 &&
          cell.y < gameStore.grid.length &&
          cell.x >= 0 &&
          cell.x < gameStore.grid[cell.y].length
        ) {
          return gameStore.grid[cell.y][cell.x]
        }
        return ''
      })
      .join('')

    // Check forward and reverse
    if (gameStore.words.includes(word)) {
      return word
    }
    const reversed = word.split('').reverse().join('')
    if (gameStore.words.includes(reversed)) {
      return reversed
    }

    return null
  }

  /**
   * Handle selection end
   */
  const handleSelectionEnd = () => {
    if (!isSelecting.value) return

    const word = checkForWord()
    if (word) {
      // Capture selected cells data before clearing
      const foundWordData = {
        word,
        selectedCells: [...selectedCells.value], // Copy the array
        startCell: selectedCells.value[0],
        endCell: selectedCells.value[selectedCells.value.length - 1],
      }

      // Get start and end cells
      const startCell = selectedCells.value[0]
      const endCell = selectedCells.value[selectedCells.value.length - 1]

      // Get cell centers
      const startCenter = getCellCenter(startCell.x, startCell.y)
      const endCenter = getCellCenter(endCell.x, endCell.y)

      if (startCenter && endCenter) {
        // Add permanent line with relative coordinates
        permanentLines.value.push({
          x1: startCenter.x,
          y1: startCenter.y,
          x2: endCenter.x,
          y2: endCenter.y,
        })
      }

      // Add found word with the captured data
      gameStore.addFoundWord(word, foundWordData)
    }

    // Reset selection
    isSelecting.value = false
    selectionStart.value = null
    selectionEnd.value = null
    selectedCells.value = []
  }

  /**
   * Mouse event handler for starting selection
   * @param {MouseEvent} event - Mouse event
   */
  const handleMouseDown = (event) => {
    const coords = getScreenCoordinates(event)
    if (!coords) return

    isSelecting.value = true
    selectionStart.value = coords
    selectionEnd.value = coords
    updateSelection(coords)
  }

  /**
   * Mouse event handler for updating selection
   * @param {MouseEvent} event - Mouse event
   */
  const handleMouseMove = (event) => {
    if (!isSelecting.value) return

    const coords = getScreenCoordinates(event)
    if (!coords) return

    selectionEnd.value = coords
    updateSelection(coords)
  }

  /**
   * Mouse event handler for ending selection
   */
  const handleMouseUp = () => {
    handleSelectionEnd()
  }

  /**
   * Touch event handler for starting selection
   * @param {TouchEvent} event - Touch event
   */
  const handleTouchStart = (event) => {
    const touch = event.touches[0]
    const element = document.elementFromPoint(touch.clientX, touch.clientY)
    if (!element) return

    const coords = getScreenCoordinates({ target: element })
    if (!coords) return

    isSelecting.value = true
    selectionStart.value = coords
    selectionEnd.value = coords
    updateSelection(coords)
  }

  /**
   * Touch event handler for updating selection
   * @param {TouchEvent} event - Touch event
   */
  const handleTouchMove = (event) => {
    if (!isSelecting.value) return

    const touch = event.touches[0]
    const element = document.elementFromPoint(touch.clientX, touch.clientY)
    if (!element) return

    const coords = getScreenCoordinates({ target: element })
    if (!coords) return

    selectionEnd.value = coords
    updateSelection(coords)
  }

  /**
   * Touch event handler for ending selection
   */
  const handleTouchEnd = () => {
    handleSelectionEnd()
  }

  /**
   * Cleanup function
   */
  const cleanup = () => {
    isSelecting.value = false
    selectionStart.value = null
    selectionEnd.value = null
    selectedCells.value = []
    permanentLines.value = []
  }

  return {
    isSelecting,
    selectedCells,
    selectionLine,
    permanentLines,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    cleanup,
  }
}
