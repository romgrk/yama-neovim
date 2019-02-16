/* export interface HighlightSet {
 *     background?: number;
 *     bg?: string;
 *     bold?: boolean;
 *     fg?: string;
 *     foreground?: number;
 *     italic?: boolean;
 *     reverse?: boolean;
 *     special?: number;
 *     undercurl?: boolean;
 *     underline?: boolean;
 * } */

/* export interface ModeInfoSet {
 *     [key: string]: MODE_INFO;
 * } */

/* export interface MODE_INFO {
 *     blinkoff?: number;
 *     blinkon?: number;
 *     blinkwait?: number;
 *     cell_percentage?: number;
 *     cursor_shape?: string;
 *     hl_id?: number;
 *     id_lm?: number;
 *     mouse_shape: number;
 *     name: string;
 *     short_name: string;
 * } */

/* export interface Region {
 *     top: number;
 *     left: number;
 *     right: number;
 *     bottom: number;
 * } */

const BELL                     = exports.BELL                     = 'UI.BELL'
const BUSY_START               = exports.BUSY_START               = 'UI.BUSY_START'
const BUSY_STOP                = exports.BUSY_STOP                = 'UI.BUSY_STOP'
const CHANGE_CURSOR_DRAW_DELAY = exports.CHANGE_CURSOR_DRAW_DELAY = 'UI.CHANGE_CURSOR_DRAW_DELAY'
const CLEAR_ALL                = exports.CLEAR_ALL                = 'UI.CLEAR_ALL'
const CLEAR_EOL                = exports.CLEAR_EOL                = 'UI.CLEAR_EOL'
const COMPOSITION_START        = exports.COMPOSITION_START        = 'UI.COMPOSITION_START'
const COMPOSITION_END          = exports.COMPOSITION_END          = 'UI.COMPOSITION_END'
const CURSOR                   = exports.CURSOR                   = 'UI.CURSOR'
const DISABLE_MOUSE            = exports.DISABLE_MOUSE            = 'UI.DISABLE_MOUSE'
const DRAG_END                 = exports.DRAG_END                 = 'UI.DRAG_END'
const DRAG_START               = exports.DRAG_START               = 'UI.DRAG_START'
const DRAG_UPDATE              = exports.DRAG_UPDATE              = 'UI.DRAG_UPDATE'
const ENABLE_MOUSE             = exports.ENABLE_MOUSE             = 'UI.ENABLE_MOUSE'
const HIGHLIGHT                = exports.HIGHLIGHT                = 'UI.HIGHLIGHT'
const INPUT                    = exports.INPUT                    = 'UI.INPUT'
const MODE                     = exports.MODE                     = 'UI.MODE'
const MODE_INFO                = exports.MODE_INFO                = 'UI.MODE_INFO'
const PUT_TEXT                 = exports.PUT_TEXT                 = 'UI.PUT_TEXT'
const RESIZE                   = exports.RESIZE                   = 'UI.RESIZE'
const SCROLL_SCREEN            = exports.SCROLL_SCREEN            = 'UI.SCROLL_SCREEN'
const SET_ICON                 = exports.SET_ICON                 = 'UI.SET_ICON'
const SET_SCROLL_REGION        = exports.SET_SCROLL_REGION        = 'UI.SET_SCROLL_REGION'
const SET_TITLE                = exports.SET_TITLE                = 'UI.SET_TITLE'
const START_BLINK_CURSOR       = exports.START_BLINK_CURSOR       = 'UI.START_BLINK_CURSOR'
const STOP_BLINK_CURSOR        = exports.STOP_BLINK_CURSOR        = 'UI.STOP_BLINK_CURSOR'
const UPDATE_BG                = exports.UPDATE_BG                = 'UI.UPDATE_BG'
const UPDATE_FG                = exports.UPDATE_FG                = 'UI.UPDATE_FG'
const UPDATE_SP                = exports.UPDATE_SP                = 'UI.UPDATE_SP'
const UPDATE_FONT_FAMILY       = exports.UPDATE_FONT_FAMILY       = 'UI.UPDATE_FONT_FAMILY'
const UPDATE_FONT_SIZE         = exports.UPDATE_FONT_SIZE         = 'UI.UPDATE_FONT_SIZE'
const UPDATE_LINE_HEIGHT       = exports.UPDATE_LINE_HEIGHT       = 'UI.UPDATE_LINE_HEIGHT'
const UPDATE_SCREEN_BOUNDS     = exports.UPDATE_SCREEN_BOUNDS     = 'UI.UPDATE_SCREEN_BOUNDS'
const UPDATE_SCREEN_SIZE       = exports.UPDATE_SCREEN_SIZE       = 'UI.UPDATE_SCREEN_SIZE'
const WHEEL_SCROLL             = exports.WHEEL_SCROLL             = 'UI.WHEEL_SCROLL'
const FOCUS_CHANGED            = exports.FOCUS_CHANGED            = 'UI.FOCUS_CHANGED'
const FLUSH                    = exports.FLUSH                    = 'UI.FLUSH'


