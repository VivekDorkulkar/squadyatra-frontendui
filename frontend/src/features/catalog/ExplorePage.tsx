import { useDeferredValue, useState } from 'react'
import {
  ArrowDown,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  Compass,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
  UsersRound,
  X,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { useWorkspace } from '../workspace/WorkspaceProvider'
import { images } from '../../data/seed'
import { TripCard } from './TripCard'
import { EmptyState } from '../../components/ui'

export function ExplorePage({ saved = false }: { saved?: boolean }) {
  const { data } = useWorkspace()
  const { identity } = useAuth()
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('Anywhere')
  const [month, setMonth] = useState('Anytime')
  const [category, setCategory] = useState('All adventures')
  const [sort, setSort] = useState('recommended')
  const [filters, setFilters] = useState(false)
  const [budget, setBudget] = useState(40000)
  const deferredSearch = useDeferredValue(search)
  const categories = [
    'All adventures',
    'Mountain trails',
    'Beach escapes',
    'Culture & heritage',
    'Slow escapes',
  ]
  const trips = data.trips
    .filter(
      (trip) =>
        trip.status === 'published' &&
        (!saved || data.saved.includes(trip.id)) &&
        `${trip.title} ${trip.location}`.toLowerCase().includes(deferredSearch.toLowerCase()) &&
        (region === 'Anywhere' || trip.region === region) &&
        (month === 'Anytime' || trip.date.slice(0, 7) === month) &&
        (category === 'All adventures' || trip.category === category) &&
        trip.minimumPrice <= budget,
    )
    .sort((first, second) =>
      sort === 'price'
        ? first.minimumPrice - second.minimumPrice
        : sort === 'date'
          ? first.date.localeCompare(second.date)
          : second.reviews - first.reviews,
    )
  const reset = () => {
    setSearch('')
    setRegion('Anywhere')
    setMonth('Anytime')
    setCategory('All adventures')
    setBudget(40000)
  }
  return (
    <div className="page explore-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            {saved
              ? 'KEEP THE GOOD ONES CLOSE'
              : `A WORLD OF POSSIBILITIES, ${identity?.name.toUpperCase() ?? 'TRAVELER'}`}
          </p>
          <h1>{saved ? 'Your someday starts here.' : 'Good trips. Better company.'}</h1>
          <p>
            {saved
              ? 'The places you keep coming back to. Make one your next stop.'
              : 'Find a place you love. Meet a squad you’ll love traveling with.'}
          </p>
        </div>
        <span className="heading-note">
          <span className="live-dot" />
          Your next chapter is out there
        </span>
      </div>
      {!saved && (
        <section
          className="explore-hero"
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(15,49,43,.86), rgba(15,49,43,.35) 52%, rgba(15,49,43,0) 80%), url(${images.mountains})`,
          }}
          aria-label="Featured mountain adventures"
        >
          <div className="hero-copy">
            <span className="hero-eyebrow">
              <Sparkles size={14} />
              LESS ORDINARY. MORE TOGETHER.
            </span>
            <h2>
              Go for the places.
              <br />
              Stay for the people.
            </h2>
            <p>
              Big little adventures. Shared stories.
              <br />
              And a squad that just gets you.
            </p>
            <button
              className="button hero-button"
              onClick={() => {
                setCategory('Mountain trails')
                document
                  .getElementById('trip-results')
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
            >
              Find your next adventure
              <ArrowUpRightIcon />
            </button>
          </div>
          <div className="hero-coordinate">
            <MapPin size={14} />
            <span>
              The Himalayas, India<small>28.5983° N · 83.9311° E</small>
            </span>
          </div>
          <span className="hero-index">
            01 <span>/ 03</span>
          </span>
        </section>
      )}
      <section className="search-panel" aria-label="Search trips">
        <label className="search-destination">
          <MapPin size={19} />
          <span>
            <small>WHERE TO?</small>
            <input
              placeholder="Search a destination or trip"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </span>
          {search && (
            <button className="icon-button" aria-label="Clear search" onClick={() => setSearch('')}>
              <X size={16} />
            </button>
          )}
        </label>
        <label className="search-select">
          <Compass size={19} />
          <span>
            <small>YOUR CORNER OF THE WORLD</small>
            <select value={region} onChange={(event) => setRegion(event.target.value)}>
              {['Anywhere', 'North India', 'South India', 'West India', 'International'].map(
                (value) => (
                  <option key={value}>{value}</option>
                ),
              )}
            </select>
          </span>
        </label>
        <label className="search-select">
          <CalendarDays size={19} />
          <span>
            <small>WHEN?</small>
            <select value={month} onChange={(event) => setMonth(event.target.value)}>
              <option value="Anytime">Anytime works</option>
              <option value="2027-01">January 2027</option>
              <option value="2027-02">February 2027</option>
            </select>
          </span>
        </label>
        <button
          className="button primary search-action"
          onClick={() =>
            document.getElementById('trip-results')?.scrollIntoView({ behavior: 'smooth' })
          }
        >
          <Search size={18} />
          Explore trips
        </button>
      </section>
      {!saved && (
        <div className="benefits-strip">
          <span>
            <Check size={15} />
            Handpicked, not hundreds
          </span>
          <span>
            <UsersRound size={16} />
            Find your kind of squad
          </span>
          <span>
            <ArrowDown size={15} />
            Bigger squad, smaller price
          </span>
          <Link to="/squads">
            The better-together way
            <ArrowRight size={14} />
          </Link>
        </div>
      )}
      <section id="trip-results" className="results-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{saved ? 'YOUR SHORTLIST' : 'A LITTLE WANDERLUST, CURATED'}</p>
            <h2>
              {saved ? 'Worth saving. Worth going.' : 'Where will your story go next?'}
              <span className="result-count">{trips.length} trips</span>
            </h2>
          </div>
          <label className="sort-control">
            Sort by
            <select
              aria-label="Sort trips"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              <option value="recommended">Recommended</option>
              <option value="price">Price: low to high</option>
              <option value="date">Next departure</option>
            </select>
            <ChevronDown size={13} />
          </label>
        </div>
        <div className="filter-bar">
          <div className="category-tabs" aria-label="Trip categories">
            {categories.map((value, index) => (
              <button
                key={value}
                className={category === value ? 'selected' : ''}
                onClick={() => setCategory(value)}
              >
                {index === 0 && <Compass size={15} />}
                {value}
              </button>
            ))}
          </div>
          <button
            className={`filter-button ${filters ? 'selected' : ''}`}
            onClick={() => setFilters(!filters)}
            aria-expanded={filters}
          >
            <SlidersHorizontal size={15} />
            Filters{budget < 40000 && <span className="filter-dot" />}
          </button>
        </div>
        {filters && (
          <div className="expanded-filters">
            <label>
              Maximum per-person squad price <strong>₹{budget.toLocaleString('en-IN')}</strong>
              <input
                type="range"
                min="10000"
                max="40000"
                step="1000"
                value={budget}
                onChange={(event) => setBudget(Number(event.target.value))}
              />
            </label>
            <button className="text-button" onClick={reset}>
              Reset all filters
            </button>
          </div>
        )}
        {trips.length ? (
          <div className="trip-grid">
            {trips.map((trip, index) => (
              <TripCard trip={trip} key={trip.id} index={index} />
            ))}
          </div>
        ) : (
          <EmptyState
            title={saved ? 'A little room for wanderlust' : 'No trips on this trail'}
            description={
              saved
                ? 'Save a trip that catches your eye. It will be waiting right here.'
                : 'Try a different destination, date, or budget.'
            }
          >
            <button className="button primary" onClick={reset}>
              Reset filters
            </button>
          </EmptyState>
        )}
      </section>
      <div className="bottom-callout">
        <span className="callout-icon">
          <UsersRound size={25} />
        </span>
        <div>
          <h3>The best part of the trip? Your people.</h3>
          <p>Start with a destination. Let the squad be the happy surprise.</p>
        </div>
        <Link to="/squads">
          Meet the squads
          <ArrowRight size={17} />
        </Link>
      </div>
    </div>
  )
}
function ArrowUpRightIcon() {
  return <ArrowRight size={17} />
}
