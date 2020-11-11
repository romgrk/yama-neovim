/*
 * window.js
 */


const EventEmitter = require('events')
const colornames = require('colornames')
const debounce = require('debounce')
const gi = require('node-gtk')
const Gtk = gi.require('Gtk', '3.0')
const Gdk = gi.require('Gdk', '3.0')
const Cairo = gi.require('cairo')
const Pango = gi.require('Pango')
const PangoCairo = gi.require('PangoCairo')

const COMMAND = require('../actions/command.js')
const KeyEvent = require('../helpers/key-event.js')
const Font = require('../helpers/font.js')

const Screen = require('./screen.js')
const Cmdline = require('./cmdline.js')
// const Finder = require('./components/Finder.js')

class Window extends Gtk.Window {
  constructor(store, app) {
    super({
      type : Gtk.WindowType.TOPLEVEL
    })

    this.app = app
    this.store = store

    /*
     * Build UI
     */

    /* this.textContainer = new Gtk.ScrolledWindow()
     * this.textView = new Gtk.TextView()
     * this.textView.monospace = true
     * this.textContainer.add(this.textView) */

    // Editors are
    this.gridContainer = new Gtk.Overlay()
    this.gridContainer.canFocus = true
    this.gridContainer.addEvents(Gdk.EventMask.ALL_EVENTS_MASK)

    // Cmdline
    this.cmdline = new Cmdline(store, app)

    // horizontal and vertical boxes
    this.box = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })

    // this.finder = new Finder()
    // this.finder.hide()

    /*
     * Build our layout
     */

    // pack vertically top bar (this.box) and scrollable window
    // this.box.packStart(this.scrollWindow, true, true, 0)
    // this.box.packStart(this.screen.element,  true, true, 0)
    // this.box.packStart(this.textContainer,  true, true, 0)
    this.box.packStart(this.gridContainer,  true, true, 0)
    this.box.packEnd(this.cmdline,        false, true, 0)


    // const mainContainer = this.box

    // this.overlay.add(mainContainer)
    // this.overlay.addOverlay(this.finder.element)

    // configure main window
    this.setDefaultSize(800, 800)
    this.setResizable(true)
    this.add(this.box)

    /*
     * Event handlers
     */

    this.on('show', () => Gtk.main())
    this.on('destroy', () => this.quit())
    this.on('delete-event', () => false)
    this.on('configure-event', debounce(() => this.tryResize(), 200))

    this.gridContainer.on('key-press-event', app.receiveKeyEvent)
    this.gridContainer.on('realize', () => {
      this.tryResize()
    })
    // this.app.on('start', () => {
    //   this.tryResize()
    // })

    this.store.on('grid-created', grid => {
      const screen = new Screen(store, grid)
      this.gridContainer.addOverlay(screen)
      this.gridContainer.showAll()
      grid.on('close', () => {
        this.gridContainer.remove(screen)
      })
    })
    this.gridContainer.on('get-child-position', (screen, rectangle) => {
      const grid = screen.grid
      const font = this.store.font
      rectangle.x = grid.col * font.cellWidth
      rectangle.y = grid.row * font.cellHeight
      rectangle.width  = grid.width * font.cellHeight
      rectangle.height = grid.height * font.cellHeight
      return true
    })
  }

  tryResize() {
    const {cellWidth, cellHeight} = this.store.font
    const width  = this.gridContainer.getAllocatedWidth()
    const height = this.gridContainer.getAllocatedHeight()
    const rows = Math.round(height / cellHeight)
    const cols = Math.round(width / cellWidth)
    // debugger

    this.store.dispatch({
      type: 'update-dimensions',
      payload: {
        width, height, cols, rows
      }
    })
  }

  show() {
    this.showAll()
  }

  quit() {
    clearInterval(this.blinkInterval)
    Gtk.mainQuit()
  }
}

module.exports = Window
