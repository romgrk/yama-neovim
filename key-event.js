/*
 * key-event.js
 */

const gi = require('node-gtk')
const Gdk = gi.require('Gdk', '3.0')


module.exports = {
  getVimInput,
  fromGdk,
  shouldFilter,
}


const KEY_TABLE = {
  'slash': '/',
  'question': '?',
  'grave': '`',
  'asciitilde': '~',
  'backslash': '\\',
  'dead_circumflex': '^',
  'exclam': '!',
  'at': '@',
  'numbersign': '#',
  'dollar': '$',
  'percent': '%',
  'asciicircum': '^',
  'ampersand': '&',
  'asterisk': '*',
  'parenleft': '(',
  'parenright': ')',
  'underscore': '_',
  'equal': '=',
  'plus': '+',
  'minus': '-',
  'bracketleft': '[',
  'bracketright': ']',
  'braceleft': '{',
  'braceright': '}',
  'dead_diaeresis': '"',
  'quotedbl': '"',
  'dead_acute': "'",
  'apostrophe': "'",
  'less': 'lt',
  'greater': '>',
  'comma': ',',
  'colon': ':',
  'semicolon': ';',
  'period': '.',
  'BackSpace': 'BS',
  'Return': 'CR',
  'Escape': 'Esc',
  'Delete': 'Del',
  'Page_Up': 'PageUp',
  'Page_Down': 'PageDown',
  'Enter': 'CR',
  'ISO_Left_Tab': 'Tab'
}

function getVimInput(event) {
  const key = KEY_TABLE[event.name] || event.name

  if (key.length === 1 && !hasModifiers(event)) {
      return key
  }

  let vim_input = '<'

  if (event.ctrlKey) {
      vim_input += 'C-'
  }
  if (event.superKey) {
      vim_input += 'D-'
  }
  if (event.altKey) {
      vim_input += 'A-'
  }
  // Note: <lt> is a special case where shift should not be handled.
  if (event.shiftKey && key !== 'lt') {
      vim_input += 'S-'
  }

  vim_input += key + '>'

  return vim_input
}

function hasModifiers(event) {
  return event.ctrlKey || event.altKey || event.superKey
}

function shouldFilter(event) {
  const keyval = event.keyval
  return (
       keyval === Gdk.KEY_Alt_L     || keyval === Gdk.KEY_Alt_R
    || keyval === Gdk.KEY_Control_L || keyval === Gdk.KEY_Control_R
    || keyval === Gdk.KEY_Shift_L   || keyval === Gdk.KEY_Shift_R
    || keyval === Gdk.KEY_Meta_L    || keyval === Gdk.KEY_Meta_R
    || keyval === Gdk.KEY_Super_L   || keyval === Gdk.KEY_Super_R
    || keyval === Gdk.KEY_Hyper_L   || keyval === Gdk.KEY_Hyper_R
    || keyval === Gdk.KEY_Caps_Lock
    || keyval === Gdk.KEY_Num_Lock
  )
}

function fromGdk(event) {
  const result = {
    ctrlKey:  (event.state & Gdk.ModifierType.CONTROL_MASK) !== 0,
    shiftKey: (event.state & Gdk.ModifierType.SHIFT_MASK) !== 0,
    altKey:   (event.state & Gdk.ModifierType.MOD1_MASK) !== 0,
    metaKey:  (event.state & Gdk.ModifierType.META_MASK) !== 0,
    superKey: (event.state & Gdk.ModifierType.SUPER_MASK) !== 0,
    hyperKey: (event.state & Gdk.ModifierType.HYPER_MASK) !== 0,
    name: Gdk.keyvalName(event.keyval),
    keyval: event.keyval,
    string: event.string,
  }

  return result
}
