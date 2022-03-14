// @ts-ignore / session support is needed for visiting about:blank between tests
context('multi-domain viewport', { experimentalSessionSupport: true }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="multi-domain-secondary-link"]').click()
  })

  context('.viewport()', () => {
    it('changes the viewport', () => {
      cy.switchToDomain('http://foobar.com:3500', () => {
        cy.window().then((win) => {
          expect(win.innerHeight).to.equal(660)
          expect(win.innerWidth).to.equal(1000)
        })

        cy.viewport(320, 480)

        cy.window().then((win) => {
          expect(win.innerHeight).to.equal(480)
          expect(win.innerWidth).to.equal(320)
        })
      })
    })

    it('resets the viewport between tests', () => {
      cy.switchToDomain('http://foobar.com:3500', () => {
        cy.window().then((win) => {
          expect(win.innerHeight).to.equal(660)
          expect(win.innerWidth).to.equal(1000)
        })
      })
    })

    context('cy.on(\'viewport:changed\')', () => {
      it('calls viewport:changed handler in switchToDomain', () => {
        cy.switchToDomain('http://foobar.com:3500', () => {
          const viewportChangedSpy = cy.spy()

          cy.on('viewport:changed', viewportChangedSpy)

          cy.viewport(320, 480).then(() => {
            expect(viewportChangedSpy).to.be.calledOnce
          })
        })
      })

      it('does NOT call viewport:changed handler of primary', () => {
        const viewportChangedSpy = cy.spy()

        cy.on('viewport:changed', viewportChangedSpy)

        cy.switchToDomain('http://foobar.com:3500', () => {
          cy.viewport(320, 480)
        }).then(() => {
          expect(viewportChangedSpy).not.to.be.called
        })
      })
    })

    context('Cypress.on(\'viewport:changed\')', () => {
      let viewportChangedSpyPrimary

      before(() => {
        viewportChangedSpyPrimary = cy.spy()
        cy.switchToDomain('http://foobar.com:3500', () => {
          // using global since a function can't be passed to switchToDomain
          // and we need to be able to remove the listener in the 'after' hook
          globalThis.viewportChangedSpySecondary = cy.spy()
        })
      })

      after(() => {
        Cypress.off('viewport:changed', viewportChangedSpyPrimary)
        cy.switchToDomain('http://foobar.com:3500', () => {
          Cypress.off('viewport:changed', globalThis.viewportChangedSpySecondary)
        })

        delete globalThis.viewportChangedSpySecondary
      })

      it('calls viewport:changed handler in switchToDomain', () => {
        cy.switchToDomain('http://foobar.com:3500', () => {
          Cypress.on('viewport:changed', globalThis.viewportChangedSpySecondary)

          cy.viewport(320, 480).then(() => {
            expect(globalThis.viewportChangedSpySecondary).to.be.calledOnce
          })
        })
      })

      it('does NOT call viewport:changed handler of primary', () => {
        Cypress.on('viewport:changed', viewportChangedSpyPrimary)

        cy.switchToDomain('http://foobar.com:3500', () => {
          cy.viewport(320, 480)
        }).then(() => {
          expect(viewportChangedSpyPrimary).not.to.be.called
        })
      })
    })

    it('syncs the viewport from the primary to secondary', () => {
      // change the viewport in the primary first
      cy.viewport(320, 480)

      cy.switchToDomain('http://foobar.com:3500', () => {
        const viewportChangedSpy = cy.spy()

        cy.on('viewport:changed', viewportChangedSpy)

        // changing the viewport to the same size shouldn't do anything
        cy.viewport(320, 480).then(() => {
          expect(viewportChangedSpy).not.to.be.called
        })

        cy.window().then((win) => {
          expect(win.innerWidth).to.equal(320)
          expect(win.innerHeight).to.equal(480)
        })
      })
    })

    it('syncs the viewport from the secondary to primary', () => {
      const viewportChangedSpy = cy.spy()

      cy.on('viewport:changed', viewportChangedSpy)

      cy.switchToDomain('http://foobar.com:3500', () => {
        // change the viewport in the secondary first
        cy.viewport(320, 480)

        cy.window().then((win) => {
          win.location.href = 'http://localhost:3500/fixtures/multi-domain.html'
        })
      })

      // changing the viewport to the same size shouldn't do anything
      cy.viewport(320, 480).then(() => {
        expect(viewportChangedSpy).not.to.be.called
      })

      cy.window().then((win) => {
        expect(win.innerWidth).to.equal(320)
        expect(win.innerHeight).to.equal(480)
      })
    })

    it('syncs the viewport across multiple domains', () => {
      cy.switchToDomain('http://foobar.com:3500', () => {
        cy.viewport(320, 480)
        cy.window().then((win) => {
          expect(win.innerWidth).to.equal(320)
          expect(win.innerHeight).to.equal(480)
        })

        // navigate back to primary
        cy.window().then((win) => {
          win.location.href = 'http://localhost:3500/fixtures/multi-domain.html'
        })
      })

      cy.window().then((win) => {
        win.location.href = 'http://www.idp.com:3500/fixtures/multi-domain.html'
      })

      cy.switchToDomain('http://idp.com:3500', () => {
        const viewportChangedSpy = cy.spy()

        cy.on('viewport:changed', viewportChangedSpy)

        // changing the viewport to the same size shouldn't do anything
        cy.viewport(320, 480).then(() => {
          expect(viewportChangedSpy).not.to.be.called
        })

        cy.window().then((win) => {
          expect(win.innerWidth).to.equal(320)
          expect(win.innerHeight).to.equal(480)
        })
      })
    })
  })
})
