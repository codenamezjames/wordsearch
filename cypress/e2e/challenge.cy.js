/* eslint-disable no-undef */
describe('Word Search Challenge Mode', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.get('.start-menu-page').should('be.visible')
  })

  it('should start challenge mode and handle exit', () => {
    // Step 1: Select Easy difficulty
    cy.get('[data-test="difficulty-easy"]').click()
    cy.get('[data-test="difficulty-easy"]').should('have.class', 'active')

    // Step 2: Select a category (e.g., animals)
    cy.get('[data-test="category-animals"]').click()
    cy.get('[data-test="category-animals"]').should('have.class', 'active')

    // Step 3: Start challenge mode
    cy.get('[data-test="start-challenge-button"]').click()

    // Step 4: Wait for challenge page to load
    cy.url().should('include', '/challenge')
    cy.get('.challenge-header').should('be.visible')
    cy.get('.game-grid').should('be.visible')
    cy.get('.word-list-compact').should('be.visible')

    // Step 5: Verify challenge UI elements
    cy.contains('Challenge Mode').should('be.visible')
    cy.contains('Round 1 of').should('be.visible')
    cy.contains('Score:').should('be.visible')

    // Wait for words to load
    cy.get('.word-list-compact .word-chip .word-text', { timeout: 10000 }).should(
      'have.length.greaterThan',
      0,
    )

    // Step 6: Test manual exit functionality
    cy.log('Testing challenge exit functionality...')

    // Click the back button to exit challenge
    cy.get('.challenge-header').within(() => {
      cy.get('.q-btn').first().click()
    })

    // Should show exit confirmation dialog
    cy.get('.q-dialog').should('be.visible')
    cy.contains('Exit Challenge?').should('be.visible')
    cy.contains('Are you sure you want to exit the challenge?').should('be.visible')

    // Handle the exit confirmation dialog
    cy.get('.q-dialog').should('be.visible')
    cy.contains('Exit Challenge?').should('be.visible')
    cy.contains('Are you sure you want to exit the challenge?').should('be.visible')

    // Confirm exit - find the dialog that contains the exit confirmation
    cy.contains('.q-dialog', 'Exit Challenge?').within(() => {
      cy.contains('button', 'OK').click()
    })

    // Should return to start menu
    cy.url().should('include', '/')
    cy.get('.start-menu-page').should('be.visible')

    cy.log('Challenge mode exit test completed successfully!')
  })

  it('should play exactly 10 rounds procedurally', () => {
    // Step 1: Select Easy difficulty
    cy.get('[data-test="difficulty-easy"]').click()
    cy.get('[data-test="difficulty-easy"]').should('have.class', 'active')

    // Step 2: Select a category (e.g., animals)
    cy.get('[data-test="category-animals"]').click()
    cy.get('[data-test="category-animals"]').should('have.class', 'active')

    // Step 3: Start challenge mode
    cy.get('[data-test="start-challenge-button"]').click()

    // Step 4: Wait for challenge page to load
    cy.url().should('include', '/challenge')
    cy.get('.challenge-header').should('be.visible')
    cy.get('.game-grid').should('be.visible')

    // Wait for words to load
    cy.get('.word-list-compact .word-chip .word-text', { timeout: 10000 }).should(
      'have.length.greaterThan',
      0,
    )

    // Step 5: Play exactly 10 rounds procedurally
    cy.log('Playing exactly 10 rounds procedurally...')

    for (let round = 1; round <= 10; round++) {
      cy.log(`=== Round ${round}/10 ===`)

      // Verify we're in the correct round
      cy.contains(`Round ${round} of`).should('be.visible')

      // Play the round - find and select some words
      cy.get('.word-list-compact .word-chip .word-text').then(($words) => {
        const wordsToFind = []
        $words.each((index, element) => {
          wordsToFind.push(Cypress.$(element).text().trim())
        })

        cy.log(
          `Round ${round}: Playing with ${wordsToFind.length} words: ${wordsToFind.join(', ')}`,
        )

        // Get the grid content
        cy.get('[data-test^="grid-cell-"]').then(($cells) => {
          const gridSize = Math.sqrt($cells.length)
          let gridContent = []

          for (let i = 0; i < $cells.length; i++) {
            const row = Math.floor(i / gridSize)
            const col = i % gridSize
            if (!gridContent[row]) gridContent[row] = []
            gridContent[row][col] = $cells.eq(i).text().trim()
          }

          // Find and select ALL words to complete the round
          const wordsToFindThisRound = wordsToFind
          cy.log(
            `Round ${round}: Selecting ${wordsToFindThisRound.length} words: ${wordsToFindThisRound.join(', ')}`,
          )

          let wordsFound = 0
          wordsToFindThisRound.forEach((word, index) => {
            const position = findWordInGrid(gridContent, word)
            if (position) {
              wordsFound++
              cy.log(`Round ${round}: Found word ${index + 1}: "${word}"`)

              const startCell = `${position.startRow}-${position.startCol}`
              const endCell = `${position.endRow}-${position.endCol}`

              cy.selectWord(startCell, endCell)
              cy.get(`[data-test="word-item-${word}"]`).should('have.class', 'found')
              cy.wait(200) // Brief pause between selections
            } else {
              cy.log(`Round ${round}: Could not find word "${word}"`)
            }
          })

          cy.log(`Round ${round}: Found ${wordsFound}/${wordsToFindThisRound.length} words`)
        })
      })

      // Wait for round to process
      cy.wait(500)

      if (round < 10) {
        // Expect round transition modal (except for last round)
        cy.log(`Round ${round}: Expecting transition modal...`)
        cy.get('.round-transition-modal', { timeout: 10000 }).should('be.visible')

        // Continue to next round
        cy.get('.round-transition-modal').within(() => {
          cy.contains('button', 'Continue').should('be.visible').click()
        })

        cy.log(`Round ${round}: Continued to round ${round + 1}`)
        cy.wait(1000) // Brief pause for transition
      } else {
        // Last round - expect challenge completion
        cy.log('Round 10: Expecting challenge completion...')
        cy.wait(3000) // Give time for final processing
      }
    }

    // Step 6: After 10 rounds, check for completion
    cy.log('All 10 rounds completed - checking for final result...')

    // Should have challenge completion modal
    cy.get('[data-test="challenge-complete-modal"]', { timeout: 15000 }).should('be.visible')

    // Verify the completion modal - check for success or failure
    cy.get('[data-test="challenge-complete-modal"]').then(($modal) => {
      const modalText = $modal.text()
      cy.log(`Full modal content: "${modalText}"`)

      if (modalText.includes('Challenge Failed')) {
        cy.log('Challenge failed after 10 rounds')
        cy.get('[data-test="challenge-complete-modal"]').within(() => {
          cy.contains('Challenge Failed').should('be.visible')
          cy.contains('You gave it your best shot!').should('be.visible')
        })
      } else if (modalText.includes('Challenge Complete!')) {
        cy.log('Challenge succeeded after 10 rounds')
        cy.get('[data-test="challenge-complete-modal"]').within(() => {
          cy.contains('Challenge Complete!').should('be.visible')
          cy.contains('Congratulations!').should('be.visible')
        })
      } else {
        cy.log(`Unexpected modal content: "${modalText}"`)
        throw new Error(
          `Expected either success or failure message in completion modal. Found: "${modalText}"`,
        )
      }
    })

    // Verify common elements
    cy.get('[data-test="challenge-complete-modal"]').within(() => {
      cy.contains('Final Score').should('be.visible')
      cy.contains('Target Score').should('be.visible')
      cy.contains('button', 'Back to Menu').should('be.visible')

      // Exit to menu
      cy.contains('button', 'Back to Menu').click()
    })

    // Handle the exit confirmation dialog
    cy.get('.q-dialog').should('be.visible')
    cy.contains('Exit Challenge?').should('be.visible')
    cy.contains('Are you sure you want to exit the challenge?').should('be.visible')

    // Confirm exit - find the dialog that contains the exit confirmation
    cy.contains('.q-dialog', 'Exit Challenge?').within(() => {
      cy.contains('button', 'OK').click()
    })

    // Should return to start menu
    cy.url().should('include', '/')
    cy.get('.start-menu-page').should('be.visible')

    cy.log('Procedural 10-round challenge test completed successfully!')
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
