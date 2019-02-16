/*
 * command.js
 */

const createAction = require('../helpers/create-action.js')


const FILE_FINDER = exports.FILE_FINDER = {
  VISIBILITY:  'VISIBILITY',
  OPEN:  'OPEN',
  CLOSE: 'CLOSE',
}

exports.fileFinderOpen  = createAction(FILE_FINDER.OPEN)
exports.fileFinderClose = createAction(FILE_FINDER.CLOSE)
