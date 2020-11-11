/*
 * completion.js
 */


const gi = require('node-gtk')
const Gtk = gi.require('Gtk', '3.0')

const KeyEvent = require('../helpers/key-event.js')
const CompletionItems = require('./completion-items')

// {
//   open: false,
//   selected: -1,
//   items: [],
//   grid: 0,
//   col: 0,
//   row: 0,
// }

class Completion extends Gtk.Box {
  constructor(store, app, container) {
    super({ orientation: Gtk.Orientation.VERTICAL })

    this.store = store
    this.app = app
    this.container = container

    this.scrollContainer = new Gtk.ScrolledWindow()
    this.packStart(this.scrollContainer, true, true, 0)

    this.getStyleContext().addClass('completion_list')

    this.isAttached = false
    this.isReversed = false

    this.store.on('popupmenu-show', this.onShow)
    this.store.on('popupmenu-select', this.onSelect)
    this.store.on('popupmenu-hide', this.onHide)
  }

  computePosition(rectangle) {
    const font = this.store.font
    const { items, row, col } = this.store.popupmenu

    rectangle.x += col * font.cellWidth - 2
    rectangle.y += row * font.cellHeight

    const containerHeight = this.container.getAllocatedHeight()
    const containerWidth  = this.container.getAllocatedWidth()

    const requestedHeight = Math.min(items.length, 15) * font.cellHeight
    const heightBelow = containerHeight - rectangle.y
    const heightAbove = rectangle.y - font.cellHeight

    if (heightBelow >= requestedHeight || heightBelow > heightAbove) {
      rectangle.y += font.cellHeight
      rectangle.height = Math.min(requestedHeight, heightBelow - font.cellHeight)
    }
    else {
      rectangle.y -= Math.min(requestedHeight, heightAbove - font.cellHeight)
      rectangle.height = Math.min(requestedHeight, heightAbove - font.cellHeight)
      if (!this.isReversed) {
        this.isReversed = true
      }
    }

    if (this.items) {
      this.setItems(this.items, this.isReversed)
      this.items = undefined
    }

    // const requestedWidth = Math.min(items.length, 15) * font.cellWidth

    rectangle.x -= 3.5 * font.cellWidth
    rectangle.width = Math.min(600, containerWidth - rectangle.x)
    // rectangle.height = 100
  }

  onShow = ({ items, grid, col, row }) => {
    this.grid = this.store.grids[this.store.popupmenu.grid]

    if (!this.isAttached)
      this.container.addOverlay(this)
    this.isAttached = true
    this.items = items
    this.showAll()
  }

  onSelect = ({ pos }) => {
    // TODO
  }

  onHide = () => {
    if (this.isAttached)
      this.container.remove(this)
    this.isAttached = false
    // TODO
  }

  setItems = (items, reversed = false) => {
    this.clearItems()
    this.scrollContainer.add(new CompletionItems(items, reversed))
    this.showAll()
  }

  clearItems = () => {
    const children = this.scrollContainer.getChildren()
    children.forEach(c => this.scrollContainer.remove(c))
  }
}

module.exports = Completion
