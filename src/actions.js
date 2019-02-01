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
 *     [key: string]: ModeInfo;
 * } */

/* export interface ModeInfo {
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

const Kind = exports.Kind = {
    Bell: 'Bell',
    BusyStart: 'BusyStart',
    BusyStop: 'BusyStop',
    ChangeCursorDrawDelay: 'ChangeCursorDrawDelay',
    ClearAll: 'ClearAll',
    ClearEOL: 'ClearEOL',
    CompositionStart: 'CompositionStart',
    CompositionEnd: 'CompositionEnd',
    Cursor: 'Cursor',
    DisableMouse: 'DisableMouse',
    DisableAltKey: 'DisableAltKey',
    DisableMetaKey: 'DisableMetaKey',
    DragEnd: 'DragEnd',
    DragStart: 'DragStart',
    DragUpdate: 'DragUpdate',
    EnableMouse: 'EnableMouse',
    Highlight: 'Highlight',
    Input: 'Input',
    Mode: 'Mode',
    ModeInfo: 'ModeInfo',
    PutText: 'PutText',
    Resize: 'Resize',
    ScrollScreen: 'ScrollScreen',
    SetIcon: 'SetIcon',
    SetScrollRegion: 'SetScrollRegion',
    SetTitle: 'SetTitle',
    StartBlinkCursor: 'StartBlinkCursor',
    StopBlinkCursor: 'StopBlinkCursor',
    UpdateBG: 'UpdateBG',
    UpdateFG: 'UpdateFG',
    UpdateSP: 'UpdateSP',
    UpdateFontFace: 'UpdateFontFace',
    UpdateFontPx: 'UpdateFontPx',
    UpdateFontSize: 'UpdateFontSize',
    UpdateLineHeight: 'UpdateLineHeight',
    UpdateScreenBounds: 'UpdateScreenBounds',
    UpdateScreenSize: 'UpdateScreenSize',
    WheelScroll: 'WheelScroll',
    FocusChanged: 'FocusChanged',
    Flush: 'Flush',
}

/* export interface ActionType {
 *     type: Kind;
 *     col?: number;
 *     color?: number;
 *     cols?: number;
 *     delay?: number;
 *     disabled?: boolean;
 *     draw_width?: number;
 *     draw_height?: number;
 *     event?: MouseEvent | WheelEvent;
 *     focused?: boolean;
 *     font_face?: string;
 *     font_px?: number;
 *     height?: number;
 *     highlight?: HighlightSet;
 *     icon_path?: string;
 *     input?: string;
 *     line?: number;
 *     line_height?: number;
 *     lines?: number;
 *     modeInfo?: ModeInfoSet;
 *     mode?: string;
 *     region?: Region;
 *     text?: string[][];
 *     title?: string;
 *     visual?: boolean;
 *     width?: number;
 * } */

exports.putText = function putText(text) {
    return {
        type: Kind.PutText,
        text,
    };
}

exports.cursor = function cursor(line, col) {
    return {
        type: Kind.Cursor,
        line,
        col,
    };
}

exports.highlight = function highlight(hl) {
    return {
        type: Kind.Highlight,
        highlight: hl,
    };
}

exports.clearAll = function clearAll() {
    return {
        type: Kind.ClearAll,
    };
}

exports.clearEndOfLine = function clearEndOfLine() {
    return {
        type: Kind.ClearEOL,
    };
}

exports.compositionStart = function compositionStart() {
    return {
        type: Kind.CompositionStart,
    };
}

exports.compositionEnd = function compositionEnd() {
    return {
        type: Kind.CompositionEnd,
    };
}

exports.resize = function resize(lines, cols) {
    return {
        type: Kind.Resize,
        lines,
        cols,
    };
}

exports.updateForeground = function updateForeground(color) {
    return {
        type: Kind.UpdateFG,
        color,
    };
}

