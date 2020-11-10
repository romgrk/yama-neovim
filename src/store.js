/*
 * Store.js
 */

const { EventEmitter } = require('events')
const { Dispatcher } = require('flux')
const chalk = require('chalk')

const UI = require('./actions/ui.js')
const COMMAND = require('./actions/command.js')

// const log = require('../log')
const ScreenDrag = require('./screen-drag')
// const ScreenWheel = require('./screen-wheel')
const Font = require('./helpers/font.js')
const Grid = require('./models/grid.js')

/* export interface Size {
 *     lines: number;
 *     cols: number;
 *     width: number;
 *     height: number;
 * } */

/* export interface Cursor {
 *     line: number;
 *     col: number;
 * } */

/* export interface FontAttributes {
 *     fg: string;
 *     bg: string;
 *     sp: string;
 *     bold: boolean;
 *     italic: boolean;
 *     underline: boolean;
 *     undercurl: boolean;
 *     reverse: boolean;
 * } */

// export type DispatcherType = Dispatcher<ActionType>;


module.exports = class NeovimStore extends EventEmitter {
  /* dispatchToken: string;
    *
    * size: Size;
    * fontAttributes: FontAttributes;
    * foregroundColor: string;
    * backgroundColor: string;
    * specialColor: string;
    * cursor: Cursor;
    * modeInfo: ModeInfoSet;
    * mode: string;
    * busy: boolean;
    * mouse_enabled: boolean;
    * dragging: ScreenDrag;
    * title: string;
    * icon_path: string;
    * wheel_scrolling: ScreenWheel;
    * scrollRegion: Region;
    * dispatcher: Dispatcher<ActionType>;
    * focused: boolean;
    * lineHeight: number;
    * blink_cursor: boolean;
    */

  constructor() {
    super()
    this.dispatcher = new Dispatcher()
    this.dispatchToken = this.dispatcher.register(this.receiveAction.bind(this))

    this.fontFamily = 'monospace'
    this.fontSize = 18
    this.lineHeight = 22
    this.updateFont()

    this.foregroundColor = 'white'
    this.backgroundColor = 'black'
    this.specialColor = 'blue'

    this.focused = true
    this.blinkCursor = false
    this.cursorBlinkInterval = 1000
    this.cursorColor = '#599eff'
    this.cursorThickness = 2

    this.busy = false
    this.mouse_enabled = true
    this.dragging = null
    this.title = ''
    this.icon_path = ''


    this.dimensions = {
      rows: 24,
      cols: 80,
      width: 0,
      height: 0,
    }

    this.mode = 'normal'
    this.modeIndex = -1
    this.modeInfo = []

    this.currentGrid = 1
    this.grids = {
      1: new Grid(1, 0, 0),
    }
    this.grids.get = index => {
      if (!this.grids[index]) {
        this.grids[index] = new Grid(index, 0, 0)
        this.emit('grid-created', this.grids[index])
      }
      return this.grids[index]
    }
    this.cursor = {
      row: 0,
      col: 0,
    }

    this.hlAttributes = {}
    this.hlAttributes.get = id => {
      return this.hlAttributes[id] || this.hlAttributes.default
    }
    this.hlGroups = {}

    this.finder = {
      open: true,
    }
  }

  updateFont() {
    this.font = Font.parse(`${this.fontFamily} ${this.fontSize}px`)
  }

  dispatch(action) {
    this.dispatcher.dispatch(action)
  }

  receiveRedrawEvents(events) {
    for (const e of events) {
      const name = e[0];
      const args = e[1];
      const allArgs = e.slice(1)

      console.log(name, allArgs)

      switch (name) {
        case 'default_colors_set': {
          const [foregroundColor, backgroundColor, specialColor] = args
          this.foregroundColor = foregroundColor
          this.backgroundColor = backgroundColor
          this.specialColor = specialColor
          this.hlAttributes.default = {
            foreground: this.foregroundColor,
            background: this.backgroundColor,
            special: this.specialColor,
          }
          break
        }
        case 'hl_attr_define': {
          const [id, attributes, _, info] = args
          this.hlAttributes[id] = {
            foreground: this.foregroundColor,
            background: this.backgroundColor,
            special: this.specialColor,
            ...attributes,
            info,
          }
          break
        }
        case 'hl_group_set': {
          const [name, id] = args
          this.hlGroups[name] = id
          break
        }
        case 'grid_resize': {
          const [index, width, height] = args
          this.grids.get(index).resize(width, height)
          break
        }
        case 'grid_line': {
          for (let i = 0; i < allArgs.length; i++) {
            const [index, row, col, cells] = allArgs[i]
            this.grids.get(index).setCells(row, col, cells)
          }
          break
        }
        case 'grid_clear': {
          const [index] = args
          this.grids.get(index).clear()
          break
        }
        case 'grid_destroy': {
          const [index] = args
          delete this.grids.get(index)
          break
        }
        case 'grid_cursor_goto': {
          const [index, row, col] = args
          this.currentGrid = index
          this.cursor = { row, col }
          break
        }
        case 'grid_scroll': {
          const [index, top, bot, left, right, rows, cols] = args
          this.grids.get(index).scroll(top, bot, left, right, rows, cols)
          break
        }
        case 'win_pos': {
          const [index, win, row, col, width, height] = args
          this.grids.get(index).setPos(win, row, col, width, height)
          break
        }
        case 'win_float_pos': {
          const [index, win, anchor, anchorGrid, row, col, focusable] = args
          this.grids.get(index).setFloatPos(win, anchor, anchorGrid, row, col, focusable)
          break
        }
        case 'win_external_pos': {
          const [index, win] = args
          this.grids.get(index).setExternalPos(win)
          break
        }
        case 'win_hide': {
          const [index] = args
          this.grids.get(index).hide()
          break
        }
        case 'win_close': {
          const [index] = args
          this.grids.get(index).close()
          delete this.grids.get(index)
          break
        }
        // case 'msg_set_pos': {}
        case 'win_viewport': {
          const [index, win, topline, botline, curline, curcol] = args
          this.grids.get(index).setViewport(win, topline, botline, curline, curcol)
          break
        }

        case 'mode_change': {
          const [mode, modeIndex] = args
          this.mode = mode
          this.modeIndex = modeIndex
          this.emit('mode-change')
          break
        }
        case 'mode_info_set': {
          const [cursorEnabled, modeInfo] = args
          this.modeInfo = modeInfo
          break
        }
        case 'option_set':
        case 'mouse_off':
        {
          // console.warn(chalk.bold.red('Unhandled event: ') + name, args);
          break
        }
        case 'cmdline_show':
        case 'cmdline_hide':
        case 'cmdline_special_char':
        case 'tabline_update':
        case 'msg_show':
        case 'msg_showmode':
        case 'msg_showcmd':
        case 'msg_clear':
        {
          // ignore
          break
        }
        case 'flush': {
          // const text = this.grids[this.currentGrid].toString()
          // window.textView.getBuffer().setText(text, text.length)
          // window.screen.queueDraw()
          this.emit('flush')
          break
        }
        default: {
          debugger
          console.warn(chalk.bold.red('Unhandled event: ') + name, args);
          break;
        }
      }
    }

    // console.log(text)
    // console.log(this.grids)
  }

  receiveAction(action) {
    switch (action.type) {
      case 'update-dimensions': {
        this.dimensions = action.payload
        this.emit('update-dimensions', this.dimensions)
        break
      }
      default: {
        console.warn('Unhandled action: ', action);
        break;
      }
    }
  }

  resize(lines, cols) {
    if (this.size.lines === lines && this.size.cols === cols) {
        return false;
    }

    this.screen.resize(lines, cols)
    this.size.lines = lines;
    this.size.cols = cols;
    this.scrollRegion = {
        top: 0,
        left: 0,
        right: cols - 1,
        bottom: lines - 1,
    };

    console.log(`Screen is resized: (${lines} lines, ${cols} cols)`);
    return true;
  }
}

function copy(object) {
    return JSON.parse(JSON.stringify(object))
}

// Note: 0x001203 -> '#001203'
function colorToString(color, fallback) {
    if (typeof color !== 'number' || color < 0) {
        return fallback;
    }

    return (
        '#' +
        [16, 8, 0]
            .map(shift => {
                const mask = 0xff << shift;
                const hex = ((color & mask) >> shift).toString(16);
                return hex.length < 2 ? '0' + hex : hex;
            })
            .join('')
    );
}

