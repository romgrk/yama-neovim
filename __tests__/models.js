/*
 * models.js
 */
/* global describe, test, it, expect */

const { Token, Line } = require('../models.js')

describe('Line', () => {

    test('.getText()', () => {
        const line = new Line(60, [ { text: 'aaaa' }, { text: 'bbbb' }, { text: 'cccc' }, { text: 'dddd' } ])
        const text = line.getText()
        expect(text).toBe('aaaabbbbccccdddd                                            ')
    })

    describe('.insert(position, token)', () => {
        test('at tokens end', () => {
            const line = new Line(80, [ { text: 'aaaa' } ])
            const token = { text: 'bbbb' }
            line.insert(4, token)

            expect(line.tokens).toEqual([
                { text: 'aaaa' },
                { text: 'bbbb' },
            ])
        })

        test('after tokens end', () => {
            const line = new Line(80, [ { text: 'aaaa' } ])
            const token = { text: 'bbbb' }
            line.insert(8, token)

            expect(line.tokens).toEqual([
                { text: 'aaaa' },
                { text: '    ', attr: null },
                { text: 'bbbb' },
            ])
        })

        test('inside start token boundary', () => {
            const line = new Line(80, [
                { text: 'aaaa' },
                { text: 'bbbb' },
                { text: 'cccc' },
            ])
            const token = { text: '112222' }
            line.insert(2, token)

            expect(line.tokens).toEqual([
                { text: 'aa' },
                { text: '112222' },
                { text: 'cccc' },
            ])
        })

        test('inside end token boundary', () => {
            const line = new Line(80, [
                { text: 'aaaa' },
                { text: 'bbbb' },
                { text: 'cccc' },
            ])
            const token = { text: '111122' }
            line.insert(4, token)

            expect(line.tokens).toEqual([
                { text: 'aaaa' },
                { text: '111122' },
                { text: 'cc' },
            ])
        })

        test('inside start-end tokens boundary', () => {
            const line = new Line(80, [
                { text: 'aaaa' },
                { text: 'bbbb' },
                { text: 'cccc' },
                { text: 'dddd' }
            ])
            const token = { text: '11222233' }
            line.insert(6, token)

            expect(line.tokens).toEqual([
                { text: 'aaaa' },
                { text: 'bb' },
                { text: '11222233' },
                { text: 'dd' },
            ])
        })

        test('inside same start-end token boundary', () => {
            const line = new Line(80, [
                { text: 'aaaa' },
                { text: 'bbbb' },
                { text: 'cccc' },
            ])
            const token = { text: '11' }
            line.insert(5, token)

            expect(line.tokens).toEqual([
                { text: 'aaaa' },
                { text: 'b' },
                { text: '11' },
                { text: 'b' },
                { text: 'cccc' },
            ])
        })

        test('at start and after token list end', () => {
            const line = new Line(80, [
                { text: 'aaaa' },
            ])
            const token = { text: '111111' }
            line.insert(0, token)

            expect(line.tokens).toEqual([
                { text: '111111' }
            ])
        })

    })

    describe('.setLength(length)', () => {
        test('with larger than current', () => {
            const line = new Line(8, [
                { text: 'aaaa' },
                { text: 'bbbb' },
            ])
            line.setLength(10)

            expect(line.tokens).toEqual([
                { text: 'aaaa' },
                { text: 'bbbb' },
            ])
        })

        test('with smaller than current', () => {
            const line = new Line(8, [
                { text: 'aaaa' },
                { text: 'bbbb' },
            ])
            line.setLength(6)

            expect(line.tokens).toEqual([
                { text: 'aaaa' },
                { text: 'bb' },
            ])
        })

        test('with equal to current', () => {
            const line = new Line(8, [
                { text: 'aaaa' },
                { text: 'bbbb' },
            ])
            line.setLength(8)

            expect(line.tokens).toEqual([
                { text: 'aaaa' },
                { text: 'bbbb' },
            ])
        })
    })

})
