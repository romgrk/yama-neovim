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

const KeyEvent = require('../helpers/key-event.js')
const Font = require('../helpers/font.js')

const EMPTY_OBJECT = {}

module.exports = class Screen extends Gtk.DrawingArea {
  constructor(store, grid) {
    super()
    this.store = store
    this.grid = grid
    this.validLineIds = new Set()

    this.pangoContext = this.createPangoContext()

    this.canFocus = true
    this.addEvents(Gdk.EventMask.ALL_EVENTS_MASK)
    this.on('draw', this.onDraw)

    this.store.on('flush', () => this.queueDraw())
    this.grid.on('resize', () =>
      this.updateDimensions(this.grid.height, this.grid.width))
  }

  updateDimensions = (lines, cols) => {
    // calculate the total pixel width/height of the drawing area
    this.totalWidth  = this.store.font.cellWidth  * cols
    this.totalHeight = this.store.font.cellHeight * lines

    const gdkWindow = this.getWindow()
    this.cairoSurface = gdkWindow.createSimilarSurface(
                                        Cairo.Content.COLOR,
                                        this.totalWidth,
                                        this.totalHeight)

    this.cairoContext = new Cairo.Context(this.cairoSurface)
    this.pangoLayout = PangoCairo.createLayout(this.cairoContext)
    this.pangoLayout.setAlignment(Pango.Alignment.LEFT)
    this.pangoLayout.setFontDescription(this.store.font.description)

    // this.window.resize(this.totalWidth, this.totalHeight)
    this.setSizeRequest(this.totalWidth, this.totalHeight)
  }

  onDraw = (context) => {

    const grid = this.grid
    const isActive = this.grid.id === this.store.currentGrid

    // const mode = this.store.mode
    // const {fontFamily, fontSize, lineHeight} = this.store

    // const allocatedWidth  = this.getAllocatedWidth()
    // const allocatedHeight = this.getAllocatedHeight()

    // context.setFontSize(fontSize)

    // /* Draw background */
    // setContextColorFromHex(context, colorToHex(this.store.backgroundColor))
    // context.rectangle(0, 0, allocatedWidth, allocatedHeight)
    // context.fill()

    /* Surface not ready yet */
    if (this.cairoSurface === undefined)
      return

    /* Redraw invalid lines */
    for (let i = 0; i < grid.height; i++) {
      if (this.validLineIds.has(grid.ids[i]))
        continue
      this.drawLine(i, this.cairoContext)
    }
    this.validLineIds = new Set(grid.ids)

    /* Draw tokens */
    this.cairoSurface.flush()
    context.save()
    context.rectangle(0, 0, this.totalWidth, this.totalHeight)
    context.clip()
    context.setSourceSurface(this.cairoSurface, 0, 0)
    context.paint()
    context.restore()

    /* Draw cursor */
    if (isActive && this.grid.height > 0)
      this.drawCursor(context)

    return true
  }

  drawLine(row, context) {
    const line = this.grid.getLine(row)

    // console.log(token)
    const markup = lineToMarkup(line, this.store.hlAttributes)
    this.pangoLayout.setMarkup(markup)

    const {width} = this.pangoLayout.getPixelExtents()[1]
    // const calculatedWidth = this.font.cellWidth * token.text.length

    // Draw text

    const x = 0   * this.store.font.cellWidth
    const y = row * this.store.font.cellHeight

    // console.log({ x, y, row, col }, `<span ${this.getPangoAttributes(token.attr || {})}>${escapeMarkup(token.text)}</span>`)
    context.moveTo(x, y)
    PangoCairo.updateLayout(context, this.pangoLayout)
    PangoCairo.showLayout(context, this.pangoLayout)
  }

  drawText(row, col, text, attr, context) {
    this.pangoLayout.setMarkup(renderText(attr, text))

    const {width} = this.pangoLayout.getPixelExtents()[1]
    // const calculatedWidth = this.font.cellWidth * token.text.length

    const x = col * this.store.font.cellWidth
    const y = row * this.store.font.cellHeight

    // console.log({ x, y, row, col }, `<span ${this.getPangoAttributes(token.attr || {})}>${escapeMarkup(token.text)}</span>`)
    context.moveTo(x, y)
    PangoCairo.updateLayout(context, this.pangoLayout)
    PangoCairo.showLayout(context, this.pangoLayout)

    // Draw text

    // if (width <= (calculatedWidth + 1) && width >= (calculatedWidth - 1)) {
    //   const x = col  * this.font.cellWidth
    //   const y = row * this.font.cellHeight

    //   // console.log({ x, y, row, col }, `<span ${this.getPangoAttributes(token.attr || {})}>${escapeMarkup(token.text)}</span>`)
    //   context.moveTo(x, y)
    //   PangoCairo.updateLayout(context, this.pangoLayout)
    //   PangoCairo.showLayout(context, this.pangoLayout)
    // }
    // else {
    //   // Draw characters one by one

    //   /* console.log({
    //    *   calculatedWidth: this.font.cellWidth * token.text.length,
    //    *   width: width,
    //    *   text: token.text,
    //    * }) */
    //   for (let i = 0; i < token.text.length; i++) {
    //     const char = token.text[i]

    //     // Draw text
    //     const x = (col + i)  * this.font.cellWidth
    //     const y = row * this.font.cellHeight

    //     // console.log({ x, y, row, col, cellWidth: this.font.cellWidth }, `<span ${this.getPangoAttributes(token.attr || {})}>${escapeMarkup(char)}</span>`)
    //     this.pangoLayout.setMarkup(`<span ${this.getPangoAttributes(token.attr || {})}>${escapeMarkup(char)}</span>`)

    //     context.moveTo(x, y)
    //     PangoCairo.updateLayout(context, this.pangoLayout)
    //     PangoCairo.showLayout(context, this.pangoLayout)
    //   }
    // }
  }

  drawCursor(context) {
    const focused = this.store.focused
    // const mode = this.store.mode
    const modeInfo = this.store.modeInfo[this.store.modeIndex]

    setContextColorFromHex(context, this.store.cursorColor)

    // if (blink && !this.blinkValue)
      // return 

    if (!focused) {
      this.drawCursorBlockOutline(context)
    }
    else if (modeInfo.cursor_shape === 'vertical') {
      this.drawCursorBeam(context)
    }
    else if (modeInfo.cursor_shape === 'block') {
      this.drawCursorBlock(context)
    }
    else if (modeInfo.cursor_shape === 'horizontal') {
      this.drawCursorUnderline(context)
    }
    else {
      this.drawCursorBlock(context)
    }
  }

  drawCursorUnderline(context) {
    const cursor = this.store.cursor

    context.rectangle(
       cursor.col * this.store.font.cellWidth,
      (cursor.row + 1) * this.store.font.cellHeight - this.store.cursorThickness,
      this.store.font.cellWidth,
      this.store.cursorThickness
    )
    context.fill()
  }

  drawCursorBeam(context) {
    const cursor = this.store.cursor

    context.rectangle(
      cursor.col * this.store.font.cellWidth,
      cursor.row * this.store.font.cellHeight,
      this.store.cursorThickness,
      this.store.font.cellHeight
    )
    context.fill()
  }

  drawCursorBlock(context) {
    const cursor = this.store.cursor

    const [char, hl] = this.grid.getCell(cursor.row, cursor.col)

    const text = char
    const attr = this.store.hlAttributes.get(hl)

    const foreground = colorToHex(attr.background || this.store.backgroundColor)
    const background = colorToHex(attr.foreground || this.store.foregroundColor)

    const cursorAttr = { foreground, background }

    this.drawText(cursor.row, cursor.col, text, cursorAttr, context)
  }

  drawCursorBlockOutline(context) {
    const cursor = this.store.cursor

    context.rectangle(
      cursor.col * this.store.font.cellWidth,
      cursor.row * this.store.font.cellHeight,
      this.store.font.cellWidth,
      this.store.font.cellHeight
    )
    context.stoke()
  }
}


/*
 * Helpers
 */

function lineToMarkup(line, hlAttributes) {
  let markup = ''
  let text = ''
  let lastHL = undefined
  for (let i = 0; i < line.length; i++) {
    const [char, hl] = line[i]
    if (hl !== lastHL && i !== 0) {
      markup += renderText(hlAttributes[lastHL] || hlAttributes.default, text)
      text = ''
    }
    text += char
    lastHL = hl
  }
  if (text !== '') {
    markup += renderText(hlAttributes[lastHL] || hlAttributes.default, text)
    text = ''
  }
  return markup
}

function renderText(style, text) {
  let result = '<span '
  for (let key in style) {
    const value = style[key]
    switch (key) {
      case 'foreground': result += `foreground="${colorToHex(value)}" `; break
      case 'background': result += `background="${colorToHex(value)}" `; break
      case 'fontWeight': result += `weight="${value}" `; break
      case 'size': result += `size="${value}" `; break
      case 'style': result += `style="${value}" `; break
    }
  }
  result += `>${escapeMarkup(text)}</span>`
  return result
}

function colorToHex(color) {
  if (typeof color === 'number')
    return '#' + color.toString(16).padStart(6, '0')
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
