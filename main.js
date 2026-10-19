var app = new Vue({
  el: '#app',
  data: {
    month: getMonth(),
    hour: getHour(),
    fishes: null,
    bugs: null,
    seacreatures: null,
    showThisHour: false,
    activeSection: 'fishes',
    sortBy: 'default',
    location: '',
    showHelp: false,
    checked: [],
    months: [
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
    ],
    sections: [
      { title: 'Fish', key: 'fishes', folder: 'fish' },
      { title: 'Bugs', key: 'bugs', folder: 'bugs' },
      { title: 'Sea Creatures', key: 'seacreatures', folder: 'sea' },
    ],
  },
  computed: {
    currentSection: function () {
      return this.sections.find((section) => section.key == this.activeSection)
    },
    locations: function () {
      var creatures = Object.values(this[this.activeSection] || {})
      var places = creatures
        .map((creature) => creature.availability.location)
        .filter((place) => place)
      return [...new Set(places)].sort()
    },
    visibleCreatures: function () {
      var creatures = this.missing(this.activeSection)

      if (this.location) {
        creatures = creatures.filter(
          (creature) => creature.availability.location == this.location,
        )
      }

      if (this.sortBy == 'name') {
        creatures.sort((a, b) =>
          a.name['name-USen'].localeCompare(b.name['name-USen']),
        )
      } else if (this.sortBy == 'price') {
        creatures.sort((a, b) => b.price - a.price)
      } else if (this.sortBy == 'time') {
        creatures.sort((a, b) => startHour(a) - startHour(b))
      }

      return creatures
    },
  },
  watch: {
    activeSection: function () {
      this.location = ''
    },
  },
  methods: {
    titleCase: function (str) {
      var splitStr = str.toLowerCase().split(' ')
      for (var i = 0; i < splitStr.length; i++) {
        splitStr[i] =
          splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1)
      }
      return splitStr.join(' ')
    },
    getMonth: function () {
      return getMonth()
    },
    isAvailable: function (creature) {
      var availability = creature.availability
      if (!availability['month-array-northern'].includes(this.month))
        return false
      if (this.showThisHour && !availability['time-array'].includes(this.hour))
        return false
      return true
    },
    sectionLoaded: function (key) {
      return this[key] != null
    },
    missing: function (key) {
      if (!this[key]) return []
      return Object.values(this[key]).filter(
        (creature) =>
          this.isAvailable(creature) &&
          !this.checked.includes(creature['file-name']),
      )
    },
    caught: function (key) {
      if (!this[key]) return []
      return Object.values(this[key]).filter((creature) =>
        this.checked.includes(creature['file-name']),
      )
    },
    addToChecked: function (name) {
      this.checked.push(name)
      localStorage.setItem('checked', this.checked)
    },
    removeFromChecked: function (name) {
      this.checked.splice(this.checked.indexOf(name), 1)
      localStorage.setItem('checked', this.checked)
    },
    resetChecked: function () {
      if (!confirm("Clear everything you've marked as caught?")) return
      this.checked = []
      localStorage.setItem('checked', this.checked)
    },
    numberWithCommas: function (x) {
      return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    },
  },
  mounted: function () {
    document.addEventListener('keydown', (event) => {
      if (event.key == 'Escape') this.showHelp = false
    })

    fetch('./data/fish.json')
      .then((response) => response.json())
      .then((data) => (this.fishes = data))

    fetch('./data/bugs.json')
      .then((response) => response.json())
      .then((data) => (this.bugs = data))

    fetch('./data/sea.json')
      .then((response) => response.json())
      .then((data) => (this.seacreatures = data))

    if (localStorage.getItem('checked')) {
      this.checked = localStorage.getItem('checked').split(',')
    }
  },
})

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
