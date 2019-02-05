/*
 * window.js
 */


const EventEmitter = require('events')
const colornames = require('colornames')
const gi = require('node-gtk')
const Gtk = gi.require('Gtk', '3.0')
const Cairo = gi.require('cairo')
const Pango = gi.require('Pango')
const PangoCairo = gi.require('PangoCairo')

const Actions = require('./actions.js')
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
    this.onResize = this.onResize.bind(this)

    this.totalWidth  = 200
    this.totalHeight = 300
    this.cellWidth   = 10
    this.cellHeight  = 15

    this.initialize()
  }

  initialize() {

    /*
     * Build UI components first
     */

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
     * Other objects
     */

    this.pangoContext = this.drawingArea.createPangoContext()


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
    this.store.on('resize', this.onResize)

    // Cursor blink
    this.blinkInterval = setInterval(() => this.blink(), 600)
  }

  blink() {
    this.blinkValue = !this.blinkValue
    this.drawingArea.queueDraw()
  }

  show() {
    this.window.showAll()
  }

  quit() {
    clearInterval(this.blinkInterval)
    Gtk.mainQuit()
    process.exit()
    // FIXME(quit neovim)
  }

  getPosition(line, col) {
    return [col * this.cellWidth, line * this.cellHeight]
  }

  drawText(line, col, tokens, context) {
    const markups = []
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i]
      markups.push(`<span ${this.getPangoAttributes(token.attr)}>${token.text}</span>`)
    }
    this.pangoLayout.setMarkup(markups.join(''))

    // Draw text
    const x = col  * this.cellWidth
    const y = line * this.cellHeight

    context.moveTo(x, y)
    PangoCairo.updateLayout(context, this.pangoLayout)
    PangoCairo.showLayout(context, this.pangoLayout)
  }

  getPangoAttributes(attr) {
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

    const pangoAttrs = {
      foreground: colorToHex(attr.fg ? attr.fg : this.store.fg_color),
      background: colorToHex(attr.bg ? attr.bg : this.store.bg_color),
    }

    if (attr) {
      Object.keys(attr).forEach(key => {
        switch (key) {
          case 'reverse':
            const {foreground, background} = pangoAttrs
            pangoAttrs.foreground = background
            pangoAttrs.background = foreground
            break
          case 'italic':
            pangoAttrs.font_style = 'italic'
            break
          case 'bold':
            pangoAttrs.font_weight = 'bold'
            if (this.boldSpacing)
              pangoAttrs.letter_spacing = String(this.boldSpacing)
            break
          case 'underline':
            pangoAttrs.underline = 'single'
            break
        }
      })
    }

    return Object.keys(pangoAttrs).map(key => `${key}=${pangoAttrs[key]}`).join(' ')
  }

  setText(string) {
    this.textView.getBuffer().setText(string, countUtf8Bytes(string))
  }

  onStoreFlush() {
    this.drawingArea.queueDraw()

    const text = this.store.screen.getText(this.store.cursor)
    this.setText(text)
  }

  onResize(lines, cols) {

    // create FontDescription object for the selected font/size
    const fontDetails = parseFont(`${this.store.fontFamily} ${this.store.fontSize}`)
    const {fontDescription, pixels, normalWidth, boldWidth} = fontDetails

    this.fontDescription = fontDescription

    // calculate the letter_spacing required to make bold have the same
    // width as normal
    this.boldSpacing = normalWidth - boldWidth
    const [cellWidth, cellHeight] = pixels
    // calculate the total pixel width/height of the drawing area
    this.totalWidth = cellWidth * cols
    this.totalHeight = cellHeight * lines

    const gdkwin = this.drawingArea.getWindow()
    const content = Cairo.Content.COLOR

    this.cairoSurface = gdkwin.createSimilarSurface(content,
                                                    this.totalWidth,
                                                    this.totalHeight)
    this.cairoContext = new Cairo.Context(this.cairoSurface)
    this.pangoLayout = PangoCairo.createLayout(this.cairoContext)
    this.pangoLayout.setAlignment(Pango.Alignment.LEFT)
    this.pangoLayout.setFontDescription(this.fontDescription)
    this.cellWidth = cellWidth
    this.cellHeight = cellHeight
    // this.window.resize(this.totalWidth, this.totalHeight)
  }

  onDraw(context) {

    const screen = this.store.screen
    const cursor = this.store.cursor
    const mode = this.store.mode

    const defaultColor = this.store.fg_color
    const defaultBackgroundColor = this.store.bg_color // '#2c3133'

    const {fontFamily, fontSize, lineHeight} = this.store

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

    context.setFontSize(fontSize)


    const originY = 20
    let currentY = originY

    /* Draw background */
    setContextColorFromHex(context, colorToHex(this.store.bg_color))
    console.log(0, currentY, this.totalWidth, this.totalHeight)
    context.rectangle(0, currentY, this.totalWidth, this.totalHeight)
    context.fill()

    /* Draw tokens */
    for (let i = 0; i < screen.length; i++) {
      const line = screen[i]
      const tokens = line.tokens

      this.drawText(line, 0, tokens, context)

/*       let currentX = 0
 * 
 *       for (let j = 0; j < tokens.length; j++) {
 *         const token = tokens[j]
 *         const attr = token.attr || EMPTY_OBJECT
 * 
 *         const fg = colorToHex(attr.fg ? attr.fg : defaultColor)
 *         const bg = colorToHex(attr.bg ? attr.bg : defaultBackgroundColor)
 * 
 *         const width = token.text.length * this.cellWidth
 * 
 *         context.selectFontFace(
 *           fontFamily,
 *           attr.italic ? Cairo.FontSlant.ITALIC : Cairo.FontSlant.NORMAL,
 *           attr.bold   ? Cairo.FontWeight.BOLD : Cairo.FontWeight.NORMAL
 *         )
 * 
 *         setContextColorFromHex(context, bg)
 *         context.rectangle(currentX, currentY, width, lineHeight)
 *         context.fill()
 * 
 *         setContextColorFromHex(context, fg)
 *         context.moveTo(currentX, currentY - this.cellHeight)
 *         context.showText(token.text)
 * 
 *         currentX += width
 *       } */

      currentY += lineHeight
    }

    /* Draw cursor */
    if (this.blinkValue) {
      context.setSourceRgba(0.8, 0.8, 0.8, 1)

      if (mode === 'insert' || mode === 'cmdline_normal') {
        context.setLineWidth(2)
        context.moveTo(cursor.col * this.cellWidth, originY + cursor.line * lineHeight)
        context.lineTo(cursor.col * this.cellWidth, originY + (cursor.line + 1) * lineHeight)
        context.stroke()
      }
      else {
        const token = screen.getTokenAt(cursor.line, cursor.col) || { text: '' }

        const attr = token.attr || EMPTY_OBJECT

        const fg = colorToHex(attr.fg ? attr.fg : defaultColor)
        const bg = colorToHex(attr.bg ? attr.bg : defaultBackgroundColor)

        context.selectFontFace(
          fontFamily,
          attr.italic ? Cairo.FontSlant.ITALIC : Cairo.FontSlant.NORMAL,
          attr.bold   ? Cairo.FontWeight.BOLD : Cairo.FontWeight.NORMAL
        )

        setContextColorFromHex(context, fg)
        console.log(
          cursor.col * this.cellWidth,
          originY + cursor.line * lineHeight,
          this.cellWidth,
          lineHeight
        )
        context.rectangle(
          cursor.col * this.cellWidth,
          originY + cursor.line * lineHeight,
          this.cellWidth,
          lineHeight
        )
        context.fill()

        setContextColorFromHex(context, bg)
        context.moveTo(cursor.col * this.cellWidth, originY + (cursor.line + 1) * lineHeight)
        context.showText(token.text)
      }
    }


    /* Draw grid */

    currentY = originY

    context.setSourceRgba(1.0, 0, 0, 0.8)
    context.setLineWidth(1)

    for (let i = 0; i < screen.length; i++) {

      context.moveTo(0, currentY)
      context.lineTo(this.totalWidth, currentY)
      context.stroke()

      let currentX = 0

      for (let j = 0; j < screen.cols; j++) {
        context.moveTo(currentX, currentY)
        context.lineTo(currentX, currentY + lineHeight)
        context.stroke()

        currentX += this.cellWidth
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

function parseFont(font) {
  const cr = new Cairo.Context(new Cairo.ImageSurface(Cairo.Format.RGB24, 300, 300))
  const fontDescription = Pango.fontDescriptionFromString(font)
  const layout = PangoCairo.createLayout(cr)
  layout.setFontDescription(fontDescription)
  layout.setAlignment(Pango.Alignment.LEFT)
  layout.setMarkup('<span font_weight="bold">A</span>')
  const [boldWidth] = layout.getSize()
  layout.setMarkup('<span>A</span>')
  const pixels = layout.getPixelSize()
  const [normalWidth] = layout.getSize()
  return { fontDescription, pixels, normalWidth, boldWidth }
}
