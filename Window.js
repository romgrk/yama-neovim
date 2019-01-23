/*
 * Window.js
 */


const EventEmitter = require('events')
const gi = require('node-gtk')
const Gtk = gi.require('Gtk', '3.0')

const KeyEvent = require('./key-event.js')

gi.startLoop()
Gtk.init()

module.exports = class Window extends EventEmitter {
  constructor() {
    super()

    this.onKeyPressEvent = this.onKeyPressEvent.bind(this)

    // Main program window
    this.window = new Gtk.Window({
      type : Gtk.WindowType.TOPLEVEL
    })

    // TextView
    this.textView = new Gtk.TextView()
    this.textView.setMonospace(true)

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
    // this.vbox.packStart(this.hbox,         false, true, 0)
    this.vbox.packStart(this.scrollWindow, true,  true, 0)

    // configure main window
    this.window.setDefaultSize(1024, 720)
    this.window.setResizable(true)
    this.window.add(this.vbox)


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

