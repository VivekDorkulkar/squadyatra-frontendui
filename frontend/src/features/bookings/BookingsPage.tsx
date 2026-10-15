import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays, Clock3, ShieldCheck } from 'lucide-react'
import { useWorkspace } from '../workspace/WorkspaceProvider'
import { dateLabel } from '../../domain/models'
import { EmptyState } from '../../components/ui'
import { config } from '../../lib/config'

export function BookingsPage() {
  const { data } = useWorkspace()
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">SOMETHING GOOD ON THE CALENDAR</p>
          <h1>Your next chapters.</h1>
          <p>Reservations and bookings, with every step in sight.</p>
        </div>
      </div>
      <div className="info-note">
        <ShieldCheck size={21} />
        <span>
          Reservations, qualifying confirmation, and final bookings are separate states. Payment,
          cancellation, and refund policies must be approved before production checkout.
        </span>
      </div>
      {data.bookings.length ? (
        <div className="booking-list">
          {data.bookings.map((booking) => {
            const trip = data.trips.find((item) => item.id === booking.tripId)!
            const squad = data.squads.find((item) => item.id === booking.squadId)!
            const expired = new Date(booking.expiresAt).getTime() <= Date.now()
            return (
              <article className="booking-card" key={booking.id}>
                <img src={trip.image} alt={trip.location} />
                <div>
                  <span className={`pill ${expired ? 'neutral' : ''}`}>
                    {expired ? 'Reservation expired' : 'Seats reserved · Not confirmed'}
                    {config.demo ? ' · Demo' : ''}
                  </span>
                  <h2>{trip.title}</h2>
                  <p>
                    {squad.name} · {booking.travelers} traveler{booking.travelers > 1 ? 's' : ''}
                  </p>
                  <p className="icon-line">
                    <CalendarDays size={16} />
                    {dateLabel(trip.date)}
                    <Clock3 size={16} />
                    Hold expires{' '}
                    {new Date(booking.expiresAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <span className="booking-reference">Reference: {booking.id}</span>
                </div>
                <Link className="button outline" to={`/trips/${trip.id}`}>
                  View departure
                  <ArrowRight size={16} />
                </Link>
              </article>
            )
          })}
        </div>
      ) : (
        <EmptyState
          title="An open calendar. Endless possibilities."
          description="Find a trip, join your squad, and reserve your seats. Your journey will appear here."
        >
          <Link className="button primary" to="/">
            Find your next trip
            <ArrowRight size={16} />
          </Link>
        </EmptyState>
      )}
    </div>
  )
}
