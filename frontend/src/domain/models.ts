export type Role = 'consumer' | 'agency' | 'admin'
export type Category = 'boys-only' | 'girls-only' | 'couples-only' | 'families-only' | 'mixed'
export const categoryLabels: Record<Category, string> = {
  'boys-only': 'Boys only',
  'girls-only': 'Girls only',
  'couples-only': 'Couples',
  'families-only': 'Families',
  mixed: 'Mixed squad',
}
export interface Trip {
  id: string
  title: string
  location: string
  region: string
  image: string
  duration: number
  date: string
  endDate: string
  deadline: string
  price: number
  minimumPrice: number
  rating: number
  reviews: number
  category: string
  agency: string
  agencyId: string
  seats: number
  description: string
  itinerary: string[]
  inclusions: string[]
  status: 'published' | 'pending'
}
export interface Squad {
  id: string
  tripId: string
  name: string
  category: Category
  members: number
  confirmed: number
  capacity: number
  organizer: string
  joined: boolean
  currentPrice: number
  nextThreshold: number
  nextPrice: number
}
export interface Invitation {
  id: string
  squadId: string
  expiresAt: string
  status: 'pending' | 'accepted' | 'declined'
}
export interface Booking {
  id: string
  tripId: string
  squadId: string
  travelers: number
  status: 'reserved' | 'expired'
  createdAt: string
  expiresAt: string
}
export interface Workspace {
  trips: Trip[]
  squads: Squad[]
  invitations: Invitation[]
  bookings: Booking[]
  saved: string[]
  discovery: string[]
}
export interface SquadInput {
  tripId: string
  name: string
  category: Category
}
export interface ListingInput {
  title: string
  location: string
  date: string
  duration: number
  price: number
}
export const money = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
export const dateLabel = (value: string) =>
  new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(value))
export function expireReservations(state: Workspace, now = Date.now()) {
  for (const booking of state.bookings) {
    if (booking.status !== 'reserved' || new Date(booking.expiresAt).getTime() > now) continue
    booking.status = 'expired'
    const trip = state.trips.find((item) => item.id === booking.tripId)
    if (trip) trip.seats += booking.travelers
  }
}
export function validateMembership(squads: Squad[], squad: Squad, expiresAt?: string) {
  if (expiresAt && new Date(expiresAt).getTime() <= Date.now())
    throw new Error('This invitation has expired.')
  if (squad.category === 'mixed')
    throw new Error(
      'Mixed-squad enrollment is unavailable until the age-verification policy is approved.',
    )
  if (squads.some((item) => item.tripId === squad.tripId && item.joined))
    throw new Error('You already belong to a squad for this departure.')
  if (squad.members >= squad.capacity) throw new Error('This squad is full.')
}
