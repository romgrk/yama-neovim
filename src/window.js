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

const COMMAND = require('./actions/command.js')
const Font = require('./helpers/font.js')

const Screen = require('./components/Screen.js')
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

    // Overlay container
    this.overlay = new Gtk.Overlay()

    // Screen
    this.screen = new Screen(store)

    // horizontal and vertical boxes
    this.hbox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL })

    // this.finder = new Finder()
    // this.finder.hide()


    /*
     * Build our layout
     */

    // Gtk.Box.prototype
    //  .packStart(children: Gtk.Widget, expand: boolean, fill: boolean, padding: number): void

    // pack vertically top bar (this.hbox) and scrollable window
    // this.hbox.packStart(this.scrollWindow, true, true, 0)
    this.hbox.packStart(this.screen.element,  true, true, 0)

    const mainContainer = this.hbox

    this.overlay.add(mainContainer)
    // this.overlay.addOverlay(this.finder.element)

    // configure main window
    this.element.setDefaultSize(1000, 800)
    this.element.setResizable(true)
    this.element.add(this.overlay)

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

    // this.store.on(COMMAND.FILE_FINDER.OPEN, () => { this.finder.show() })
    // this.store.on(COMMAND.FILE_FINDER.CLOSE, () => { this.finder.hide() })
  }

  tryResize() {
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
