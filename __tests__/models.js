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

    describe('.slice(start, end)', () => {
        test('empty line', () => {
            const line = new Line(80, [])
            const tokens = line.slice(10, 20)

            expect(line.tokens).toEqual([
                { text: '          ', attr: null },
            ])
        })

        test('non-empty line', () => {
            const line = new Line(80, [ { text: 'a'.repeat(20) } ])
            const tokens = line.slice(10, 30)

            expect(tokens).toEqual([
                { text: 'a'.repeat(10) },
                { text: ' '.repeat(10), attr: null },
            ])
        })

        test('inside tokens', () => {
            const line = new Line(80, [
                { text: 'first_token' },
                { text: 'second_token' },
            ])
            const tokens = line.slice(6, 17)

            expect(tokens).toEqual([
                { text: 'token' },
                { text: 'second' }
            ])
        })
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

        test('regression: insert at token start', () => {
            const line = new Line(50, [
                { text: ':', attr: { fg: 'white' } },
                { text: 'l', attr: { fg: 'white' } },
                { text: 's', attr: { fg: 'white' } },
                { text: '                                     ', attr: { fg: 'white' } }
            ])

            const token = {
                text: '1 %a   "[No Name]"                    line 1',
                attr: { fg: 'white' }
            }
            line.insert(0, token)

            expect(line.tokens).toEqual([
                { text: '1 %a   "[No Name]"                    line 1', attr: { fg: 'white' } }
            ])
        })
    })

    describe('.insertTokens(position, tokens)', () => {
        test('inside line', () => {
            const line = new Line(80, [
                { text: 'a'.repeat(80) }
            ])
            const tokens = [
                { text: 'bbbb' },
                { text: 'cccc' },
            ]
            line.insertTokens(10, tokens)

            expect(line.tokens).toEqual([
                { text: 'aaaaaaaaaa' },
                { text: 'bbbb' },
                { text: 'cccc' },
                { text: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' },
            ])
        })

        test('replace line', () => {
            const line = new Line(50, [
                { text: ':' },
                { text: 'l' },
                { text: 's' },
                { text: ' '.repeat(47) },
            ])
            const tokens = [
                { text: 'b'.repeat(50) },
            ]
            line.insertTokens(0, tokens)

            expect(line.tokens).toEqual([
                { text: 'b'.repeat(50) },
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
