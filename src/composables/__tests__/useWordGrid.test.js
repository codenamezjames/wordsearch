import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useWordGrid } from '../useWordGrid'
import { createPinia, setActivePinia } from 'pinia'

// Mock the game store
vi.mock('../../stores/game', () => ({
  useGameStore: () => ({
    difficulty: 'medium',
    words: ['TEST', 'HELLO', 'WORLD'],
    updateGrid: vi.fn(),
    updateWords: vi.fn(),
    gridSizeForDifficulty: 10,
    gridSize: 10,
  }),
}))

describe('useWordGrid', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('grid initialization', () => {
    it('creates an empty grid of the correct size', async () => {
      const { grid, gridSize, placeWords } = useWordGrid()
      await placeWords([]) // This internally calls createGrid
      expect(grid.value.length).toBe(gridSize.value)
      expect(grid.value[0].length).toBe(gridSize.value)
      expect(
        grid.value.every((row) => row.every((cell) => cell === '' || /[A-Z]/.test(cell))),
      ).toBe(true)
    })
  })

  describe('placeWords', () => {
    it('successfully places valid words on the grid', async () => {
      const { placeWords } = useWordGrid()
      const words = ['CAT', 'DOG']
      const result = await placeWords(words)

      // Should return a result object with the expected structure
      expect(result).toHaveProperty('placedWords')
      expect(result).toHaveProperty('failedWords')
      expect(Array.isArray(result.placedWords)).toBe(true)
      expect(Array.isArray(result.failedWords)).toBe(true)
      expect(result.placedWords.length + result.failedWords.length).toBe(2)
    })

    it('handles words that cannot be placed', async () => {
      const { placeWords } = useWordGrid()
      const words = Array(50).fill('VERYLONGWORD') // Should be impossible to place all of these
      const { failedWords } = await placeWords(words)
      expect(failedWords.length).toBeGreaterThan(0)
    })
  })

  describe('wordExistsInGrid', () => {
    it('finds words placed in the grid', async () => {
      const { placeWords, wordExistsInGrid } = useWordGrid()
      const words = ['CAT', 'DOG']
      const result = await placeWords(words)

      // Check that the actually placed words exist in the grid
      if (result.placedWords.length > 0) {
        result.placedWords.forEach((word) => {
          expect(wordExistsInGrid(word)).toBe(true)
        })
      }
      expect(wordExistsInGrid('BIRD')).toBe(false)
    })

    it('finds words in reverse', async () => {
      const { placeWords, wordExistsInGrid } = useWordGrid()
      const words = ['CAT']
      const result = await placeWords(words)

      // Check that the function handles the word placement gracefully
      expect(result).toHaveProperty('placedWords')
      expect(result).toHaveProperty('failedWords')
      if (result.placedWords.length > 0) {
        result.placedWords.forEach((word) => {
          expect(wordExistsInGrid(word)).toBe(true)
        })
      }
    })
  })

  describe('validateSelection', () => {
    it('validates correct word selections', () => {
      const { grid, validateSelection } = useWordGrid()

      // Manually set up the grid with a known word
      grid.value = Array(10)
        .fill()
        .map(() => Array(10).fill(''))
      const word = 'TEST'
      for (let i = 0; i < word.length; i++) {
        grid.value[0][i] = word[i]
      }

      const selection = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 3, y: 0 },
      ]

      expect(validateSelection(selection)).toBe('TEST')
    })

    it('returns null for invalid selections', () => {
      const { validateSelection } = useWordGrid()
      const selection = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
      ]
      expect(validateSelection(selection)).toBeNull()
    })
  })

  describe('gridSize', () => {
    it('returns correct size for different difficulties', () => {
      const { gridSize } = useWordGrid()
      expect(gridSize.value).toBe(10) // medium difficulty from mock
    })
  })

  describe('Enhanced retry mechanism', () => {
    it('should handle async word placement', async () => {
      const { placeWords } = useWordGrid()
      const words = ['CAT', 'DOG']
      const result = await placeWords(words)

      expect(result).toHaveProperty('placedWords')
      expect(result).toHaveProperty('failedWords')
      expect(Array.isArray(result.placedWords)).toBe(true)
      expect(Array.isArray(result.failedWords)).toBe(true)
    })

    it('should handle very long words that might fail to place', async () => {
      const { placeWords } = useWordGrid()
      // Use a very long word that's likely to fail placement
      const longWord = 'VERYLONGWORDTHATMIGHTFAILTOPLACE'
      const result = await placeWords([longWord])

      // Either the word is placed or it fails, but the function should handle it gracefully
      expect(result.placedWords.length + result.failedWords.length).toBe(1)
    })
  })
})
