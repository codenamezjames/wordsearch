/* eslint-disable no-undef */
describe('Word Search Game', () => {
  beforeEach(() => {
    // Visit the app
    cy.visit('/')

    // Wait for the start menu to load
    cy.get('.start-menu-page').should('be.visible')
  })

  it('should complete a full game successfully', () => {
    // Step 1: Select Easy difficulty
    cy.get('[data-test="difficulty-easy"]').click()
    cy.get('[data-test="difficulty-easy"]').should('have.class', 'active')

    // Step 2: Select a category (e.g., animals)
    cy.get('[data-test="category-animals"]').click()
    cy.get('[data-test="category-animals"]').should('have.class', 'active')

    // Step 3: Start the game
    cy.get('[data-test="start-game-button"]').click()

    // Step 4: Wait for game page to load
    cy.waitForGameReady()

    // Step 5: Get all words from the word list
    let wordsToFind = []
    cy.get('.word-list-compact .word-chip')
      .each(($el) => {
        wordsToFind.push($el.find('.word-text').text().trim())
      })
      .then(() => {
        cy.log(`Found ${wordsToFind.length} words to find: ${wordsToFind.join(', ')}`)
      })

    // Step 6: Get the grid content and find words
    cy.get('[data-test^="grid-cell-"]').then(($cells) => {
      // Determine grid size (assuming square grid)
      const gridSize = Math.sqrt($cells.length)
      cy.log(`Grid size: ${gridSize}x${gridSize}`)

      // Build grid content array
      let gridContent = []
      for (let i = 0; i < $cells.length; i++) {
        const row = Math.floor(i / gridSize)
        const col = i % gridSize
        if (!gridContent[row]) gridContent[row] = []
        gridContent[row][col] = $cells.eq(i).text().trim()
      }

      cy.log('Grid content:', gridContent)

      // Try to find and select each word
      wordsToFind.forEach((word) => {
        const position = findWordInGrid(gridContent, word)
        if (position) {
          cy.log(`Found word "${word}" at position:`, position)

          // Select the word
          const startCell = `${position.startRow}-${position.startCol}`
          const endCell = `${position.endRow}-${position.endCol}`

          cy.selectWord(startCell, endCell)

          // Verify the word is marked as found
          cy.checkWordFound(word)

          // Small delay between selections
          cy.wait(300)
        } else {
          cy.log(`Could not find word "${word}" in grid`)
        }
      })
    })

    // Step 7: Verify the end game modal appears
    cy.get('[data-test="end-game-modal"]').should('be.visible')

    // Step 8: Verify victory message
    cy.get('[data-test="end-game-modal"]').within(() => {
      cy.contains('Victory!').should('be.visible')
      cy.contains('Congratulations!').should('be.visible')
    })

    // Step 9: Verify all statistics are shown
    cy.get('[data-test="end-game-modal"]').within(() => {
      // Check time taken
      cy.get('.text-caption').contains('Time Taken').should('be.visible')

      // Check final score
      cy.get('.text-caption').contains('Final Score').should('be.visible')

      // Check words found (should be 100%)
      cy.contains(/\d+\/\d+/).should('be.visible')

      // Check accuracy
      cy.contains(/\d+%/).should('be.visible')
    })

    // Step 10: Verify action buttons
    cy.get('[data-test="end-game-modal"]').within(() => {
      cy.contains('button', 'Play Again').should('be.visible')
      cy.contains('button', 'Back to Menu').should('be.visible')
    })
  })
})

// Helper function to find a word in the grid
function findWordInGrid(grid, word) {
  const rows = grid.length
  const cols = grid[0].length
  const directions = [
    [0, 1], // horizontal right
    [0, -1], // horizontal left
    [1, 0], // vertical down
    [-1, 0], // vertical up
    [1, 1], // diagonal down-right
    [-1, -1], // diagonal up-left
    [1, -1], // diagonal down-left
    [-1, 1], // diagonal up-right
  ]

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      for (let [dRow, dCol] of directions) {
        if (checkWord(grid, word, row, col, dRow, dCol)) {
          const endRow = row + (word.length - 1) * dRow
          const endCol = col + (word.length - 1) * dCol
          return {
            startRow: row,
            startCol: col,
            endRow: endRow,
            endCol: endCol,
            direction: [dRow, dCol],
          }
        }
      }
    }
  }
  return null
}

// Helper function to check if a word exists at a specific position and direction
function checkWord(grid, word, startRow, startCol, dRow, dCol) {
  const rows = grid.length
  const cols = grid[0].length

  for (let i = 0; i < word.length; i++) {
    const row = startRow + i * dRow
    const col = startCol + i * dCol

    // Check bounds
    if (row < 0 || row >= rows || col < 0 || col >= cols) {
      return false
    }

    // Check character match
    if (grid[row][col].toLowerCase() !== word[i].toLowerCase()) {
      return false
    }
  }

  return true
}
