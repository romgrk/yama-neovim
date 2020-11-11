/*
 * color.js
 */

const Color = require('color')
const colornames = require('colornames')

const darken  = (c, n) => Color(c).darken(n).hex()
const lighten = (c, n) => Color(c).lighten(n).hex()

module.exports = {
  darken,
  lighten,
  toHex,
}

function toHex(color) {
  if (typeof color === 'number')
    return '#' + color.toString(16).padStart(6, '0')
  if (color.charAt(0) === '#')
    return color
  return colornames(color)
}

function gdkColorToHex(color) {
  return (
    '#'
    + (color.red   * 255).toFixed(0).toString(16)
    + (color.green * 255).toFixed(0).toString(16)
    + (color.blue  * 255).toFixed(0).toString(16)
  )
}

