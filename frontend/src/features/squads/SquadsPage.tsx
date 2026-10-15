import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CalendarDays,
  Check,
  LockKeyhole,
  Plus,
  ShieldCheck,
  UsersRound,
} from 'lucide-react'
import { categoryLabels, dateLabel, money, type Category } from '../../domain/models'
import { useWorkspace } from '../workspace/WorkspaceProvider'
import { repository } from '../workspace/repository'
import { Avatars, EmptyState, Modal } from '../../components/ui'

export function CreateSquadModal({ onClose, tripId }: { onClose: () => void; tripId?: string }) {
  const { data, run, pending } = useWorkspace()
  const [category, setCategory] = useState<Category>('girls-only')
  const [attested, setAttested] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    if (
      await run(
        () =>
          repository.createSquad({
            name: String(form.get('name')),
            tripId: String(form.get('tripId')),
            category,
          }),
        'Your squad is ready. Membership does not reserve seats.',
      )
    )
      onClose()
  }
  return (
    <Modal title="Every great trip starts with a squad" onClose={onClose}>
      <form className="form-stack" onSubmit={submit}>
        <p className="muted">Choose your departure and bring your kind of people together.</p>
        <label>
          Squad name
          <input
            name="name"
            required
            minLength={3}
            maxLength={60}
            placeholder="The next chapter crew"
          />
        </label>
        <label>
          Trip departure
          <select name="tripId" defaultValue={tripId ?? ''} required>
            <option value="" disabled>
              Pick your adventure
            </option>
            {data.trips
              .filter((trip) => trip.status === 'published')
              .map((trip) => (
                <option key={trip.id} value={trip.id}>
                  {trip.title} · {dateLabel(trip.date)}
                </option>
              ))}
          </select>
        </label>
        <label>
          Your squad category
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value as Category)}
          >
            {Object.entries(categoryLabels).map(([value, label]) => (
              <option key={value} value={value} disabled={value === 'mixed'}>
                {label}
                {value === 'mixed' ? ' · Age policy pending' : ''}
              </option>
            ))}
          </select>
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            required
            checked={attested}
            onChange={(event) => setAttested(event.target.checked)}
          />
          <span>
            I confirm my party meets the selected category. Eligibility will need server
            verification before a real booking.
          </span>
        </label>
        <div className="info-note">
          <ShieldCheck size={19} />
          <span>
            Only one active squad per traveler per departure. Creating a squad does not reserve a
            seat or confirm a price.
          </span>
        </div>
        <button className="button primary full" disabled={pending || !attested}>
          <Plus size={17} />
          {pending ? 'Creating...' : 'Create my squad'}
        </button>
      </form>
    </Modal>
  )
}
export function SquadsPage() {
  const { data } = useWorkspace()
  const [create, setCreate] = useState(false)
  const [tab, setTab] = useState('mine')
  const squads = data.squads.filter((squad) => tab === 'all' || squad.joined)
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">THE PEOPLE MAKE THE PLACE</p>
          <h1>Your people, your next adventure.</h1>
          <p>A shared destination is just the beginning.</p>
        </div>
        <button className="button primary" onClick={() => setCreate(true)}>
          <Plus size={17} />
          Create a squad
        </button>
      </div>
      <div className="view-tabs">
        <button className={tab === 'mine' ? 'selected' : ''} onClick={() => setTab('mine')}>
          My squads
        </button>
        <button className={tab === 'all' ? 'selected' : ''} onClick={() => setTab('all')}>
          Discover squads
        </button>
      </div>
      <div className="info-note">
        <LockKeyhole size={20} />
        <span>
          Discovery is opt-in and departure-specific. Joining is by invitation and consent. Contact
          information and identity documents are never shown to other squads.
        </span>
      </div>
      <div className="squad-grid">
        {squads.map((squad) => {
          const trip = data.trips.find((item) => item.id === squad.tripId)!
          return (
            <article className="squad-card" key={squad.id}>
              <img src={trip.image} alt={trip.location} />
              <div className="squad-card-body">
                <div className="inline-between">
                  <span className="pill">{categoryLabels[squad.category]}</span>
                  {squad.joined && (
                    <span className="success-label">
                      <Check size={14} />
                      Your squad
                    </span>
                  )}
                </div>
                <h2>{squad.name}</h2>
                <p>{trip.title}</p>
                <p className="icon-line">
                  <CalendarDays size={15} />
                  {dateLabel(trip.date)}
                </p>
                <div className="inline-between">
                  <Avatars count={squad.members} />
                  <span className="muted">
                    {squad.members}/{squad.capacity} members
                  </span>
                </div>
                <div className="price-progress">
                  <div className="inline-between">
                    <strong>
                      {money(squad.currentPrice)}
                      <small>/ person</small>
                    </strong>
                    <span>{squad.confirmed} qualifying travelers</span>
                  </div>
                  <progress value={squad.confirmed} max={squad.nextThreshold} />
                  <p>
                    {Math.max(0, squad.nextThreshold - squad.confirmed)} more qualifying travelers
                    to {money(squad.nextPrice)} per person.
                  </p>
                </div>
                <Link className="button outline full" to={`/trips/${trip.id}`}>
                  {squad.joined
                    ? 'View departure & reserve'
                    : 'View departure & opt into discovery'}
                  <ArrowRight size={16} />
                </Link>
              </div>
            </article>
          )
        })}
      </div>
      {!squads.length && (
        <EmptyState
          title="Your squad story starts here"
          description="Create a squad or opt into discovery on a departure you love."
        >
          <button className="button primary" onClick={() => setCreate(true)}>
            Create a squad
          </button>
        </EmptyState>
      )}
      {create && <CreateSquadModal onClose={() => setCreate(false)} />}
    </div>
  )
}
export function InvitationsPage() {
  const { data, run, pending } = useWorkspace()
  const [attested, setAttested] = useState<Record<string, boolean>>({})
  const invitations = data.invitations.filter((item) => item.status === 'pending')
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">A SEAT IN THE CONVERSATION</p>
          <h1>You might have found your people.</h1>
          <p>Your invitations. Your choice. Nobody joins without saying yes.</p>
        </div>
      </div>
      {invitations.length ? (
        <div className="invitation-list">
          {invitations.map((invitation) => {
            const squad = data.squads.find((item) => item.id === invitation.squadId)!
            const trip = data.trips.find((item) => item.id === squad.tripId)!
            return (
              <article className="invitation-card" key={invitation.id}>
                <img src={trip.image} alt={trip.location} />
                <div>
                  <span className="pill">{categoryLabels[squad.category]}</span>
                  <h2>
                    {squad.organizer} invited you to {squad.name}
                  </h2>
                  <p>
                    {trip.title} · {dateLabel(trip.date)}
                  </p>
                  <p className="muted">
                    {squad.members} travelers · Expires {dateLabel(invitation.expiresAt)}
                  </p>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={attested[invitation.id] ?? false}
                      onChange={(event) =>
                        setAttested({ ...attested, [invitation.id]: event.target.checked })
                      }
                    />
                    <span>
                      I meet the {categoryLabels[squad.category].toLowerCase()} category
                      requirements. Acceptance is membership, not a seat reservation.
                    </span>
                  </label>
                  <div className="button-row">
                    <button
                      disabled={pending || !attested[invitation.id]}
                      className="button primary"
                      onClick={() =>
                        run(
                          () =>
                            repository.respondInvitation(
                              invitation.id,
                              true,
                              !!attested[invitation.id],
                            ),
                          'Invitation accepted. Reserve your seats separately.',
                        )
                      }
                    >
                      <UsersRound size={16} />
                      Accept invitation
                    </button>
                    <button
                      disabled={pending}
                      className="button outline"
                      onClick={() =>
                        run(
                          () => repository.respondInvitation(invitation.id, false, false),
                          'Invitation declined.',
                        )
                      }
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <EmptyState
          title="All caught up"
          description="Opt into discovery on a departure to hear from compatible squad organizers."
        >
          <Link className="button primary" to="/">
            Explore trips
          </Link>
        </EmptyState>
      )}
    </div>
  )
}
