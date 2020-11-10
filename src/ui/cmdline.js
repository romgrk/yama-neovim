/*
 * cmdline.js
 */

const gi = require('node-gtk')
const Gtk = gi.require('Gtk', '3.0')

const KeyEvent = require('../helpers/key-event.js')


class Cmdline extends Gtk.Entry {
  constructor(store, app) {
    super()
    this.store = store

    this.on('key-press-event', app.receiveKeyEvent)
    this.on('focus-in-event', () => {
      if (!this.store.mode.includes('cmdline')
        && !this.store.cmdline.open)
        app.client.input(':')
    })
    this.on('focus-out-event', () => {
      if (this.store.mode.includes('cmdline')
        || this.store.cmdline.open) {

        app.client.input('<Esc>')
        global.window.gridContainer.grabFocus()
      }
    })
    this.store.on('cmdline-show', this.onShow)
    this.store.on('cmdline-update', this.onUpdate)
    this.store.on('cmdline-hide', this.onHide)
  }

  onShow = ({ content, firstc, prompt, pos }) => {
    const text =
        (firstc || '')
      + (prompt || '')
      + content.map(c => c[1]).join('')

    if (!this.isFocus()) {
      this.previous = global.window.getFocus()
      this.grabFocus()
    }
    this.setText(text)
    this.setPosition(pos + 1)
  }

  onUpdate = ({ pos }) => {
    this.setPosition(pos + 1)
  }

  onHide = () => {
    this.setText('')
    if (this.previous)
      this.previous.grabFocus()
  }
}

module.exports = Cmdline
