/*
 * color.js
 */

const color = require('color')
const colornames = require('colornames')

module.exports = {
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

