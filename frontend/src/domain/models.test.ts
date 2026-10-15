import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createSeed } from '../data/seed'
import { expireReservations, validateMembership } from './models'

describe('squad membership safeguards', () => {
  it('allows a compatible, available squad on a different departure', () => {
    const { squads } = createSeed()
    assert.doesNotThrow(() => validateMembership(squads, squads[0]))
  })
  it('blocks a second membership for the same departure', () => {
    const { squads } = createSeed()
    assert.throws(() => validateMembership(squads, squads[1]), /already belong/)
  })
  it('blocks an expired invitation', () => {
    const { squads } = createSeed()
    assert.throws(() => validateMembership(squads, squads[0], '2000-01-01'), /expired/)
  })
  it('does not invent mixed squad age boundaries', () => {
    const { squads } = createSeed()
    assert.throws(
      () => validateMembership(squads, { ...squads[0], category: 'mixed' }),
      /age-verification/,
    )
  })
  it('rejects full squads', () => {
    const { squads } = createSeed()
    assert.throws(() => validateMembership(squads, { ...squads[0], members: 10 }), /full/)
  })
  it('releases expired demo inventory exactly once without changing confirmations', () => {
    const state = createSeed()
    const seats = state.trips[0].seats
    state.trips[0].seats -= 2
    state.bookings.push({
      id: 'test',
      tripId: 'bali',
      squadId: 'island',
      travelers: 2,
      status: 'reserved',
      createdAt: '2000-01-01',
      expiresAt: '2000-01-02',
    })
    expireReservations(state)
    expireReservations(state)
    assert.equal(state.trips[0].seats, seats)
    assert.equal(state.bookings[0].status, 'expired')
    assert.equal(state.squads[0].confirmed, 4)
  })
})
