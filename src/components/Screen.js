/*
 * Screen.js
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

const Actions = require('../actions.js')
const KeyEvent = require('../helpers/key-event.js')
const Font = require('../helpers/font.js')

const EMPTY_OBJECT = {}

module.exports = class Screen extends EventEmitter {
  constructor(store) {
    super()

    this.store = store

    this.resetBlink = this.resetBlink.bind(this)
    this.blink = this.blink.bind(this)
    this.onStoreFlush = this.onStoreFlush.bind(this)
    this.onKeyPressEvent = this.onKeyPressEvent.bind(this)
    this.onDraw = this.onDraw.bind(this)
    this.onResize = this.onResize.bind(this)

    this.totalWidth  = 200
    this.totalHeight = 300

    this.cellWidth   = 10
    this.cellHeight  = 15

    this.cursorThickness = 2

    this.updateDimensions(this.store.size.lines, this.store.size.cols)

    /*
     * Build UI
     */

    // Draw area
    this.drawingArea = new Gtk.DrawingArea()
    this.drawingArea.canFocus = true
    this.drawingArea.addEvents(Gdk.EventMask.ALL_EVENTS_MASK)

    this.element = this.drawingArea

    this.pangoContext = this.drawingArea.createPangoContext()

    /*
     * Event handlers
     */

    this.drawingArea.on('draw', this.onDraw)
    this.drawingArea.on('key-press-event', this.onKeyPressEvent)

    // Start listening to events
    this.store.on('flush', this.onStoreFlush)
    this.store.on('resize', this.onResize)
    this.store.on('cursor', this.resetBlink)

    // Cursor blink
    this.resetBlink()
  }

  tryResize() {
    const fd = Pango.fontDescriptionFromString(`${this.store.fontFamily} ${this.store.fontSize}px`)
    const {cellWidth, cellHeight} = Font.parse(fd)
    const width  = this.drawingArea.getAllocatedWidth()
    const height = this.drawingArea.getAllocatedHeight()
    const lines = Math.floor(height / cellHeight)
    const cols  = Math.floor(width / cellWidth)

    this.application.client.uiTryResize(cols, lines)
  }

  updateDimensions(lines, cols) {
    // Create font details
    const font = {}
    font.string = `${this.store.fontFamily} ${this.store.fontSize}px`
    font.description = Pango.fontDescriptionFromString(font.string)
    font.doubleWidthChars = Font.getDoubleWidthCodePoints(font.description)

    this.font = font

    const {cellWidth, cellHeight, normalWidth, boldWidth} = Font.parse(this.font.description)

    // calculate the letter_spacing required to make bold have the same width as normal
    this.boldSpacing = normalWidth - boldWidth
    // calculate the total pixel width/height of the drawing area
    this.totalWidth  = cellWidth * cols
    this.totalHeight = cellHeight * lines

    this.cairoSurface = new Cairo.ImageSurface(Cairo.Format.RGB24,
                                                    this.totalWidth,
                                                    this.totalHeight)
    this.cairoContext = new Cairo.Context(this.cairoSurface)
    this.pangoLayout = PangoCairo.createLayout(this.cairoContext)
    this.pangoLayout.setAlignment(Pango.Alignment.LEFT)
    this.pangoLayout.setFontDescription(this.font.description)
    this.cellWidth = cellWidth
    this.cellHeight = cellHeight
    // this.window.resize(this.totalWidth, this.totalHeight)
  }

  resetBlink() {
    if (this.blinkInterval)
      clearInterval(this.blinkInterval)
    this.blinkInterval = setInterval(this.blink, 600)
    this.blinkValue = true
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
    this.emit('quit')
  }

  getPosition(line, col) {
    return [col * this.cellWidth, line * this.cellHeight]
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
      reverse: undefined,
    } */

    const pangoAttrs = {
      foreground: colorToHex(attr.fg ? attr.fg : this.store.foregroundColor),
      background: colorToHex(attr.bg ? attr.bg : this.store.backgroundColor),
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

    return Object.keys(pangoAttrs).map(key => `${key}="${pangoAttrs[key]}"`).join(' ')
  }

  drawText(line, col, token, context) {

    // console.log(token)
    this.pangoLayout.setMarkup(`<span ${this.getPangoAttributes(token.attr || {})}>${escapeMarkup(token.text)}</span>`)

    const {width} = this.pangoLayout.getPixelExtents()[1]
    const calculatedWidth = this.cellWidth * token.text.length


    // Draw text

    if (width <= (calculatedWidth + 1) && width >= (calculatedWidth - 1)) {
      const x = col  * this.cellWidth
      const y = line * this.cellHeight

      console.log(`<span ${this.getPangoAttributes(token.attr || {})}>${escapeMarkup(token.text)}</span>`)
      context.moveTo(x, y)
      PangoCairo.updateLayout(context, this.pangoLayout)
      PangoCairo.showLayout(context, this.pangoLayout)
    }
    else {
      // Draw characters one by one

      console.log({
        calculatedWidth: this.cellWidth * token.text.length,
        width: width,
        text: token.text,
      })
      for (let i = 0; i < token.text.length; i++) {
        const char = token.text[i]

        // Draw text
        const x = (col + i)  * this.cellWidth
        const y = line * this.cellHeight

        console.log(`<span ${this.getPangoAttributes(token.attr || {})}>${escapeMarkup(char)}</span>`)
        this.pangoLayout.setMarkup(`<span ${this.getPangoAttributes(token.attr || {})}>${escapeMarkup(char)}</span>`)

        context.moveTo(x, y)
        PangoCairo.updateLayout(context, this.pangoLayout)
        PangoCairo.showLayout(context, this.pangoLayout)
      }
    }
  }

  drawCursor(context) {
    const focused = this.store.focused
    const mode = this.store.mode

    setContextColorFromHex(context, this.store.cursorColor)

    if (!focused) {
      this.drawCursorBlockOutline(context, false)
    }
    else if (mode === 'insert' || mode === 'cmdline_normal') {
      this.drawCursorI(context, true)
    }
    else if (mode === 'normal') {
      this.drawCursorBlock(context, true)
    }
    else if (mode === 'visual') {
      this.drawCursorBlock(context, false)
    }
    else if (mode === 'replace' || mode === 'operator') {
      this.drawCursorUnderline(context, false)
    }
    else {
      this.drawCursorBlock(context, true)
    }
  }

  drawCursorUnderline(context, blink) {
    if (blink && !this.blinkValue)
      return

    const cursor = this.store.cursor

    context.rectangle(
      cursor.col * this.cellWidth,
      (cursor.line + 1) * this.cellHeight - this.cursorThickness,
      this.cellWidth,
      this.cursorThickness
    )
    context.fill()
  }

  drawCursorI(context, blink) {
    if (blink && !this.blinkValue)
      return

    const cursor = this.store.cursor

    context.rectangle(
      cursor.col * this.cellWidth,
      cursor.line * this.cellHeight,
      this.cursorThickness,
      this.cellHeight
    )
    context.fill()
  }

  drawCursorBlock(context, blink) {
    if (blink && !this.blinkValue)
      return

    const screen = this.store.screen
    const cursor = this.store.cursor

    const token = screen.tokenForCharAt(cursor.line, cursor.col) || { text: '' }

    const text = token.text || ' '
    const attr = token.attr || EMPTY_OBJECT

    const fg = colorToHex(attr.fg ? attr.fg : this.store.foregroundColor)
    const bg = colorToHex(attr.bg ? attr.bg : this.store.backgroundColor)

    const cursorToken = { text, attr: { ...attr, fg: bg, bg: fg } }

    this.drawText(cursor.line, cursor.col, cursorToken, context)
  }

  drawCursorBlockOutline(context, blink) {
    if (blink && !this.blinkValue)
      return

    const cursor = this.store.cursor

    context.rectangle(
      cursor.col * this.cellWidth,
      cursor.line * this.cellHeight,
      this.cellWidth,
      this.cellHeight
    )
    context.stoke()
  }

  onDraw(context) {

    const screen = this.store.screen
    const mode = this.store.mode
    console.log(screen.lines[0])

    const {fontFamily, fontSize, lineHeight} = this.store

    const allocatedWidth  = this.drawingArea.getAllocatedWidth()
    const allocatedHeight = this.drawingArea.getAllocatedHeight()

    context.setFontSize(fontSize)

    /* Draw background */
    setContextColorFromHex(context, colorToHex(this.store.backgroundColor))
    context.rectangle(0, 0, allocatedWidth, allocatedHeight)
    context.fill()

    /* Draw tokens */
    for (let i = 0; i < screen.lines.length; i++) {
      const line = screen.lines[i]
      const tokens = line.tokens

      let col = 0
      for (let j = 0; j < tokens.length; j++) {
        const token = tokens[j]
        this.drawText(i, col, token, context)
        col += token.length
      }
    }

    /* Draw cursor */
    if (screen.size.lines > 0)
      this.drawCursor(context)

    /* Draw grid */
    if (true) {
      let currentY = 0

      context.setSourceRgba(1.0, 0, 0, 0.8)
      context.setLineWidth(1)

      for (let i = 0; i < screen.lines.length; i++) {

        context.moveTo(0, currentY)
        context.lineTo(this.totalWidth, currentY)
        context.stroke()

        let currentX = 0

        for (let j = 0; j < screen.size.cols; j++) {
          context.moveTo(currentX, currentY)
          context.lineTo(currentX, currentY + this.cellHeight)
          context.stroke()

          currentX += this.cellWidth
        }

        currentY += this.cellHeight
      }
    }

    return true
  }

  onStoreFlush() {
    this.drawingArea.queueDraw()
  }

  onResize(lines, cols) {
    this.updateDimensions(lines, cols)
  }

  onKeyPressEvent(event) {
    if (!event)
      return

    this.emit('key-press', KeyEvent.fromGdk(event), event)
    this.resetBlink()

    return true
  }
}



/*
 * Helpers
 */

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

function escapeMarkup(text) {
  return text.replace(/<|>|&/g, m => {
    switch (m) {
      case '<': return '&lt;'
      case '>': return '&gt;'
      case '&': return '&amp;'
    }
    return m
  })
}
