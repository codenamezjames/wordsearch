/* eslint-disable no-undef */
// Command to select a word on the grid
Cypress.Commands.add('selectWord', (startCell, endCell) => {
  // Get the start and end cells
  cy.get(`[data-test="grid-cell-${startCell}"]`).as('startCell')
  cy.get(`[data-test="grid-cell-${endCell}"]`).as('endCell')

  // Simulate mouse drag from start to end (with force to handle overlapping elements)
  cy.get('@startCell').trigger('mousedown', { button: 0, which: 1, force: true })
  cy.get('@endCell').trigger('mousemove', { force: true })
  cy.get('@endCell').trigger('mouseup', { force: true })

  // Small delay to allow for processing
  cy.wait(100)
})

// Command to wait for game to be ready
Cypress.Commands.add('waitForGameReady', () => {
  cy.get('.game-board').should('be.visible')
  cy.get('.word-list-compact').should('be.visible')
  cy.wait(1000) // Give time for animations
})

// Command to check if a word is marked as found
Cypress.Commands.add('checkWordFound', (word) => {
  cy.get('.word-list-compact').within(() => {
    cy.get(`[data-test="word-item-${word}"]`).should('have.class', 'found')
  })
})
