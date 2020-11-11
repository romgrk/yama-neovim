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

const Application = require('./application.js')
const store = require('./store.js')
const Window = require('./ui/window.js')

const app = new Application(store)
const window = new Window(store, app)

// <for development>
/* eslint-disable no-undef */
global.store = store
global.app = app
global.window = window
/* eslint-enable no-undef */
// </for development>

window.on('destroy', () => {
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
    // '-u', 'NONE',
    __filename,
  ],
  20,
  50
)

window.show()
