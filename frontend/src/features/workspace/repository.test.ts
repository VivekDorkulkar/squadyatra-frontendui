import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createSeed } from '../../data/seed'

describe('demo data contract', () => {
  it('keeps memberships distinct from qualifying confirmations', () => {
    const data = createSeed()
    assert.ok(data.squads.every((squad) => squad.confirmed <= squad.members))
    assert.equal(data.bookings.length, 0)
  })
  it('keeps discovery opt-in by default', () => {
    assert.deepEqual(createSeed().discovery, [])
  })
  it('keeps provisional squad prices above each departure floor', () => {
    const data = createSeed()
    for (const squad of data.squads) {
      const trip = data.trips.find((item) => item.id === squad.tripId)!
      assert.ok(squad.currentPrice >= trip.minimumPrice)
      assert.ok(squad.nextPrice >= trip.minimumPrice)
    }
  })
})