exports.updateBackground = function updateBackground(color) {
    return {
        type: Kind.UpdateBG,
        color,
    };
}

exports.updateSpecialColor = function updateSpecialColor(color) {
    return {
        type: Kind.UpdateSP,
        color,
    };
}

exports.modeInfo = function modeInfo(info) {
    return {
        type: Kind.ModeInfo,
        modeInfo: info,
    };
}

exports.changeMode = function changeMode(mode) {
    return {
        type: Kind.Mode,
        mode,
    };
}

exports.startBusy = function startBusy() {
    return {
        type: Kind.BusyStart,
    };
}

exports.stopBusy = function stopBusy() {
    return {
        type: Kind.BusyStop,
    };
}

exports.updateFontSize = function updateFontSize(draw_width, draw_height, width, height) {
    return {
        type: Kind.UpdateFontSize,
        draw_width,
        draw_height,
        width,
        height,
    };
}

exports.inputToNeovim = function inputToNeovim(input) {
    return {
        type: Kind.Input,
        input,
    };
}

exports.updateFontPx = function updateFontPx(font_px) {
    return {
        type: Kind.UpdateFontPx,
        font_px,
    };
}

exports.updateFontFace = function updateFontFace(font_face) {
    return {
        type: Kind.UpdateFontFace,
        font_face,
    };
}

exports.updateScreenSize = function updateScreenSize(width, height) {
    return {
        type: Kind.UpdateScreenSize,
        width,
        height,
    };
}

// Note:
// This function has the same effect as resize() but resize() is used
// for neovim's UI event and this function is used to change screen bounds
// via NeovimScreen's API.
exports.updateScreenBounds = function updateScreenBounds(lines, cols) {
    return {
        type: Kind.UpdateScreenBounds,
        lines,
        cols,
    };
}

exports.enableMouse = function enableMouse() {
    return {
        type: Kind.EnableMouse,
    };
}

exports.disableMouse = function disableMouse() {
    return {
        type: Kind.DisableMouse,
    };
}

exports.dragStart = function dragStart(event) {
    return {
        type: Kind.DragStart,
        event,
    };
}

exports.dragUpdate = function dragUpdate(event) {
    return {
        type: Kind.DragUpdate,
        event,
    };
}

exports.dragEnd = function dragEnd(event) {
    return {
        type: Kind.DragEnd,
        event,
    };
}

exports.bell = function bell(visual) {
    return {
        type: Kind.Bell,
        visual,
    };
}

exports.setTitle = function setTitle(title) {
    return {
        type: Kind.SetTitle,
        title,
    };
}

exports.setIcon = function setIcon(icon_path) {
    return {
        type: Kind.SetIcon,
        icon_path,
    };
}

exports.wheelScroll = function wheelScroll(event) {
    return {
        type: Kind.WheelScroll,
        event,
    };
}

exports.scrollScreen = function scrollScreen(count) {
    return {
        type: Kind.ScrollScreen,
        count,
    };
}

exports.setScrollRegion = function setScrollRegion(region) {
    return {
        type: Kind.SetScrollRegion,
        region,
    };
}

exports.notifyFocusChanged = function notifyFocusChanged(focused) {
    return {
        type: Kind.FocusChanged,
        focused,
    };
}

exports.flush = function flush() {
    return {
        type: Kind.Flush,
    };
}

exports.updateLineHeight = function updateLineHeight(line_height) {
    return {
        type: Kind.UpdateLineHeight,
        line_height,
    };
}

exports.disableAltKey = function disableAltKey(disabled) {
    return {
        type: Kind.DisableAltKey,
        disabled,
    };
}

exports.disableMetaKey = function disableMetaKey(disabled) {
    return {
        type: Kind.DisableMetaKey,
        disabled,
    };
}

exports.changeCursorDrawDelay = function changeCursorDrawDelay(delay) {
    return {
        type: Kind.ChangeCursorDrawDelay,
        delay,
    };
}
