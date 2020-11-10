/*
 * index.js
 */

const path = require('path')
const util = require('util')
util.inspect.defaultOptions = { breakLength: 180 }

const gi = require('node-gtk')
const Gtk = gi.require('Gtk', '3.0')
const Gdk = gi.require('Gdk', '3.0')

require('./helpers/cairo-prototype-extend.js')

gi.startLoop()
Gtk.init([])
Gdk.init([])

const KeyEvent = require('./helpers/key-event.js')
const Application = require('./application.js')
const Store = require('./store.js')
const Window = require('./ui/window.js')

const store = new Store()
const app = new Application(store)
const window = new Window(store, app)

// <for development>
/* eslint-disable no-undef */
global.store = store
global.app = app
global.window = window
/* eslint-enable no-undef */
// </for development>

window.element.canFocus = true
window.element.addEvents(Gdk.EventMask.ALL_EVENTS_MASK)
window.element.on('key-press-event', (gdkEvent) => {
  const event = KeyEvent.fromGdk(gdkEvent)
  const input = KeyEvent.getVimInput(event)
  const shouldFilter = KeyEvent.shouldFilter(event)
  console.log('KeyPress', { input, shouldFilter })
  if (!shouldFilter)
    app.client.input(input)
  return true
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
    '--cmd', 'source ' + path.join(Application.getRuntimeDirectory(), 'init.vim'),
    '-u', 'NONE',
    __filename,
  ],
  20,
  50
)

window.show()
