/*
 * theme.js
 */

const Color = require('color')
const { darken, lighten, toHex } = require('../helpers/color')

const store = require('../store')

module.exports = generateTheme

const cssForTheme = colors => `

  headerbar {
    background-color: ${colors.backgroundWidget};
    background-image: linear-gradient(to top, ${darken(colors.backgroundWidget, 0.1)} 2px, ${colors.backgroundWidget});
  }

  window  {
    background-color: ${colors.background};
  }

  entry {
    background-color: ${colors.backgroundWidget};
  }

  list.completion_list {
    background-color: ${colors.backgroundPmenu};
    box-shadow: 2px 6px 6px -3px rgba(0, 0, 0, 0.5);
  } 
`

function generateTheme() {
  const foreground = toHex(store.hlAttributes.default.foreground)
  const background = toHex(store.hlAttributes.default.background)
  const backgroundWidget = darken(background, 0.1)
  const backgroundPmenu = toHex(store.hlGroups.get('Pmenu').background)

  return cssForTheme({
    foreground,
    background,
    backgroundWidget,
    backgroundPmenu,
  })
}
