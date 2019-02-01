/*
 * index.js
 */

const gi = require('node-gtk')
const Gtk = gi.require('Gtk', '3.0')
const Gdk = gi.require('Gdk', '3.0')

gi.startLoop()
Gtk.init([])
Gdk.init([])

const Application = require('./application.js')
const Window = require('./window.js')
const KeyEvent = require('./key-event.js')
const Store = require('./store.js')

const store = new Store()
const app = new Application(store)
const window = new Window(store, app)


window.on('key-press', (event, original) => {

  const input = KeyEvent.getVimInput(event)
  const shouldFilter = KeyEvent.shouldFilter(event)

  console.log('KeyPress', { input, shouldFilter })

  if (!shouldFilter)
    app.client.input(input)
})


app.start(
  'nvim',
  ['--embed', '--headless', '-u', 'NORC'],
  20,
  50
)

window.show()


