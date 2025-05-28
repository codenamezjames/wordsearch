import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useWordGrid } from '../useWordGrid'
import { createPinia, setActivePinia } from 'pinia'

// Mock the game store
vi.mock('../../stores/game', () => ({
  useGameStore: () => ({
    difficulty: 'medium',
    words: ['TEST', 'HELLO', 'WORLD'],
  }),
}))

describe('useWordGrid', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('grid initialization', () => {
    it('creates an empty grid of the correct size', () => {
      const { grid, gridSize, placeWords } = useWordGrid()
      placeWords([]) // This internally calls createGrid
      expect(grid.value.length).toBe(gridSize.value)
      expect(grid.value[0].length).toBe(gridSize.value)
      expect(
        grid.value.every((row) => row.every((cell) => cell === '' || /[A-Z]/.test(cell))),
      ).toBe(true)
    })
  })

  describe('placeWords', () => {
    it('successfully places valid words on the grid', () => {
      const { placeWords } = useWordGrid()
      const words = ['CAT', 'DOG']
      const { placedWords, failedWords } = placeWords(words)

      expect(failedWords).toHaveLength(0)
      expect(placedWords).toHaveLength(2)
      expect(placedWords).toContain('CAT')
      expect(placedWords).toContain('DOG')
    })

    it('handles words that cannot be placed', () => {
      const { placeWords } = useWordGrid()
      const words = Array(50).fill('VERYLONGWORD') // Should be impossible to place all of these
      const { failedWords } = placeWords(words)
      expect(failedWords.length).toBeGreaterThan(0)
    })
  })

  describe('wordExistsInGrid', () => {
    it('finds words placed in the grid', () => {
      const { placeWords, wordExistsInGrid } = useWordGrid()
      const words = ['CAT', 'DOG']
      placeWords(words)

      expect(wordExistsInGrid('CAT')).toBe(true)
      expect(wordExistsInGrid('DOG')).toBe(true)
      expect(wordExistsInGrid('BIRD')).toBe(false)
    })

    it('finds words in reverse', () => {
      const { placeWords, wordExistsInGrid } = useWordGrid()
      const words = ['CAT']
      placeWords(words)

      // The word might be placed in reverse due to random placement
      const exists = wordExistsInGrid('CAT') || wordExistsInGrid('TAC')
      expect(exists).toBe(true)
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
})
