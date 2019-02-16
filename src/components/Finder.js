/*
 * Finder.js
 */


const gi = require('node-gtk')
const Gtk = gi.require('Gtk', '3.0')

const KeyEvent = require('../helpers/key-event.js')


class Finder {
  constructor() {

    this.onKeyPress = this.onKeyPress.bind(this)


    this.element = new Gtk.Box({
      orientation: Gtk.Orientation.VERTICAL,
      halign: Gtk.Align.CENTER,
      valign: Gtk.Align.CENTER,
    })
    this.input = new Gtk.Entry()
    this.listBox = new Gtk.ListBox()
    this.scrollWindow = new Gtk.ScrolledWindow()

    this.scrollWindow.add(this.listBox)

    this.element.add(this.input)
    this.element.add(this.scrollWindow)

    this.input.on('key-press-event', this.onKeyPress)
  }

  setChildren(children) {
    const currentChildren = this.listBox.getChildren()
    currentChildren.forEach(child => {
      this.listBox.remove(child)
    })

    children.forEach(child => {
      const row = new Gtk.ListBoxRow()
      row.add(child)
      this.listBox.add(row)
    })
  }

  show() {
    this.element.show()
    this.element.focus()
  }

  hide() {
    this.element.hide()
  }

  onKeyPress(gdkKeyEvent) {
    const event = KeyEvent.fromGdk(gdkKeyEvent)

    console.log(event)

    if (event.name === 'Escape') {
      this.hide()
      return true
    }

    return false
  }
}

module.exports = Finder
