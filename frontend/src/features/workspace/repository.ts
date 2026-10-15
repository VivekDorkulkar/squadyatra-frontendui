import { createSeed } from '../../data/seed'
import {
  expireReservations,
  validateMembership,
  type ListingInput,
  type SquadInput,
  type Workspace,
} from '../../domain/models'
import { api } from '../../lib/api'
import { config } from '../../lib/config'

const storageKey = 'squadyatra.workspace.v1'
let memory: Workspace | null = null
function read(): Workspace {
  if (memory) return structuredClone(memory)
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) ?? 'null') as Workspace | null
    if (
      value &&
      ['trips', 'squads', 'invitations', 'bookings', 'saved', 'discovery'].every((key) =>
        Array.isArray(value[key as keyof Workspace]),
      )
    )
      return value
  } catch {
    return createSeed()
  }
  return createSeed()
}
function write(value: Workspace) {
  memory = structuredClone(value)
  try {
    localStorage.setItem(storageKey, JSON.stringify(value))
  } catch {
    return
  }
}
async function mutate<T>(path: string, body: unknown, demo: (state: Workspace) => T): Promise<T> {
  if (!config.demo)
    return api<T>(path, {
      method: 'POST',
      headers: { 'Idempotency-Key': crypto.randomUUID() },
      body: JSON.stringify(body),
    })
  const state = read()
  expireReservations(state)
  const result = demo(state)
  write(state)
  return result
}
export const repository = {
  async load(): Promise<Workspace> {
    if (config.demo) {
      const state = read()
      expireReservations(state)
      write(state)
      return state
    }
    const [trips, squads, invitations, bookings, preferences] = await Promise.all([
      api<Workspace['trips']>('/api/v1/catalog/trips'),
      api<Workspace['squads']>('/api/v1/squads/mine'),
      api<Workspace['invitations']>('/api/v1/squads/invitations'),
      api<Workspace['bookings']>('/api/v1/bookings/mine'),
      api<Pick<Workspace, 'saved' | 'discovery'>>('/api/v1/squads/preferences'),
    ])
    return { trips, squads, invitations, bookings, ...preferences }
  },
  toggleSaved(tripId: string) {
    return mutate('/api/v1/catalog/saved/toggle', { tripId }, (state) => {
      state.saved = state.saved.includes(tripId)
        ? state.saved.filter((id) => id !== tripId)
        : [...state.saved, tripId]
    })
  },
  toggleDiscovery(tripId: string) {
    return mutate('/api/v1/squads/discovery/toggle', { tripId }, (state) => {
      state.discovery = state.discovery.includes(tripId)
        ? state.discovery.filter((id) => id !== tripId)
        : [...state.discovery, tripId]
    })
  },
  createSquad(input: SquadInput) {
    return mutate('/api/v1/squads', input, (state) => {
      const trip = state.trips.find((item) => item.id === input.tripId)
      if (!trip || trip.status !== 'published') throw new Error('Select an available departure.')
      if (!input.name.trim()) throw new Error('Give your squad a name.')
      if (input.category === 'mixed')
        throw new Error('Mixed-squad enrollment is awaiting an approved age policy.')
      if (state.squads.some((squad) => squad.joined && squad.tripId === input.tripId))
        throw new Error('You already belong to a squad for this departure.')
      state.squads.push({
        id: crypto.randomUUID(),
        tripId: input.tripId,
        name: input.name.trim(),
        category: input.category,
        members: 1,
        confirmed: 0,
        capacity: 10,
        organizer: 'You',
        joined: true,
        currentPrice: trip.price,
        nextThreshold: 4,
        nextPrice: Math.max(trip.minimumPrice, trip.price - 2000),
      })
    })
  },
  respondInvitation(id: string, accept: boolean, attested: boolean) {
    return mutate(`/api/v1/squads/invitations/${id}/respond`, { accept, attested }, (state) => {
      const invitation = state.invitations.find((item) => item.id === id)
      if (!invitation || invitation.status !== 'pending')
        throw new Error('This invitation is no longer available.')
      if (accept) {
        const squad = state.squads.find((item) => item.id === invitation.squadId)
        if (!squad) throw new Error('Squad not found.')
        if (!attested) throw new Error('Confirm that your booking party meets this squad category.')
        validateMembership(state.squads, squad, invitation.expiresAt)
        squad.joined = true
        squad.members += 1
      }
      invitation.status = accept ? 'accepted' : 'declined'
    })
  },
  reserve(squadId: string, travelers: number) {
    return mutate('/api/v1/bookings/reservations', { squadId, travelers }, (state) => {
      const squad = state.squads.find((item) => item.id === squadId && item.joined)
      if (!squad) throw new Error('Join a squad before reserving seats.')
      const trip = state.trips.find((item) => item.id === squad.tripId)
      if (!trip || new Date(trip.deadline).getTime() <= Date.now())
        throw new Error('Enrollment for this departure has closed.')
      if (!Number.isInteger(travelers) || travelers < 1 || travelers > trip.seats)
        throw new Error('Choose a valid number of travelers within available capacity.')
      if (squad.category === 'couples-only' && travelers !== 2)
        throw new Error('A couples booking party must contain two travelers.')
      if (squad.category === 'families-only' && travelers < 2)
        throw new Error('A family booking party must contain at least two travelers.')
      if (
        state.bookings.some(
          (booking) =>
            booking.squadId === squadId && new Date(booking.expiresAt).getTime() > Date.now(),
        )
      )
        throw new Error('You already have an active reservation for this squad.')
      trip.seats -= travelers
      state.bookings.push({
        id: `SY-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
        tripId: trip.id,
        squadId,
        travelers,
        status: 'reserved',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      })
    })
  },
  createListing(input: ListingInput, internal = false) {
    return mutate(
      internal ? '/api/v1/catalog/internal/trips' : '/api/v1/catalog/trips',
      input,
      (state) => {
        if (
          new Date(input.date).getTime() <= Date.now() ||
          input.price <= 0 ||
          !Number.isInteger(input.duration) ||
          input.duration < 1
        )
          throw new Error('Enter a future departure, positive price, and valid duration.')
        const template = state.trips[0]
        state.trips.push({
          ...template,
          ...input,
          id: crypto.randomUUID(),
          status: 'pending',
          image: template.image,
          agencyId: internal ? 'squadyatra' : 'wanderfolk',
          agency: internal ? 'SquadYatra Originals' : 'Wanderfolk Travels',
          minimumPrice: input.price,
          rating: 0,
          reviews: 0,
          seats: 0,
          endDate: input.date,
          deadline: input.date,
        })
      },
    )
  },
  approveListing(id: string) {
    return mutate(`/api/v1/catalog/trips/${id}/approve`, {}, (state) => {
      const trip = state.trips.find((item) => item.id === id)
      if (!trip) throw new Error('Listing not found.')
      trip.status = 'published'
    })
  },
}
