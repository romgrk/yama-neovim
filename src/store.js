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

const initialPopupmenu = {
  open: false,
  index: -1,
  items: [],
}

const initialCmdline = {
  open: false,
  content: [],
  c: undefined,
  shift: false,
  pos: -1,
  firstc: '',
  prompt: '',
  indent: 0,
  level: 0,
  lines: [],
}

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
    this.fontSize = 16
    this.lineHeight = 20
    this.updateFont()

    this.foregroundColor = 'white'
    this.backgroundColor = 'black'
    this.specialColor = 'blue'

    this.focused = true
    this.blinkCursor = false
    this.cursorBlinkInterval = 1000
    this.cursorColor = '#ffffff'
    this.cursorThickness = 1

    this.busy = false
    this.mouse_enabled = true
    this.dragging = null
    this.title = ''
    this.icon_path = ''

    this.popupmenu = initialPopupmenu

    this.dimensions = {
      rows: 24,
      cols: 80,
      width: 0,
      height: 0,
      remainingWidth: 0,
      remainingHeight: 0,
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
    this.hlGroups.get = name => {
      return this.hlAttributes[this.hlGroups[name]]
    }

    this.cmdline = initialCmdline
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

      // console.log(name, allArgs)
      // console.log(name, args)
      if (name.includes('win_'))
        console.log(name, args)

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
          for (let i = 0; i < allArgs.length; i++) {
            const [id, attributes, _, info] = allArgs[i]
            this.hlAttributes[id] = {
              ...attributes,
              info,
            }
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
          this.grids.get(index).close()
          delete this.grids[index]
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
          delete this.grids[index]
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
        case 'busy_start': {
          this.busy = true
          this.emit('busy-changed', this.busy)
          break
        }
        case 'busy_stop': {
          this.busy = false
          this.emit('busy-changed', this.busy)
          break
        }
        case 'set_title': {
          const [title] = args
          this.title = title
          this.emit('title-changed', this.title)
          break
        }

        case 'popupmenu_show': {
          const [items, selected, row, col, grid] = args
          this.popupmenu = {
            ...this.popupmenu,
            open: true,
            items, selected, row, col, grid
          }
          this.emit('popupmenu-show', this.popupmenu)
          break
        }
        case 'popupmenu_select': {
          const [selected] = args
          this.popupmenu = {
            ...this.popupmenu,
            selected,
          }
          this.emit('popupmenu-update', this.popupmenu)
          break
        }
        case 'popupmenu_hide': {
          this.popupmenu = { ...this.popupmenu, open: false }
          this.emit('popupmenu-hide', this.popupmenu)
          break
        }

        case 'cmdline_show': {
          const [content, pos, firstc, prompt, indent, level] = args
          this.cmdline = {
            ...this.cmdline,
            open: true,
            content, pos, firstc, prompt, indent, level
          }
          this.emit('cmdline-show', this.cmdline)
          break
        }
        case 'cmdline_hide': {
          this.cmdline = { ...this.cmdline, open: false }
          this.emit('cmdline-hide')
          break
        }
        case 'cmdline_pos': {
          const [pos, level] = args
          this.cmdline = {
            ...this.cmdline,
            pos, level
          }
          this.emit('cmdline-update', this.cmdline)
          break
        }
        case 'cmdline_special_char': {
          const [c, shift, level] = args
          this.cmdline = {
            ...this.cmdline,
            c, shift, level
          }
          this.emit('cmdline-update', this.cmdline)
          break
        }
        case 'cmdline_block_show': {
          const [lines] = args
          this.cmdline = {
            ...this.cmdline,
            lines
          }
          this.emit('cmdline-update', this.cmdline)
          break
        }
        case 'cmdline_block_append': {
          const [line] = args
          this.cmdline = {
            ...this.cmdline,
            lines: this.cmdline.lines.concat(line)
          }
          this.emit('cmdline-update', this.cmdline)
          break
        }
        case 'cmdline_block_hide': {
          this.cmdline = { ...this.cmdline, lines: [] }
          this.emit('cmdline-update', this.cmdline)
          break
        }

        case 'option_set':
        case 'mouse_on':
        case 'mouse_off':
        case 'set_icon':
        case 'update_menu':
        case 'bell':
        case 'visual_bell':
        {
          // console.warn(chalk.bold.red('Unhandled event: ') + name, args);
          break
        }
        case 'tabline_update':
        case 'msg_show':
        case 'msg_showmode':
        case 'msg_showcmd':
        case 'msg_ruler':
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

  receiveAutocmd(name, args) {
    switch (name) {
      case 'ColorScheme': {
        this.emit('colorscheme', args)
        break
      }
      default:
        console.warn(chalk.bold.red('Unhandled autocmd: '), name, args);
    }
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

