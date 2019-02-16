/*
 * Store.js
 */

const { EventEmitter } = require('events')
const { Dispatcher } = require('flux')

const UI = require('./actions/ui.js')
const COMMAND = require('./actions/command.js')

// const log = require('../log')
const ScreenDrag = require('./screen-drag')
// const ScreenWheel = require('./screen-wheel')
const { Screen, Line } = require('./models.js')

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
        this.size = {
            lines: 0,
            cols: 0,
            width: 0,
            height: 0,
        }
        this.cursor = {
            line: 0,
            col: 0,
        }
        this.fontFamily = 'Fira Code Retina'
        this.fontSize = 12
        this.lineHeight = 16
        this.fontAttributes = {
            fg: 'white',
            bg: 'black',
            sp: null,
            bold: false,
            italic: false,
            underline: false,
            undercurl: false,
            reverse: false,
        }
        this.foregroundColor = 'white'
        this.backgroundColor = 'black'
        this.specialColor = 'blue'
        this.cursorColor = '#888888'
        this.cursorThickness = 2
        this.modeInfo = {}
        this.mode = 'normal'
        this.busy = false
        this.mouse_enabled = true
        this.dragging = null
        this.title = ''
        this.icon_path = ''
        // this.wheel_scrolling = new ScreenWheel(this)
        this.scrollRegion = {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
        }
        this.focused = true
        this.blink_cursor = false
        this.cursor_blink_interval = 1000
        this.dispatchToken = this.dispatcher.register(this.receiveAction.bind(this))
        this.screen = new Screen(0, 0)

        this.finder = {
            open: true,
        }
    }

    dispatch(action) {
        this.dispatcher.dispatch(action)
    }

    receiveAction(action) {
        switch (action.type) {
            case UI.INPUT: {
                this.emit('input', action.input);
                break;
            }
            case UI.PUT_TEXT: {
                this.screen.put(this.cursor, { text: action.text.join(''), attr: copy(this.fontAttributes) })
                this.cursor.col = this.cursor.col + action.text.length
                this.emit('put', action.text)
                this.emit('cursor')
                break;
            }
            case UI.CURSOR: {
                this.cursor = {
                    line: action.line,
                    col: action.col,
                };
                this.emit('cursor');
                break;
            }
            case UI.HIGHLIGHT: {
                const hl = action.highlight;
                this.fontAttributes.fg = colorToString(hl.foreground, this.foregroundColor);
                this.fontAttributes.bg = colorToString(hl.background, this.backgroundColor);
                this.fontAttributes.sp = colorToString(hl.special, this.specialColor || this.foregroundColor);
                this.fontAttributes.bold = hl.bold;
                this.fontAttributes.italic = hl.italic;
                this.fontAttributes.underline = hl.underline;
                this.fontAttributes.undercurl = hl.undercurl;
                this.fontAttributes.reverse = hl.reverse;
                // console.log('Highlight is updated: ', this.fontAttributes);
                break;
            }
            case UI.FOCUS_CHANGED: {
                this.focused = action.focused;
                this.emit('focus-changed');
                console.log('Focus changed: ', this.focused);
                break;
            }
            case UI.CLEAR_EOL: {
                this.screen.clearLine(this.cursor.line, this.cursor.col)
                this.emit('clear-eol');
                break;
            }
            case UI.CLEAR_ALL: {
                this.screen.clearAll(this.cursor.line)
                this.emit('clear-all');
                this.cursor = {
                    line: 0,
                    col: 0,
                };
                this.emit('cursor');
                break;
            }
            case UI.SCROLL_SCREEN: {
                this.screen.scroll(this.scrollRegion, action.count)
                this.emit('screen-scrolled', action.count);
                break;
            }
            case UI.SET_SCROLL_REGION: {
                this.scrollRegion = action.region;
                this.emit('scroll-region-updated');
                break;
            }
            case UI.RESIZE: {
                if (this.resize(action.lines, action.cols)) {
                    this.emit('resize', action.lines, action.cols);
                }
                break;
            }
            case UI.UPDATE_FG: {
                this.foregroundColor = colorToString(action.color, this.fontAttributes.fg);
                this.emit('update-fg');
                console.log('Foreground color is updated: ', this.foregroundColor);
                break;
            }
            case UI.UPDATE_BG: {
                this.backgroundColor = colorToString(action.color, this.fontAttributes.bg);
                this.emit('update-bg');
                console.log('Background color is updated: ', this.backgroundColor);
                break;
            }
            case UI.UPDATE_SP: {
                this.specialColor = colorToString(action.color, this.foregroundColor);
                this.emit('update-sp-color');
                console.log('Special color is updated: ', this.specialColor);
                break;
            }
            case UI.MODE_INFO: {
                this.modeInfo = action.modeInfo;
                this.emit('mode-info', this.modeInfo);
                break;
            }
            case UI.MODE: {
                this.mode = action.mode;
                this.emit('mode', this.mode);
                break;
            }
            case UI.BUSY_START: {
                this.busy = true;
                this.emit('busy');
                break;
            }
            case UI.BUSY_STOP: {
                this.busy = false;
                this.emit('busy');
                break;
            }
            case UI.UPDATE_FONT_SIZE: {
                this.fontAttributes.draw_width = action.draw_width;
                this.fontAttributes.draw_height = action.draw_height;
                this.fontAttributes.width = action.width;
                this.fontAttributes.height = action.height;
                console.log('Actual font size is updated: ', action.width, action.height);
                this.emit('font-size-changed');
                break;
            }
            case UI.UPDATE_FONT_PX: {
                this.fontSize = action.fontSize;
                this.emit('font-size-specified');
                break;
            }
            case UI.UPDATE_FONT_FAMILY: {
                this.fontFamily = action.fontFamily;
                this.emit('font-family-specified');
                break;
            }
            case UI.UPDATE_SCREEN_SIZE: {
                if (this.size.width === action.width && this.size.height === action.height) {
                    break;
                }
                this.size.width = action.width;
                this.size.height = action.height;
                this.emit('update-screen-size');
                console.log('Screen size is updated: ', action.width, action.height);
                break;
            }
            case UI.UPDATE_SCREEN_BOUNDS: {
                if (this.resize(action.lines, action.cols)) {
                    this.emit('update-screen-bounds');
                }
                break;
            }
            case UI.ENABLE_MOUSE: {
                if (!this.mouse_enabled) {
                    this.mouse_enabled = true;
                    this.emit('mouse-enabled');
                    console.log('Mouse enabled.');
                }
                break;
            }
            case UI.DISABLE_MOUSE: {
                if (this.mouse_enabled) {
                    this.mouse_enabled = false;
                    this.emit('mouse-disabled');
                    console.log('Mouse disabled.');
                }
                break;
            }
            case UI.DRAG_START: {
                if (this.mouse_enabled) {
                    this.dragging = new ScreenDrag(this);
                    this.emit('input', this.dragging.start(action.event));
                    this.emit('drag-started');
                } else {
                    console.log('Click ignored because mouse is disabled.');
                }
                break;
            }
            case UI.DRAG_UPDATE: {
                if (this.mouse_enabled && this.dragging !== null) {
                    const input = this.dragging.drag(action.event);
                    if (input) {
                        this.emit('input', input);
                        this.emit('drag-updated');
                    }
                }
                break;
            }
            case UI.DRAG_END: {
                if (this.mouse_enabled && this.dragging !== null) {
                    this.emit('input', this.dragging.end(action.event));
                    this.emit('drag-ended');
                    this.dragging = null;
                }
                break;
            }
            case UI.WHEEL_SCROLL: {
                if (this.mouse_enabled) {
                    const input = this.wheel_scrolling.handleEvent(action.event);
                    if (input) {
                        this.emit('input', input);
                        this.emit('wheel-scrolled');
                    }
                }
                break;
            }
            case UI.BELL: {
                this.emit(action.visual ? 'visual-bell' : 'beep');
                break;
            }
            case UI.SET_TITLE: {
                this.title = action.title;
                this.emit('title-changed');
                console.log('Title is set to ', this.title);
                break;
            }
            case UI.SET_ICON: {
                this.icon_path = action.icon_path;
                this.emit('icon-changed');
                console.log('Icon is set to ', this.icon_path);
                break;
            }
            case UI.FLUSH: {
                this.emit('flush');
                break;
            }

            case UI.UPDATE_LINE_HEIGHT: {
                if (this.lineHeight !== action.lineHeight) {
                    this.lineHeight = action.lineHeight;
                    this.emit('line-height-changed');
                    console.log('Line height is changed to ', this.lineHeight);
                }
                break;
            }
            case UI.COMPOSITION_START: {
                this.emit('composition-started');
                break;
            }
            case UI.COMPOSITION_END: {
                this.emit('composition-ended');
                break;
            }

            case COMMAND.FILE_FINDER.OPEN: {
                this.finder.open = true
                this.emit(COMMAND.FILE_FINDER.OPEN)
                break
            }
            case COMMAND.FILE_FINDER.CLOSE: {
                this.finder.open = false
                this.emit(COMMAND.FILE_FINDER.CLOSE)
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

