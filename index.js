/*
 * index.js
 */

const Application = require('./Application.js')

const app = new Application()
app.start('nvim', ['-u', 'NORC'], 20, 50)
