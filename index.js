/*
 * index.js
 */

const Application = require('./Application.js')
const Window = require('./Window.js')
const KeyEvent = require('./key-event.js')

const window = new Window()

const onUpdate = text => {
  window.setText(text)
}

const app = new Application(onUpdate)


window.on('key-press', (event, original) => {

  const input = KeyEvent.getVimInput(event)

  console.log(input)
  // console.log(event, input)

  if (!KeyEvent.isModifier(event))
    app.client.input(input)
})


app.start('nvim', ['-u', 'NORC'], 20, 50)

window.show()


