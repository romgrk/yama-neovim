/*
 * theme.js
 */

const Color = require('color')
const { darken, lighten, toHex } = require('../helpers/color')

module.exports = generateTheme

const cssForTheme = colors => `
  @define-color fg_color ${colors.foreground};
  @define-color bg_color ${colors.background};

  headerbar {
    background-color: ${colors.backgroundWidget};
    background-image: linear-gradient(to top, ${darken(colors.backgroundWidget, 0.1)} 2px, ${colors.backgroundWidget});
  }


  window  {
    background-color: @bg_color;
  }

  entry {
    background-color: ${colors.backgroundWidget};
  }
`

function generateTheme() {
  const foreground = toHex(this.store.hlAttributes.default.foreground)
  const background = toHex(this.store.hlAttributes.default.background)
  const backgroundWidget = darken(background, 0.1)

  return cssForTheme({
    foreground,
    background,
    backgroundWidget,
  })
}
