const { useState, useEffect } = React

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const sections = [
  { title: 'Fish', key: 'fishes', folder: 'fish', file: 'fish' },
  { title: 'Bugs', key: 'bugs', folder: 'bugs', file: 'bugs' },
  { title: 'Sea Creatures', key: 'seacreatures', folder: 'sea', file: 'sea' },
]

function App() {
  const [month, setMonth] = useState(getMonth())
  const [hour] = useState(getHour())
  const [data, setData] = useState({})
  const [showThisHour, setShowThisHour] = useState(false)
  const [southern, setSouthern] = useState(
    () => localStorage.getItem('southern') == 'true',
  )
  const [activeSection, setActiveSection] = useState('fishes')
  const [sortBy, setSortBy] = useState('default')
  const [location, setLocation] = useState('')
  const [showHelp, setShowHelp] = useState(false)
  const [checked, setChecked] = useState(() =>
    localStorage.getItem('checked')
      ? localStorage.getItem('checked').split(',')
      : [],
  )

  useEffect(() => {
    sections.forEach((section) => {
      fetch('./data/' + section.file + '.json')
        .then((response) => response.json())
        .then((json) => setData((data) => ({ ...data, [section.key]: json })))
    })

    const onKeyDown = (event) => {
      if (event.key == 'Escape') setShowHelp(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    localStorage.setItem('southern', southern)
  }, [southern])

  useEffect(() => {
    localStorage.setItem('checked', checked)
  }, [checked])

  const currentSection = sections.find((section) => section.key == activeSection)

  function isAvailable(creature) {
    const availability = creature.availability
    const monthArray = southern
      ? availability['month-array-southern']
      : availability['month-array-northern']
    if (!monthArray.includes(month)) return false
    if (showThisHour && !availability['time-array'].includes(hour)) return false
    return true
  }

  function missing(key) {
    if (!data[key]) return []
    return Object.values(data[key]).filter(
      (creature) =>
        isAvailable(creature) && !checked.includes(creature['file-name']),
    )
  }

  function caught(key) {
    if (!data[key]) return []
    return Object.values(data[key]).filter((creature) =>
      checked.includes(creature['file-name']),
    )
  }

  const places = Object.values(data[activeSection] || {})
    .map((creature) => creature.availability.location)
    .filter((place) => place)
  const locations = [...new Set(places)].sort()

  let visibleCreatures = missing(activeSection)
  if (location) {
    visibleCreatures = visibleCreatures.filter(
      (creature) => creature.availability.location == location,
    )
  }
  if (sortBy == 'name') {
    visibleCreatures.sort((a, b) =>
      a.name['name-USen'].localeCompare(b.name['name-USen']),
    )
  } else if (sortBy == 'price') {
    visibleCreatures.sort((a, b) => b.price - a.price)
  } else if (sortBy == 'time') {
    visibleCreatures.sort((a, b) => startHour(a) - startHour(b))
  }

  function changeSection(key) {
    setActiveSection(key)
    setLocation('')
  }

  function addToChecked(name) {
    setChecked([...checked, name])
  }

  function removeFromChecked(name) {
    setChecked(checked.filter((item) => item != name))
  }

  function resetChecked() {
    if (!confirm("Clear everything you've marked as caught?")) return
    setChecked([])
  }

  return (
    <>
      <header className="intro">
        <button
          className="help"
          onClick={() => setShowHelp(true)}
          title="How to use"
        >
          ?
        </button>
        <h1>Blathers' Checklist</h1>
        <p className="subtitle">A tracking app for Animal Crossing: New Horizons</p>

        <div className="controls">
          <select
            className="select"
            value={month}
            onChange={(event) => setMonth(Number(event.target.value))}
          >
            {months.map((name, i) => (
              <option key={name} value={i + 1}>
                {name}
              </option>
            ))}
          </select>

          <label className="toggle">
            <input
              type="checkbox"
              checked={showThisHour}
              onChange={(event) => {
                setShowThisHour(event.target.checked)
                setMonth(getMonth())
              }}
            />
            <span className="switch"></span>
            Available this hour
          </label>

          <label className="toggle">
            <input
              type="checkbox"
              checked={southern}
              onChange={(event) => setSouthern(event.target.checked)}
            />
            <span className="switch"></span>
            Southern Hemisphere
          </label>
        </div>
      </header>

      {showHelp && (
        <div
          className="modal-backdrop"
          onClick={(event) => {
            if (event.target == event.currentTarget) setShowHelp(false)
          }}
        >
          <div className="modal" role="dialog" aria-labelledby="help-title">
            <h2 id="help-title">What is this?</h2>
            <p>
              A checklist for Animal Crossing: New Horizons that shows the fish,
              bugs and sea creatures you can catch right now and still haven't
              caught yet.
            </p>

            <h3>How to use it</h3>
            <ul>
              <li>
                Pick a <strong>month</strong> to see what's around. It starts
                on the current month.
              </li>
              <li>
                Turn on <strong>Available this hour</strong> to only show what
                you can catch right now.
              </li>
              <li>
                Turn on <strong>Southern Hemisphere</strong> if your island is
                in the south.
              </li>
              <li>
                Switch between <strong>Fish</strong>, <strong>Bugs</strong> and{' '}
                <strong>Sea Creatures</strong> with the tabs, and use the
                dropdowns to sort or filter by location.
              </li>
              <li>
                Hit <strong>✓</strong> on anything you've caught to move it to
                the <strong>Caught</strong> list at the bottom. Click the ✕
                there to undo.
              </li>
            </ul>

            <p className="note">
              Your caught list and hemisphere are saved in this browser.
            </p>

            <button className="ok" onClick={() => setShowHelp(false)}>
              Okay
            </button>
          </div>
        </div>
      )}

      <nav className="tabs">
        {sections.map((section) => (
          <button
            key={section.key}
            className={'tab' + (section.key == activeSection ? ' active' : '')}
            onClick={() => changeSection(section.key)}
          >
            {section.title}{' '}
            <span className="count">{missing(section.key).length}</span>
          </button>
        ))}
      </nav>

      <div className="toolbar">
        <label>
          Sort by{' '}
          <select
            className="select"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
          >
            <option value="default">Museum order</option>
            <option value="name">Name</option>
            <option value="price">Price</option>
            <option value="time">Time of day</option>
          </select>
        </label>

        {locations.length > 0 && (
          <label>
            Location{' '}
            <select
              className="select"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
            >
              <option value="">All locations</option>
              {locations.map((place) => (
                <option key={place} value={place}>
                  {place}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <main className="lists">
        <section className="list">
          <ul>
            {visibleCreatures.map((creature) => (
              <li className="entry" key={creature['file-name']}>
                <img
                  className="icon"
                  src={
                    'img/' +
                    currentSection.folder +
                    '/' +
                    creature['file-name'] +
                    '.png'
                  }
                  alt=""
                />

                <div className="details">
                  <p className="name">{titleCase(creature.name['name-USen'])}</p>
                  <dl className="meta">
                    <dt>Time</dt>
                    <dd>{creature.availability.time || 'All day'}</dd>

                    {creature.availability.location && (
                      <>
                        <dt>Location</dt>
                        <dd>{creature.availability.location}</dd>
                      </>
                    )}

                    {creature.shadow && (
                      <>
                        <dt>Size</dt>
                        <dd>{creature.shadow}</dd>
                      </>
                    )}

                    {creature.speed && (
                      <>
                        <dt>Speed</dt>
                        <dd>{creature.speed}</dd>
                      </>
                    )}
                  </dl>
                  <span className="price">
                    {numberWithCommas(creature.price)}
                  </span>
                </div>

                <button
                  className="check"
                  onClick={() => addToChecked(creature['file-name'])}
                  title="Mark as caught"
                >
                  ✓
                </button>
              </li>
            ))}
          </ul>

          {data[activeSection] && !visibleCreatures.length && (
            <p className="empty">Nothing left to catch here 🎉</p>
          )}
        </section>
      </main>

      {checked.length > 0 && (
        <section className="caught">
          <div className="caught-header">
            <h2>
              Caught <span className="count">{checked.length}</span>
            </h2>
            <button className="reset" onClick={resetChecked}>
              Reset all
            </button>
          </div>

          <ul className="caught-list">
            {sections.map((section) =>
              caught(section.key).map((creature) => (
                <li className="chip" key={creature['file-name']}>
                  <img
                    src={
                      'img/' +
                      section.folder +
                      '/' +
                      creature['file-name'] +
                      '.png'
                    }
                    alt=""
                  />
                  {titleCase(creature.name['name-USen'])}
                  <button
                    onClick={() => removeFromChecked(creature['file-name'])}
                    title="Undo"
                  >
                    ✕
                  </button>
                </li>
              )),
            )}
          </ul>
        </section>
      )}
    </>
  )
}

function titleCase(str) {
  var splitStr = str.toLowerCase().split(' ')
  for (var i = 0; i < splitStr.length; i++) {
    splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1)
  }
  return splitStr.join(' ')
}

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function getHour() {
  var date = new Date()
  var hour = date.getHours()
  return hour
}

// The hour a creature starts showing up, so times like "4pm - 9am" sort as 4pm.
// All day creatures sort first.
function startHour(creature) {
  var hours = creature.availability['time-array']
  if (hours.length == 24) return -1
  return hours.find((hour) => !hours.includes((hour + 23) % 24))
}

function getMonth() {
  var date = new Date()
  var month = date.getMonth()
  return month + 1
}

ReactDOM.createRoot(document.getElementById('app')).render(<App />)
