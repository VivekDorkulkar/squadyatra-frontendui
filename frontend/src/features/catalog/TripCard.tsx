import {
  ArrowUpRight,
  Bookmark,
  CalendarDays,
  Clock3,
  MapPin,
  Star,
  UsersRound,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { dateLabel, money, type Trip } from '../../domain/models'
import { useWorkspace } from '../workspace/WorkspaceProvider'
import { repository } from '../workspace/repository'
import { Avatars } from '../../components/ui'

export function TripCard({ trip, index = 0 }: { trip: Trip; index?: number }) {
  const { data, run, pending } = useWorkspace()
  const saved = data.saved.includes(trip.id)
  const squads = data.squads.filter((squad) => squad.tripId === trip.id)
  return (
    <article className="trip-card" style={{ animationDelay: `${index * 55}ms` }}>
      <div className="trip-image">
        <Link to={`/trips/${trip.id}`} tabIndex={-1} aria-hidden="true">
          <img src={trip.image} alt={trip.location} loading={index < 3 ? 'eager' : 'lazy'} />
        </Link>
        <span className={`trip-tag ${trip.agencyId === 'squadyatra' ? 'original' : ''}`}>
          {trip.agencyId === 'squadyatra' ? 'SQUADYATRA ORIGINAL' : trip.category}
        </span>
        <button
          title={saved ? 'Unsave trip' : 'Save trip'}
          aria-label={`${saved ? 'Unsave' : 'Save'} ${trip.title}`}
          aria-pressed={saved}
          disabled={pending}
          className={`save-button ${saved ? 'saved' : ''}`}
          onClick={() =>
            run(
              () => repository.toggleSaved(trip.id),
              saved ? 'Trip removed from saved.' : 'Trip saved for another day.',
            )
          }
        >
          <Bookmark size={18} fill={saved ? 'currentColor' : 'none'} />
        </button>
        <span className="image-duration">
          <Clock3 size={13} />
          {trip.duration} days · {trip.duration - 1} nights
        </span>
      </div>
      <div className="trip-body">
        <div className="trip-location">
          <span>
            <MapPin size={13} />
            {trip.location}
          </span>
          <span className="rating">
            <Star size={12} fill="currentColor" />
            {trip.rating}
            <small>({trip.reviews})</small>
          </span>
        </div>
        <Link className="trip-title" to={`/trips/${trip.id}`}>
          <h3>{trip.title}</h3>
        </Link>
        <p className="trip-agency">by {trip.agency}</p>
        <div className="trip-departure">
          <CalendarDays size={14} />
          <span>{dateLabel(trip.date)}</span>
          <span className="seats-dot" />
          {trip.seats} spots left
        </div>
        <div className="squad-social">
          <Avatars count={squads[0]?.members ?? 4} />
          <span>
            {squads.length > 0
              ? `${squads.length} squad${squads.length > 1 ? 's' : ''} forming`
              : 'Start the first squad'}
            <small>Your kind of people, your kind of trip</small>
          </span>
        </div>
        <div className="trip-price">
          <div>
            <span className="price-overline">SQUAD PRICE FROM</span>
            <strong>
              {money(trip.minimumPrice)}
              <small>/ person</small>
            </strong>
            <span className="standard-price">
              Regular price <s>{money(trip.price)}</s>
            </span>
          </div>
          <Link
            to={`/trips/${trip.id}`}
            className="trip-arrow"
            title={`View ${trip.title}`}
            aria-label={`View ${trip.title}`}
          >
            <ArrowUpRight size={22} />
          </Link>
        </div>
        <div className="savings-note">
          <UsersRound size={13} />
          More confirmed travelers. Better squad prices.
        </div>
      </div>
    </article>
  )
}
