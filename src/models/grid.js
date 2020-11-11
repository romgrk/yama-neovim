/*
 * grid.js
 */

const { EventEmitter } = require('events')

let nextLineId = 1

const getNextLineId = () => nextLineId++

class Grid extends EventEmitter {
  constructor(id, width, height) {
    super()
    this.id = id
    this.win = 0
    this.anchor = undefined
    this.anchorGrid = 0
    this.float = false
    this.focusable = true
    this.external = false
    this.hidden = false
    /* this.position = {
     *   row: 0,
     *   col: 0,
     *   width: 0,
     *   height: 0,
     * } */
    this.viewport = {
      topline: 0,
      botline: 0,
      curline: 0,
      curcol: 0,
    }
    this.row  = 0
    this.col = 0
    this.width  = 0
    this.height = 0
    /* Object.defineProperty(this, 'position', {
     *   get: () => { debugger }
     * }) */
    this.buffer = []
    this.ids = []
    this.resize(width, height)
  }

  setPos(win, row, col, width, height) {
    this.win = win
    this.row = row
    this.col = col
    this.resize(width, height, false)
    this.emit('position', this)
  }

  setFloatPos(win, anchor, anchorGrid, row, col, focusable) {
    this.win = win
    this.float = true
    this.anchor = anchor
    this.anchorGrid = anchorGrid
    this.row = row
    this.col = col
    this.focusable = focusable
    this.emit('float-position', this)
  }

  setViewport(topline, botline, curline, curcol) {
    this.viewport = {
      topline: 0,
      botline: 0,
      curline: 0,
      curcol: 0,
    }
    this.emit('viewport', this.viewport)
  }

  hide() {
    this.hidden = true
    this.emit('hide')
  }

  close() {
    this.emit('close')
  }

  setExternalPos(win) {
    this.win = win
    this.external = true
    this.emit('external-position')
  }

  clear() {
    this.buffer = createArray(this.width * this.height)
    this.emit('clear')
  }

  resize(width, height, event = true) {
    const previousBuffer = this.buffer
    const previousWidth = this.width

    const cells = width * height
    this.buffer = createArray(cells)
    this.ids = createArray(height, getNextLineId)
    this.width = width
    this.height = height

    for (let i = 0; i < previousBuffer.length; i++) {
      const row =  Math.floor(i / previousWidth)
      const col =  i % previousWidth
      const newIndex = col + row * width

      if (col >= width)
        continue
      if (row >= height)
        break

      this.buffer[newIndex] = previousBuffer[i]
    }
    if (event)
      this.emit('resize', this)
  }

  setCells(row, col, cells) {
    let index = col + this.width * row
    if (index >= this.buffer.length)
      throw new Error('Out of bounds access: ' + index)
    if (index + cells.length > this.buffer.length)
      throw new Error(`Out of bounds access: [${index}-${index+cells.length}]`)

    let lastHL = undefined
    for (let i = 0; i < cells.length; i++) {
      const [char, hl = lastHL, repeat = 1] = cells[i]
      for (let j = 0; j < repeat; j++) {
        this.buffer[index++] = [char, hl]
      }
      lastHL = hl
    }
    this.ids[row] = getNextLineId()
  }

  getCell(row, col) {
    const index = col + this.width * row
    if (index >= this.buffer.length)
      throw new Error('Out of bounds access: ' + index)
    return this.buffer[index]
  }

  getChar(row, col) {
    return this.getCell(row, col)[0]
  }

  getLine(row) {
    const start = this.width * row
    const end = this.width + this.width * row
    if (start >= this.buffer.length || end > this.buffer.length)
      throw new Error(`Out of bounds access: [${start}-${end}]`)
    return this.buffer.slice(start, end)
  }

  scroll(top, bot, left, right, rows, cols) {
    if (rows > 0) {
      for (let i = top; i < bot; i++) {
        const sourceRow = i
        const destRow = sourceRow - rows
        if (destRow < 0)
          continue
        if (sourceRow >= this.height) {
          this.ids[destRow] = getNextLineId()
          continue
        }
        const cells = this.getLine(sourceRow).slice(left, right)
        this.setCells(destRow, left, cells)
        this.ids[destRow] = getNextLineId()
        /* if (left === 0 && right === this.width) {
         *   this.ids[destRow] = this.ids[sourceRow]
         * } else {
         *   debugger
         *   this.ids[destRow] = getNextLineId()
         * } */
      }
    }
    else {
      rows = -rows
      for (let i = bot; i >= top; i--) {
        const sourceRow = top + i
        const destRow = sourceRow + rows
        if (destRow >= this.height)
          continue
        if (sourceRow < 0) {
          this.ids[destRow] = getNextLineId()
          continue
        }
        const cells = this.getLine(sourceRow).slice(left, right)
        this.setCells(destRow, left, cells)
        this.ids[destRow] = getNextLineId()
        /* if (left === 0 && right === this.width) {
         *   this.ids[destRow] = this.ids[sourceRow]
         * } else {
         *   debugger
         *   this.ids[destRow] = getNextLineId()
         * } */
      }
    }
  }

  toString() {
    const lines = []
    for (let i = 0; i < this.height; i++) {
      lines.push(String(i).padEnd(2, ' ') + ':[' + this.getLine(i).map(l => l[0] || ' ').join('') + ']')
    }
    return lines.join('\n')
  }
}

module.exports = Grid

function createArray(length, fn) {
  const a = []
  for (let i = 0; i < length; i++)
    a[i] = fn ? fn(i) : [];
  return a
}

