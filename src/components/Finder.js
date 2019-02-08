/*
 * Finder.js
 */


const gi = require('node-gtk')
const Gtk = gi.require('Gtk', '3.0')


class Finder {
  constructor() {
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

    this.setChildren([
      new Gtk.Label({ label: 'Item 1' }),
      new Gtk.Label({ label: 'Item 2' }),
      new Gtk.Label({ label: 'Item 3' }),
    ])
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
}

module.exports = Finder
