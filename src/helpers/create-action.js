/*
 * create-action.js
 */


module.exports = createAction

function createAction(type, payloadCreator = () => undefined) {
  return (...args) => ({ type, payload: payloadCreator(...args) })
}
