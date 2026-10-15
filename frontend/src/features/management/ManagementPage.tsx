import { useState, type FormEvent } from 'react'
import { Check, ClipboardList, Plus, ShieldCheck, UsersRound } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { useWorkspace } from '../workspace/WorkspaceProvider'
import { repository } from '../workspace/repository'
import { dateLabel, money } from '../../domain/models'
import { EmptyState, Modal } from '../../components/ui'

export function ManagementPage({ admin = false }: { admin?: boolean }) {
  const { identity } = useAuth()
  const { data, run, pending } = useWorkspace()
  const [create, setCreate] = useState(false)
  const trips = data.trips.filter((trip) => admin || trip.agencyId === identity?.agencyId)
  const reviews = trips.filter((trip) => trip.status === 'pending')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    if (
      await run(
        () =>
          repository.createListing(
            {
              title: String(form.get('title')),
              location: String(form.get('location')),
              date: String(form.get('date')),
              duration: Number(form.get('duration')),
              price: Number(form.get('price')),
            },
            admin,
          ),
        'Listing submitted for review. Bookable inventory requires backend activation.',
      )
    )
      setCreate(false)
  }
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">{admin ? 'SQUADYATRA OPERATIONS' : 'WANDERFOLK TRAVELS'}</p>
          <h1>
            {admin
              ? 'Good journeys start with good standards.'
              : 'Bring your next journey to life.'}
          </h1>
          <p>
            {admin
              ? 'Review listings and keep the marketplace moving.'
              : 'Your listings, departures, and booking coordination in one place.'}
          </p>
        </div>
        <button className="button primary" onClick={() => setCreate(true)}>
          <Plus size={17} />
          {admin ? 'New internal listing' : 'New listing'}
        </button>
      </div>
      <div className="stat-grid">
        <div>
          <ClipboardList size={23} />
          <strong>{trips.length}</strong>
          <span>{admin ? 'Marketplace listings' : 'Your listings'}</span>
        </div>
        <div>
          <ShieldCheck size={23} />
          <strong>{reviews.length}</strong>
          <span>Awaiting review</span>
        </div>
        <div>
          <UsersRound size={23} />
          <strong>
            {
              data.bookings.filter((booking) => trips.some((trip) => trip.id === booking.tripId))
                .length
            }
          </strong>
          <span>Reservations</span>
        </div>
      </div>
      <div className="info-note">
        <ShieldCheck size={21} />
        <span>
          {admin
            ? 'Approval is not inventory activation. New listings remain unbookable until the Booking service activates capacity and commercial rules.'
            : 'Agency visibility is restricted to your own listings. Production ownership and permissions must also be enforced by backend services.'}
        </span>
      </div>
      <section className="management-section">
        <h2>{admin ? 'Listing review & oversight' : 'Your trip listings'}</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Trip & departure</th>
                <th>Agency</th>
                <th>Price</th>
                <th>Publication</th>
                <th>Inventory</th>
                {admin && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {trips.map((trip) => (
                <tr key={trip.id}>
                  <td>
                    <strong>{trip.title}</strong>
                    <small>
                      {trip.location} · {dateLabel(trip.date)}
                    </small>
                  </td>
                  <td>{trip.agency}</td>
                  <td>{money(trip.price)}</td>
                  <td>
                    <span className={`pill ${trip.status === 'pending' ? 'neutral' : ''}`}>
                      {trip.status === 'pending' ? 'Pending review' : 'Approved'}
                    </span>
                  </td>
                  <td>{trip.seats > 0 ? `${trip.seats} demo seats` : 'Awaiting activation'}</td>
                  {admin && (
                    <td>
                      {trip.status === 'pending' ? (
                        <button
                          className="button outline small"
                          disabled={pending}
                          onClick={() =>
                            run(
                              () => repository.approveListing(trip.id),
                              'Listing approved. Inventory activation remains a separate step.',
                            )
                          }
                        >
                          <Check size={15} />
                          Approve
                        </button>
                      ) : (
                        <span className="muted">Reviewed</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!trips.length && (
          <EmptyState
            title="Your first journey starts here"
            description="Create a listing and submit it for marketplace review."
          />
        )}
      </section>
      {create && (
        <Modal title="Create a trip listing" onClose={() => setCreate(false)}>
          <form className="form-stack" onSubmit={submit}>
            <p className="muted">
              New listings go through review. Commercial rules and inventory are activated
              separately.
            </p>
            <label>
              Trip name
              <input
                name="title"
                required
                minLength={5}
                maxLength={100}
                placeholder="A long weekend in the mountains"
              />
            </label>
            <label>
              Destination
              <input name="location" required placeholder="Manali, Himachal Pradesh" />
            </label>
            <div className="form-row">
              <label>
                Departure
                <input
                  type="date"
                  name="date"
                  min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)}
                  required
                />
              </label>
              <label>
                Duration (days)
                <input name="duration" type="number" min={1} max={60} defaultValue={4} required />
              </label>
            </div>
            <label>
              Proposed price per person (INR)
              <input name="price" type="number" min={1} step={1} required placeholder="15000" />
            </label>
            <button disabled={pending} className="button primary full">
              {pending ? 'Submitting...' : 'Submit for review'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}
