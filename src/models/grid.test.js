/*
 * grid.test.js
 */

const Grid = require('./grid')

describe('Grid', () => {
  it('works', () => {
    const grid = new Grid(10, 4)
    /* console.log(grid.getLine(0))
     * console.log(grid.getLine(1))
     * console.log(grid.getLine(2))
     * console.log(grid.getLine(3)) */
    expect(() => {
      console.log(grid.getLine(4))
    }).toThrow()
  })

  it('.setCells', () => {
    const grid = new Grid(6, 4)
    grid.setCells(0, 2, ['a', 'b', 'c'])
    console.log(grid.getLine(0))
    expect(grid.getLine(0)).toEqual([[], [], 'a', 'b', 'c', []])
  })
})
