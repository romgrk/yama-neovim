/*
 * Store.js
 */

const { EventEmitter } = require('events')
const { Dispatcher } = require('flux')
const { Kind } = require('./actions')
// const log = require('../log')
const ScreenDrag = require('./screen-drag')
// const ScreenWheel = require('./screen-wheel')
const { Screen, Line } = require('./models.js')

// TODO:
// Debug log should be implemented subscriber of store
// and be controlled by registering it or not, watching NODE_ENV variable.
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
 *     draw_width: number;
 *     draw_height: number;
 *     width: number;
 *     height: number;
 *     face: string;
 *     specified_px: number;
 * } */

// export type DispatcherType = Dispatcher<ActionType>;

// Note: 0x001203 -> '#001203'
function colorString(new_color, fallback) {
    if (typeof new_color !== 'number' || new_color < 0) {
        return fallback;
    }

    return (
        '#' +
        [16, 8, 0]
            .map(shift => {
                const mask = 0xff << shift;
                const hex = ((new_color & mask) >> shift).toString(16);
                return hex.length < 2 ? '0' + hex : hex;
            })
            .join('')
    );
}


module.exports = class NeovimStore extends EventEmitter {
    /* dispatch_token: string;
     *
     * size: Size;
     * font_attr: FontAttributes;
     * fg_color: string;
     * bg_color: string;
     * sp_color: string;
     * cursor: Cursor;
     * modeInfo: ModeInfoSet;
     * mode: string;
     * busy: boolean;
     * mouse_enabled: boolean;
     * dragging: ScreenDrag;
     * title: string;
     * icon_path: string;
     * wheel_scrolling: ScreenWheel;
     * scroll_region: Region;
     * dispatcher: Dispatcher<ActionType>;
     * focused: boolean;
     * line_height: number;
     * alt_key_disabled: boolean;
     * meta_key_disabled: boolean;
     * cursor_draw_delay: number;
     * blink_cursor: boolean;
     * cursor_blink_interval: number; */

    constructor() {
        super();
        this.dispatcher = new Dispatcher();
        this.size = {
            lines: 0,
            cols: 0,
            width: 0,
            height: 0,
        };
        this.font_attr = {
            fg: 'white',
            bg: 'black',
            sp: null,
            bold: false,
            italic: false,
            underline: false,
            undercurl: false,
            draw_width: 1,
            draw_height: 1,
            width: 1,
            height: 1,
            specified_px: 1,
            face: 'monospace',
        };
        this.cursor = {
            line: 0,
            col: 0,
        };
        this.modeInfo = {};
        this.mode = 'normal';
        this.busy = false;
        this.mouse_enabled = true;
        this.dragging = null;
        this.title = '';
        this.icon_path = '';
        // this.wheel_scrolling = new ScreenWheel(this);
        this.scroll_region = {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
        };
        this.focused = true;
        this.line_height = 1.2;
        this.alt_key_disabled = false;
        this.meta_key_disabled = false;
        this.cursor_draw_delay = 10;
        this.blink_cursor = false;
        this.cursor_blink_interval = 1000;
        this.dispatch_token = this.dispatcher.register(this.receiveAction.bind(this));
        this.screen = new Screen(0, 0)
    }

    receiveAction(action) {
        switch (action.type) {
            case Kind.Input: {
                this.emit('input', action.input);
                break;
            }
            case Kind.PutText: {
                this.screen.put(this.cursor, { text: action.text.join(''), attr: copy(this.font_attr) })
                this.cursor.col = this.cursor.col + action.text.length
                this.emit('put', action.text)
                this.emit('cursor')
                break;
            }
            case Kind.Cursor: {
                this.cursor = {
                    line: action.line,
                    col: action.col,
                };
                this.emit('cursor');
                break;
            }
            case Kind.Highlight: {
                const hl = action.highlight;
                this.font_attr.bold = hl.bold;
                this.font_attr.italic = hl.italic;
                this.font_attr.underline = hl.underline;
                this.font_attr.undercurl = hl.undercurl;
                if (hl.reverse === true) {
                    this.font_attr.fg = colorString(hl.background, this.bg_color);
                    this.font_attr.bg = colorString(hl.foreground, this.fg_color);
                } else {
                    this.font_attr.fg = colorString(hl.foreground, this.fg_color);
                    this.font_attr.bg = colorString(hl.background, this.bg_color);
                }
                this.font_attr.sp = colorString(hl.special, this.sp_color || this.fg_color);
                console.log('Highlight is updated: ', this.font_attr);
                break;
            }
            case Kind.FocusChanged: {
                this.focused = action.focused;
                this.emit('focus-changed');
                console.log('Focus changed: ', this.focused);
                break;
            }
            case Kind.ClearEOL: {
                this.emit('clear-eol');
                break;
            }
            case Kind.ClearAll: {
                this.emit('clear-all');
                this.cursor = {
                    line: 0,
                    col: 0,
                };
                this.emit('cursor');
                break;
            }
            case Kind.ScrollScreen: {
                this.emit('screen-scrolled', action.cols);
                break;
            }
            case Kind.SetScrollRegion: {
                this.scroll_region = action.region;
                console.log('Region is set: ', this.scroll_region);
                this.emit('scroll-region-updated');
                break;
            }
            case Kind.Resize: {
                if (this.resize(action.lines, action.cols)) {
                    this.emit('resize');
                }
                break;
            }
            case Kind.UpdateFG: {
                this.fg_color = colorString(action.color, this.font_attr.fg);
                this.emit('update-fg');
                console.log('Foreground color is updated: ', this.fg_color);
                break;
            }
            case Kind.UpdateBG: {
                this.bg_color = colorString(action.color, this.font_attr.bg);
                this.emit('update-bg');
                console.log('Background color is updated: ', this.bg_color);
                break;
            }
            case Kind.UpdateSP: {
                this.sp_color = colorString(action.color, this.fg_color);
                this.emit('update-sp-color');
                console.log('Special color is updated: ', this.sp_color);
                break;
            }
            case Kind.ModeInfo: {
                this.modeInfo = action.modeInfo;
                this.emit('mode-info', this.modeInfo);
                break;
            }
            case Kind.Mode: {
                this.mode = action.mode;
                this.emit('mode', this.mode);
                break;
            }
            case Kind.BusyStart: {
                this.busy = true;
                this.emit('busy');
                break;
            }
            case Kind.BusyStop: {
                this.busy = false;
                this.emit('busy');
                break;
            }
            case Kind.UpdateFontSize: {
                this.font_attr.draw_width = action.draw_width;
                this.font_attr.draw_height = action.draw_height;
                this.font_attr.width = action.width;
                this.font_attr.height = action.height;
                console.log('Actual font size is updated: ', action.width, action.height);
                this.emit('font-size-changed');
                break;
            }
            case Kind.UpdateFontPx: {
                this.font_attr.specified_px = action.font_px;
                this.emit('font-px-specified');
                break;
            }
            case Kind.UpdateFontFace: {
                this.font_attr.face = action.font_face;
                this.emit('font-face-specified');
                break;
            }
            case Kind.UpdateScreenSize: {
                if (this.size.width === action.width && this.size.height === action.height) {
                    break;
                }
                this.size.width = action.width;
                this.size.height = action.height;
                this.emit('update-screen-size');
                console.log('Screen size is updated: ', action.width, action.height);
                break;
            }
            case Kind.UpdateScreenBounds: {
                if (this.resize(action.lines, action.cols)) {
                    this.emit('update-screen-bounds');
                }
                break;
            }
            case Kind.EnableMouse: {
                if (!this.mouse_enabled) {
                    this.mouse_enabled = true;
                    this.emit('mouse-enabled');
                    console.log('Mouse enabled.');
                }
                break;
            }
            case Kind.DisableMouse: {
                if (this.mouse_enabled) {
                    this.mouse_enabled = false;
                    this.emit('mouse-disabled');
                    console.log('Mouse disabled.');
                }
                break;
            }
            case Kind.DragStart: {
                if (this.mouse_enabled) {
                    this.dragging = new ScreenDrag(this);
                    this.emit('input', this.dragging.start(action.event));
                    this.emit('drag-started');
                } else {
                    console.log('Click ignored because mouse is disabled.');
                }
                break;
            }
            case Kind.DragUpdate: {
                if (this.mouse_enabled && this.dragging !== null) {
                    const input = this.dragging.drag(action.event);
                    if (input) {
                        this.emit('input', input);
                        this.emit('drag-updated');
                    }
                }
                break;
            }
            case Kind.DragEnd: {
                if (this.mouse_enabled && this.dragging !== null) {
                    this.emit('input', this.dragging.end(action.event));
                    this.emit('drag-ended');
                    this.dragging = null;
                }
                break;
            }
            case Kind.WheelScroll: {
                if (this.mouse_enabled) {
                    const input = this.wheel_scrolling.handleEvent(action.event);
                    if (input) {
                        this.emit('input', input);
                        this.emit('wheel-scrolled');
                    }
                }
                break;
            }
            case Kind.Bell: {
                this.emit(action.visual ? 'visual-bell' : 'beep');
                break;
            }
            case Kind.SetTitle: {
                this.title = action.title;
                this.emit('title-changed');
                console.log('Title is set to ', this.title);
                break;
            }
            case Kind.SetIcon: {
                this.icon_path = action.icon_path;
                this.emit('icon-changed');
                console.log('Icon is set to ', this.icon_path);
                break;
            }
            case Kind.UpdateLineHeight: {
                if (this.line_height !== action.line_height) {
                    this.line_height = action.line_height;
                    this.emit('line-height-changed');
                    console.log('Line height is changed to ', this.line_height);
                }
                break;
            }
            case Kind.DisableAltKey: {
                this.alt_key_disabled = action.disabled;
                this.emit('alt-key-disabled');
                console.log('Alt key disabled: ', action.disabled);
                break;
            }
            case Kind.DisableMetaKey: {
                this.meta_key_disabled = action.disabled;
                this.emit('meta-key-disabled');
                console.log('Meta key disabled: ', action.disabled);
                break;
            }
            case Kind.ChangeCursorDrawDelay: {
                this.cursor_draw_delay = action.delay;
                this.emit('cursor-draw-delay-changed');
                console.log(`Drawing cursor is delayed by ${action.delay}ms`);
                break;
            }
            case Kind.StartBlinkCursor: {
                const changed = this.blink_cursor === false;
                this.blink_cursor = true;
                if (changed) {
                    this.emit('blink-cursor-started');
                }
                break;
            }
            case Kind.StopBlinkCursor: {
                const changed = this.blink_cursor === true;
                this.blink_cursor = false;
                if (changed) {
                    this.emit('blink-cursor-stopped');
                }
                break;
            }
            case Kind.CompositionStart: {
                this.emit('composition-started');
                break;
            }
            case Kind.CompositionEnd: {
                this.emit('composition-ended');
                break;
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
        this.scroll_region = {
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
