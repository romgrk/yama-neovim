/*
 * application.js
 */


const path = require('path')
const child_process = require('child_process')
const EventEmitter = require('events')
const chalk = require('chalk')
const { attach } = require('neovim')

const KeyEvent = require('./helpers/key-event.js')
const UI = require('./actions/ui.js')
const Command = require('./actions/command.js')


class Application extends EventEmitter {

  static getRuntimeDirectory() {
    return path.join(__dirname, '../runtime/')
  }

  constructor(store) {
    super()
    this.store = store
  }

  async start(command, argv, lines, columns) {
    let err

    this.neovim_process = child_process.spawn(
      command,
      argv,
      { stdio: ['pipe', 'pipe', process.stderr] }
    )

    this.neovim_process.on('error', (e) => {
      err = e
      console.error(err)
    })

    if (err || this.neovim_process.pid === undefined) {
      return Promise.reject(err || new Error('Failed to spawn process: ' + this.command));
    }

    this.client = await attach({ proc: this.neovim_process })
    this.client.on('request', this.onRequested.bind(this))
    this.client.on('notification', this.onNotified.bind(this))
    this.client.on('disconnect', this.onDisconnect.bind(this)) 
    this.client.uiAttach(columns, lines, {
      rgb: true,
      override: true,
      ext_hlstate: true,
      ext_linegrid: true,
      ext_multigrid: true,
      ext_popupmenu: true,
    })
    this.client.uiTryResize(this.store.dimensions.cols, this.store.dimensions.rows)
    this.started = true

    console.log(`nvim attached: ${this.neovim_process.pid} ${lines}x${columns} ${JSON.stringify(argv)}`)

    this.store.on('update-dimensions', ({ cols, rows }) =>
      this.client.uiTryResize(cols, rows))

    // Note: Neovim frontend has responsiblity to emit 'GUIEnter' on initialization
    this.client.command('doautocmd <nomodeline> GUIEnter', true)

    this.emit('start')
  }

  onRequested(method, args, response) {
      console.log('requested: ', method, args, response);
  }

  onNotified(method, args) {
    if (method === 'redraw') {
      this.store.receiveRedrawEvents(args);
    }
    else if (method === 'autocmd') {
      const [eventName, autocmdArgs] = args[0]
      this.store.receiveAutocmd(eventName, autocmdArgs)
    }
    else if (method === 'command') {
      const [[cmdName, ...cmdArgs]] = args
      console.warn(chalk.bold.red('Command: '), args);
      this.handleCommand(cmdName, cmdArgs)
    }
    else {
      // User defined notifications are passed here.
      console.log('Unknown method', { method, args });
      process.exit(0)
    }
  }

  onDisconnect() {
    console.log('disconnected: ' + this.neovim_process.pid);
    this.started = false;
    this.emit('disconnect')
  }

  quit() {
    if (!this.started)
      return Promise.resolve()
    this.started = false
    this.client.uiDetach()
    this.client.quit()
    return
  }

  handleCommand(name, args) {
    const d = this.store.dispatcher;

    switch (name) {
      case 'FileFinder': {
        if (this.store.finder.open)
          d.dispatch(Command.fileFinderClose())
        else
          d.dispatch(Command.fileFinderOpen())
        break
      }
      default: {
        console.warn(chalk.bold.red('Unhandled command: '), name, args);
      }
    }
  }

  receiveKeyEvent = (gdkEvent) => {
    const event = KeyEvent.fromGdk(gdkEvent)
    const input = KeyEvent.getVimInput(event)
    const shouldFilter = KeyEvent.shouldFilter(event)
    // console.log('KeyPress', { input, shouldFilter })
    if (!shouldFilter)
      this.client.input(input)
    return true
  }
}

module.exports = Application
