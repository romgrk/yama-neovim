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
const Font = require('../helpers/font.js')

const Screen = require('./screen.js')
// const Finder = require('./components/Finder.js')

class Window extends EventEmitter {
  constructor(store, application) {
    super()

    this.application = application
    this.store = store

    /*
     * Build UI
     */

    // Main program window
    this.element = new Gtk.Window({
      type : Gtk.WindowType.TOPLEVEL
    })

    /* this.textContainer = new Gtk.ScrolledWindow()
     * this.textView = new Gtk.TextView()
     * this.textView.monospace = true
     * this.textContainer.add(this.textView) */

    // Screen
    this.gridContainer = new Gtk.Overlay()

    // horizontal and vertical boxes
    this.hbox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL })

    // this.finder = new Finder()
    // this.finder.hide()

    /*
     * Build our layout
     */

    // pack vertically top bar (this.hbox) and scrollable window
    // this.hbox.packStart(this.scrollWindow, true, true, 0)
    // this.hbox.packStart(this.screen.element,  true, true, 0)
    // this.hbox.packStart(this.textContainer,  true, true, 0)
    this.hbox.packStart(this.gridContainer,  true, true, 0)


    // const mainContainer = this.hbox

    // this.overlay.add(mainContainer)
    // this.overlay.addOverlay(this.finder.element)

    // configure main window
    this.element.setDefaultSize(800, 800)
    this.element.setResizable(true)
    this.element.add(this.hbox)

    /*
     * Event handlers
     */

    this.element.on('show', () => Gtk.main())
    this.element.on('destroy', () => this.quit())
    this.element.on('delete-event', () => false)
    this.element.on('configure-event', debounce(() => this.tryResize(), 200))


    this.application.on('start', () => {
      this.tryResize()
    })

    this.store.on('grid-created', grid => {
      const screen = new Screen(store, grid)
      this.gridContainer.addOverlay(screen)
      this.gridContainer.showAll()
    })
    this.gridContainer.on('get-child-position', (screen, rectangle) => {
      const grid = screen.grid
      const font = this.store.font
      rectangle.x = grid.position.col * font.cellWidth
      rectangle.y = grid.position.row * font.cellHeight
      rectangle.width  = grid.width * font.cellHeight
      rectangle.height = grid.height * font.cellHeight
      return true
    })
    // this.store.on(COMMAND.FILE_FINDER.OPEN, () => { this.finder.show() })
    // this.store.on(COMMAND.FILE_FINDER.CLOSE, () => { this.finder.hide() })
  }

  tryResize() {
    return
    const {cellWidth, cellHeight} = Font.parse(`${this.store.fontFamily} ${this.store.fontSize}px`)
    const width  = this.screen.element.getAllocatedWidth()
    const height = this.screen.element.getAllocatedHeight()
    const lines = Math.floor(height / cellHeight)
    const cols  = Math.floor(width / cellWidth)

    this.application.client.uiTryResize(cols, lines)
  }

  show() {
    this.element.showAll()
  }

  quit() {
    clearInterval(this.blinkInterval)
    Gtk.mainQuit()
    this.emit('quit')
  }
}

module.exports = Window
