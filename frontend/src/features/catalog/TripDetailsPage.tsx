import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock3,
  MapPin,
  Plus,
  ShieldCheck,
  Star,
  UsersRound,
} from 'lucide-react'
import { categoryLabels, dateLabel, money } from '../../domain/models'
import { useWorkspace } from '../workspace/WorkspaceProvider'
import { repository } from '../workspace/repository'
import { CreateSquadModal } from '../squads/SquadsPage'
import { EmptyState, Modal } from '../../components/ui'
import { config } from '../../lib/config'

export function TripDetailsPage() {
  const { id } = useParams()
  const { data, run, pending } = useWorkspace()
  const [create, setCreate] = useState(false)
  const [reserve, setReserve] = useState(false)
  const trip = data.trips.find((item) => item.id === id && item.status === 'published')
  if (!trip)
    return (
      <EmptyState
        title="This trip has wandered off"
        description="Find another departure in our curated collection."
      >
        <Link to="/" className="button primary">
          Explore trips
        </Link>
      </EmptyState>
    )
  const squads = data.squads.filter((squad) => squad.tripId === trip.id)
  const mine = squads.find((squad) => squad.joined)
  const discovery = data.discovery.includes(trip.id)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!mine) return
    const travelers = Number(new FormData(event.currentTarget).get('travelers'))
    if (
      await run(
        () => repository.reserve(mine.id, travelers),
        config.demo
          ? 'Demo seats reserved for 15 minutes. No payment has been taken.'
          : 'Reservation requested. Check My bookings for its authoritative status.',
      )
    )
      setReserve(false)
  }
  return (
    <div className="page detail-page">
      <Link to="/" className="back-link">
        <ArrowLeft size={16} />
        Back to exploring
      </Link>
      <div className="detail-cover">
        <img src={trip.image} alt={trip.location} />
        <span className="detail-cover-label">
          <MapPin size={17} />
          {trip.location}
        </span>
      </div>
      <div className="detail-grid">
        <div>
          <p className="eyebrow">
            {trip.agency === 'SquadYatra Originals'
              ? 'SQUADYATRA ORIGINAL'
              : `CURATED BY ${trip.agency.toUpperCase()}`}
          </p>
          <h1>{trip.title}</h1>
          <div className="detail-meta">
            <span>
              <MapPin size={16} />
              {trip.location}
            </span>
            <span>
              <Clock3 size={16} />
              {trip.duration} days
            </span>
            <span>
              <Star size={16} />
              {trip.rating} ({trip.reviews} reviews)
            </span>
          </div>
          <p className="detail-description">{trip.description}</p>
          <section className="detail-section">
            <h2>A little peek at the journey</h2>
            <ol className="itinerary">
              {trip.itinerary.map((day, index) => (
                <li key={day}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <small>JOURNEY HIGHLIGHT</small>
                    <h3>{day}</h3>
                  </div>
                </li>
              ))}
            </ol>
          </section>
          <section className="detail-section">
            <h2>The good things, included</h2>
            <div className="inclusions">
              {trip.inclusions.map((item) => (
                <span key={item}>
                  <Check size={17} />
                  {item}
                </span>
              ))}
            </div>
          </section>
          <section className="detail-section">
            <div className="inline-between">
              <h2>Find your kind of people</h2>
              <span className="pill">{squads.length} squads</span>
            </div>
            {squads.map((squad) => (
              <div className="compact-squad" key={squad.id}>
                <span className="squad-symbol">
                  <UsersRound size={22} />
                </span>
                <div>
                  <h3>{squad.name}</h3>
                  <p>
                    {categoryLabels[squad.category]} · {squad.members}/{squad.capacity} members ·{' '}
                    {squad.confirmed} qualifying
                  </p>
                </div>
                <strong>
                  {money(squad.currentPrice)}
                  <small>provisional / person</small>
                </strong>
              </div>
            ))}
            <p className="muted">
              Membership is invitation-only. Only compatible organizers for this departure can
              discover your limited profile when you opt in.
            </p>
            <label className="discovery-toggle">
              <span>
                <strong>Let compatible squads discover me</strong>
                <small>You can withdraw consent at any time.</small>
              </span>
              <input
                type="checkbox"
                role="switch"
                checked={discovery}
                disabled={pending}
                onChange={() =>
                  run(
                    () => repository.toggleDiscovery(trip.id),
                    discovery
                      ? 'Discovery turned off for this departure.'
                      : 'Discovery enabled for this departure only.',
                  )
                }
              />
            </label>
            <button className="button outline" onClick={() => setCreate(true)} disabled={!!mine}>
              <Plus size={16} />
              {mine ? 'You already have a squad' : 'Start your own squad'}
            </button>
          </section>
        </div>
        <aside className="booking-panel">
          <span className="pill">YOUR NEXT CHAPTER</span>
          <h2>
            Good company.
            <br />A better price.
          </h2>
          <div className="detail-price">
            <small>Squad price from</small>
            <strong>
              {money(trip.minimumPrice)}
              <span>/ person</span>
            </strong>
            <p>
              Regular price <s>{money(trip.price)}</s>
            </p>
          </div>
          <div className="booking-facts">
            <span>
              <CalendarDays size={17} />
              {dateLabel(trip.date)}
            </span>
            <span>
              <UsersRound size={17} />
              {trip.seats} available spots
            </span>
            <span>
              <Clock3 size={17} />
              Enroll by {dateLabel(trip.deadline)}
            </span>
          </div>
          {mine && (
            <div className="price-progress">
              <strong>{mine.name}</strong>
              <p>Current provisional price: {money(mine.currentPrice)}</p>
              <progress value={mine.confirmed} max={mine.nextThreshold} />
              <p>
                {mine.confirmed} qualifying travelers. Next tier at {mine.nextThreshold}:{' '}
                {money(mine.nextPrice)}.
              </p>
            </div>
          )}
          <button
            className="button primary full"
            disabled={!mine || trip.seats === 0 || pending}
            onClick={() => setReserve(true)}
          >
            {mine
              ? trip.seats === 0
                ? 'Seats not yet activated'
                : 'Reserve seats'
              : 'Join a squad before reserving'}
            <ArrowLeft className="arrow-forward" size={17} />
          </button>
          {!mine && (
            <Link className="text-button centered" to="/invitations">
              Check your invitations
            </Link>
          )}
          <div className="info-note">
            <ShieldCheck size={20} />
            <span>
              Prices are provisional and specific to each squad. The backend confirms eligibility,
              capacity, and accepted prices. Payments are not enabled.
            </span>
          </div>
          {config.demo && (
            <p className="demo-disclosure">Demo departure · Sample pricing and inventory</p>
          )}
        </aside>
      </div>
      {create && <CreateSquadModal tripId={trip.id} onClose={() => setCreate(false)} />}
      {reserve && (
        <Modal
          title={config.demo ? 'Reserve demo seats' : 'Request a reservation'}
          onClose={() => setReserve(false)}
        >
          <form className="form-stack" onSubmit={submit}>
            <p>
              {trip.title} · {dateLabel(trip.date)}
            </p>
            <label>
              Travelers in your booking party
              <input
                type="number"
                name="travelers"
                min={
                  mine?.category === 'couples-only' || mine?.category === 'families-only' ? 2 : 1
                }
                max={mine?.category === 'couples-only' ? 2 : trip.seats}
                defaultValue={
                  mine?.category === 'couples-only' || mine?.category === 'families-only' ? 2 : 1
                }
                required
              />
            </label>
            <div className="info-note">
              <ShieldCheck size={19} />
              <span>
                A reservation is not a confirmed booking and does not increase the qualifying
                traveler count. Demo seats are held for 15 minutes. No real payment or final price
                lock is available.
              </span>
            </div>
            <label className="checkbox-label">
              <input type="checkbox" required />
              <span>I understand this is a provisional reservation, not a paid booking.</span>
            </label>
            <button className="button primary full" disabled={pending}>
              {pending
                ? 'Reserving...'
                : config.demo
                  ? 'Reserve demo seats'
                  : 'Request reservation'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}
