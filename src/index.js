/*
 * index.js
 */

const util = require('util')
util.inspect.defaultOptions = { breakLength: 180 }

const gi = require('node-gtk')
const Gtk = gi.require('Gtk', '3.0')
const Gdk = gi.require('Gdk', '3.0')

gi.startLoop()
Gtk.init([])
Gdk.init([])

const Application = require('./application.js')
const Window = require('./window.js')
const Store = require('./store.js')
const KeyEvent = require('./helpers/key-event.js')

const store = new Store()
const app = new Application(store)
const window = new Window(store, app)

// for development
/* eslint-disable no-undef */
global.store = store
global.app = app
global.window = window
/* eslint-enable no-undef */
// </ for development

window.screen.on('key-press', (event, original) => {
  const input = KeyEvent.getVimInput(event)
  const shouldFilter = KeyEvent.shouldFilter(event)

  console.log('KeyPress', { input, shouldFilter })

  if (!shouldFilter)
    app.client.input(input)
})

window.on('quit', () => {
  app.quit()
})

app.on('disconnect', () => {
  window.quit()
})


app.start(
  'nvim',
  [
    '--embed',
    '--headless',
    '--cmd', 'set termguicolors',
    '-u', 'NORC',
    './test.txt'
  ],
  20,
  50
)

window.show()