exports.putText = function putText(text) {
    return {
        type: PUT_TEXT,
        text,
    };
}

exports.cursor = function cursor(line, col) {
    return {
        type: CURSOR,
        line,
        col,
    };
}

exports.highlight = function highlight(hl) {
    return {
        type: HIGHLIGHT,
        highlight: hl,
    };
}

exports.clearAll = function clearAll() {
    return {
        type: CLEAR_ALL,
    };
}

exports.clearEndOfLine = function clearEndOfLine() {
    return {
        type: CLEAR_EOL,
    };
}

exports.compositionStart = function compositionStart() {
    return {
        type: COMPOSITION_START,
    };
}

exports.compositionEnd = function compositionEnd() {
    return {
        type: COMPOSITION_END,
    };
}

exports.resize = function resize(lines, cols) {
    return {
        type: RESIZE,
        lines,
        cols,
    };
}

exports.updateForeground = function updateForeground(color) {
    return {
        type: UPDATE_FG,
        color,
    };
}

exports.updateBackground = function updateBackground(color) {
    return {
        type: UPDATE_BG,
        color,
    };
}

exports.updateSpecialColor = function updateSpecialColor(color) {
    return {
        type: UPDATE_SP,
        color,
    };
}

exports.modeInfo = function modeInfo(info) {
    return {
        type: MODE_INFO,
        modeInfo: info,
    };
}

exports.changeMode = function changeMode(MODE) {
    return {
        type: MODE,
        MODE,
    };
}

exports.startBusy = function startBusy() {
    return {
        type: BUSY_START,
    };
}

exports.stopBusy = function stopBusy() {
    return {
        type: BUSY_STOP,
    };
}

exports.inputToNeovim = function inputToNeovim(INPUT) {
    return {
        type: INPUT,
        input,
    };
}

exports.updateFontSize = function updateFontSize(fontSize) {
    return {
        type: UPDATE_FONT_SIZE,
        fontSize,
    };
}

exports.updateFontFamily = function updateFontFamily(fontFamily) {
    return {
        type: UPDATE_FONT_FAMILY,
        fontFamily,
    };
}

exports.updateScreenSize = function updateScreenSize(width, height) {
    return {
        type: UPDATE_SCREEN_SIZE,
        width,
        height,
    };
}

// Note:
// This function has the same effect as RESIZE() but RESIZE() is used
// for neovim's UI event and this function is used to change screen bounds
// via NeovimScreen's API.
exports.updateScreenBounds = function updateScreenBounds(lines, cols) {
    return {
        type: UPDATE_SCREEN_BOUNDS,
        lines,
        cols,
    };
}

exports.enableMouse = function enableMouse() {
    return {
        type: ENABLE_MOUSE,
    };
}

exports.disableMouse = function disableMouse() {
    return {
        type: DISABLE_MOUSE,
    };
}

exports.dragStart = function dragStart(event) {
    return {
        type: DRAG_START,
        event,
    };
}

exports.dragUpdate = function dragUpdate(event) {
    return {
        type: DRAG_UPDATE,
        event,
    };
}

exports.dragEnd = function dragEnd(event) {
    return {
        type: DRAG_END,
        event,
    };
}

exports.bell = function bell(visual) {
    return {
        type: BELL,
        visual,
    };
}

exports.setTitle = function setTitle(title) {
    return {
        type: SET_TITLE,
        title,
    };
}

exports.setIcon = function setIcon(icon_path) {
    return {
        type: SET_ICON,
        icon_path,
    };
}

exports.wheelScroll = function wheelScroll(event) {
    return {
        type: WHEEL_SCROLL,
        event,
    };
}

exports.scrollScreen = function scrollScreen(count) {
    return {
        type: SCROLL_SCREEN,
        count,
    };
}

exports.setScrollRegion = function setScrollRegion(region) {
    return {
        type: SET_SCROLL_REGION,
        region,
    };
}

exports.notifyFocusChanged = function notifyFocusChanged(focused) {
    return {
        type: FOCUS_CHANGED,
        focused,
    };
}

exports.flush = function flush() {
    return {
        type: FLUSH,
    };
}

exports.updateLineHeight = function updateLineHeight(line_height) {
    return {
        type: UPDATE_LINE_HEIGHT,
        line_height,
    };
}

exports.changeCursorDrawDelay = function changeCursorDrawDelay(delay) {
    return {
        type: CHANGE_CURSOR_DRAW_DELAY,
        delay,
    };
}
