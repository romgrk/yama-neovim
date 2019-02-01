/*
 * window.js
 */


const EventEmitter = require('events')
const colornames = require('colornames')
const gi = require('node-gtk')
const Gtk = gi.require('Gtk', '3.0')
const Cairo = gi.require('cairo')

const KeyEvent = require('./key-event.js')

const EMPTY_OBJECT = {}

module.exports = class Window extends EventEmitter {
  constructor(store, application) {
    super()

    this.application = application
    this.store = store

    this.onStoreFlush = this.onStoreFlush.bind(this)
    this.onKeyPressEvent = this.onKeyPressEvent.bind(this)
    this.onDraw = this.onDraw.bind(this)

    this.initialize()
  }

  initialize() {

    // Main program window
    this.window = new Gtk.Window({
      type : Gtk.WindowType.TOPLEVEL
    })

    // TextView
    this.textView = new Gtk.TextView()
    this.textView.setMonospace(true)

    // Draw area
    this.drawingArea = new Gtk.DrawingArea()
    this.drawingArea.on('draw', this.onDraw)

    // Toolbar with buttons
    this.toolbar = new Gtk.Toolbar()

    // Buttons to go back, go forward, or refresh
    this.button = {
      back:    Gtk.ToolButton.newFromStock(Gtk.STOCK_GO_BACK),
      forward: Gtk.ToolButton.newFromStock(Gtk.STOCK_GO_FORWARD),
      refresh: Gtk.ToolButton.newFromStock(Gtk.STOCK_REFRESH),
    }

    // where the URL is written and shown
    this.urlBar = new Gtk.Entry()

    // the browser container, so that it is scrollable
    this.scrollWindow = new Gtk.ScrolledWindow({})

    // horizontal and vertical boxes
    this.hbox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL })
    this.vbox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })


    /*
    * Build our layout
    */

    this.scrollWindow.add(this.textView)

    /* this.toolbar.add(this.button.back)
     * this.toolbar.add(this.button.forward)
     * this.toolbar.add(this.button.refresh) */

    // Gtk.Box.prototype
    //  .packStart(children: Gtk.Widget, expand: boolean, fill: boolean, padding: number): void

    // pack horizontally this.toolbar and url bar
    // this.hbox.packStart(this.toolbar, false, false, 0)
    // this.hbox.packStart(this.urlBar,  true,  true,  8)

    // pack vertically top bar (this.hbox) and scrollable window
    this.hbox.packStart(this.scrollWindow, true, true, 0)
    this.hbox.packStart(this.drawingArea,  true, true, 0)

    // configure main window
    this.window.setDefaultSize(1200, 720)
    this.window.setResizable(true)
    this.window.add(this.hbox)


    /*
    * Event handlers
    */

    // whenever a new page is loaded ...
    this.textView.on('key-press-event', this.onKeyPressEvent)

    // define "enter" / call-to-action event (whenever the url changes on the bar)
    /* this.urlBar.on('activate', () => {
     *   let href = url(this.urlBar.getText())
     *   this.urlBar.setText(href)
     *   this.textView.loadUri(href)
     * }) */

    // window show event
    this.window.on('show', () => {
      // bring it on top in OSX
      // window.setKeepAbove(true)

      // This start the Gtk event loop. It is required to process user events.
      // It doesn't return until you don't need Gtk anymore, usually on window close.
      Gtk.main()
    })

    // window after-close event
    this.window.on('destroy', () => this.quit())

    // window close event: returning true has the semantic of preventing the default behavior:
    // in this case, it would prevent the user from closing the window if we would return `true`
    this.window.on('delete-event', () => false)

    // Start listening to events
    this.store.on('flush', this.onStoreFlush)
  }

  onStoreFlush() {
    this.drawingArea.queueDraw()

    const text = this.store.screen.getText()
    this.setText(text)
  }

  onDraw(context) {

    context.setSourceRgb(1.0, 1.0, 1.0)

    const fontFamily = 'Fantasque Sans Mono'
    const defaultColor = 'white'
    const defaultBackgroundColor = this.store.bg_color // '#2c3133'

    const fontSize = 14
    const lineHeight = 16

    context.setFontSize(fontSize)

    const extents = context.textExtents('X')
    const xAdvance = extents.xAdvance
    /* console.log({
     *   xAdvance: extents.xAdvance,
     *   yAdvance: extents.yAdvance,
     *   width:    extents.width,
     *   height:   extents.height,
     *   xBearing: extents.xBearing,
     *   yBearing: extents.yBearing,
     * }) */

    const screen = this.store.screen

    /* {
      fg: 'black',
      bg: 'white',
      sp: 'white',
      bold: true,
      italic: undefined,
      underline: undefined,
      undercurl: undefined,
      draw_width: 1,
      draw_height: 1,
      width: 1,
      height: 1,
      specified_px: 1,
      face: 'monospace'
    } */

    let currentY = 20

    setContextColorFromHex(context, colorToHex(this.store.bg_color))
    context.rectangle(0, currentY, screen.cols * xAdvance, screen.length * lineHeight)
    context.fill()

    for (let i = 0; i < screen.length; i++) {
      const line = screen[i]
      const tokens = line.tokens

      let currentX = 0

      for (let j = 0; j < tokens.length; j++) {
        const token = tokens[j]
        const attr = token.attr || EMPTY_OBJECT

        const fg = colorToHex(attr && attr.fg ? attr.fg : defaultColor)
        const bg = colorToHex(attr && attr.bg ? attr.bg : defaultBackgroundColor)

        const width = token.text.length * xAdvance

        context.selectFontFace(
          fontFamily,
          attr.italic ? Cairo.FontSlant.ITALIC : Cairo.FontSlant.NORMAL,
          attr.bold   ? Cairo.FontWeight.BOLD : Cairo.FontWeight.NORMAL
        )

        setContextColorFromHex(context, bg)
        context.rectangle(currentX, currentY, width, lineHeight)
        context.fill()

        setContextColorFromHex(context, fg)
        context.moveTo(currentX, currentY - extents.yBearing)
        context.showText(token.text)

        // console.log({ line: i, text: token.text, color: fg, x: currentX, y: currentY })

        currentX += width
      }

      currentY += lineHeight
    }

    return true
  }

  onKeyPressEvent(event) {
    if (!event)
      return

    this.emit('key-press', KeyEvent.fromGdk(event), event)

    return true
  }

  show() {
    this.window.showAll()
  }

  quit() {
    Gtk.mainQuit()
    process.exit()
    // FIXME(quit neovim)
  }

  setText(string) {
    this.textView.getBuffer().setText(string, countUtf8Bytes(string))
  }
}


/*
 * Helpers
 */

// if link doesn't have a protocol, prefixes it via http://
function url(href) {
  return /^([a-z]{2,}):/.test(href) ? href : ('http://' + href)
}

function countUtf8Bytes(s){
  let b = 0
  let i = 0
  let c
  for (; c = s.charCodeAt(i++); b += c >> 11 ? 3 : c >> 7 ? 2 : 1);
  return b
}

function colorToHex(color) {
  if (color.charAt(0) === '#')
    return color
  return colornames(color)
}

function gdkColorToHex(color) {
  return (
    '#'
    + (color.red   * 255).toFixed(0).toString(16)
    + (color.green * 255).toFixed(0).toString(16)
    + (color.blue  * 255).toFixed(0).toString(16)
  )
}

function setContextColorFromHex(context, hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  context.setSourceRgb(r, g, b)
}
