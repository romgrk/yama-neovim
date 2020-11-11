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
gi.require('GdkX11', '3.0')

const COMMAND = require('../actions/command.js')
const Color = require('../helpers/color.js')
const KeyEvent = require('../helpers/key-event.js')
const Font = require('../helpers/font.js')

const generateTheme = require('./theme.js')
const Screen = require('./screen.js')
const Cmdline = require('./cmdline.js')
// const Finder = require('./components/Finder.js')

const GtkStyleProviderPriority = {
  FALLBACK:    1,
  THEME:       200,
  SETTINGS:    400,
  APPLICATION: 600,
  USER:        800,
}

const display = Gdk.Display.getDefault()
const screen = display.getDefaultScreen()

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

    this.headerBar = new Gtk.HeaderBar()
    this.closeButton = Gtk.Button.newFromIconName('window-close', Gtk.IconSize.SMALL_TOOLBAR)

    // Editors area
    this.gridContainer = new Gtk.Overlay()
    this.gridContainer.canFocus = true
    this.gridContainer.addEvents(Gdk.EventMask.ALL_EVENTS_MASK)

    // Cmdline
    this.cmdline = new Cmdline(store, app)

    // Container
    this.box = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })

    // this.finder = new Finder()
    // this.finder.hide()

    /*
     * Build our layout
     */

    this.headerBar.packEnd(this.closeButton)
    this.setTitlebar(this.headerBar)

    this.box.packStart(this.gridContainer, true,  true, 0)
    this.box.packEnd(this.cmdline,         false, true, 0)


    // this.setDecorated(false)
    this.setDefaultSize(900, 800)
    this.setResizable(true)
    this.add(this.box)

    /*
     * Event handlers
     */

    this.on('show', () => Gtk.main())
    this.on('destroy', () => this.quit())
    this.on('delete-event', () => false)
    this.on('configure-event', debounce(() => this.tryResize(), 200))

    this.gridContainer.on('realize', this.tryResize)
    this.gridContainer.on('key-press-event', app.receiveKeyEvent)
    this.gridContainer.on('get-child-position', this.onGetChildPosition)

    this.store.on('colorscheme', this.updateTheme)
    this.store.on('title-changed', title => this.headerBar.setTitle(title))
    this.store.on('grid-created', grid => {
      this.gridContainer.addOverlay(new Screen(store, grid))
      this.gridContainer.showAll()
    })
  }

  onGetChildPosition = (screen, rectangle) => {
    const grid = screen.grid
    const font = this.store.font
    const dimensions = this.store.dimensions
    rectangle.x = grid.col * font.cellWidth
    rectangle.y = grid.row * font.cellHeight + (2 * dimensions.remainingHeight)
    rectangle.width  = grid.width  * font.cellHeight
    rectangle.height = grid.height * font.cellHeight
    return true
  }

  tryResize = () => {
    const {cellWidth, cellHeight} = this.store.font
    const width  = this.gridContainer.getAllocatedWidth()
    const height = this.gridContainer.getAllocatedHeight()
    const rows = Math.round(height / cellHeight)
    const cols = Math.ceil(width / cellWidth)
    const remainingWidth  = width  - cols * cellWidth
    const remainingHeight = height - rows * cellHeight

    this.store.dispatch({
      type: 'update-dimensions',
      payload: {
        width,
        height,
        cols,
        rows,
        remainingWidth,
        remainingHeight,
      }
    })
  }

  updateTheme = () => {
    if (this.provider) {
      Gtk.StyleContext.removeProviderForScreen(screen, this.provider)
    }
    this.provider = new Gtk.CssProvider()
    this.provider.loadFromData(generateTheme(this.store))
    Gtk.StyleContext.addProviderForScreen(
      screen,
      this.provider,
      GtkStyleProviderPriority.APPLICATION
    )
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
