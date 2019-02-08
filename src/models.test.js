/*
 * models.js
 */
/* global describe, test, it, expect */

const { Token, Line } = require('./models.js')

describe('Line', () => {

    test('.getText()', () => {
        const line = new Line(60, [ { text: 'aaaa' }, { text: 'bbbb' }, { text: 'cccc' }, { text: 'dddd' } ])
        const text = line.getText()
        expect(text).toBe('aaaabbbbccccdddd                                            ')
    })

    describe('.slice(start, end)', () => {
        test('inside token', () => {
            const line = new Line(30, [{ text: '012345678901234567890123456789', attr: null }])
            const tokens = line.slice(5, 15)

            expect(tokens).toEqual([
                { text: '567890123456789', attr: null },
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

        test('at token end', () => {
            const line = new Line(20, [ { text: 'a'.repeat(20), attr: null } ])
            const tokens = line.slice(10, 20)

            expect(tokens).toEqual([
                { text: 'a'.repeat(10), attr: null },
            ])
        })

        test('at token start', () => {
            const line = new Line(20, [
                { text: 'a'.repeat(10), attr: null },
                { text: 'b'.repeat(10), attr: null },
            ])
            const tokens = line.slice(10, 15)

            expect(tokens).toEqual([
                { text: 'b'.repeat(5), attr: null },
            ])
        })

    })

    describe('.tokenForCharAt(position)', () => {
        test('inside initial tokens', () => {
            const line = new Line(20, [
                { text: 'aaaa', attr: null },
                { text: '1234', attr: null },
                { text: 'cccc', attr: null },
            ])

            const token = line.tokenForCharAt(5)

            expect(token).toEqual({ text: '2', attr: null })
        })

        test('after initial tokens', () => {
            const line = new Line(20, [
                { text: 'aaaa', attr: null },
                { text: '1234', attr: null },
                { text: 'cccc', attr: null },
            ])

            const token = line.tokenForCharAt(15)

            expect(token).toEqual({ text: ' ', attr: null })
        })
    })

    describe('.insert(position, token)', () => {
        test('at tokens end', () => {
            const line = new Line(20, [ { text: 'aaaa' } ])
            const token = { text: 'bbbb' }
            line.insert(4, token)

            expect(line.tokens).toEqual([
                { text: 'aaaa' },
                { text: 'bbbb' },
                { text: ' '.repeat(12), attr: null },
            ])
        })

        test('after tokens end', () => {
            const line = new Line(20, [ { text: 'aaaaa' } ])
            const token = { text: 'bbbbb' }
            line.insert(10, token)

            expect(line.tokens).toEqual([
                { text: 'aaaaa' },
                { text: '     ', attr: null },
                { text: 'bbbbb' },
                { text: '     ', attr: null },
            ])
        })

        test('inside start token boundary', () => {
            const line = new Line(20, [
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
                { text: ' '.repeat(8), attr: null },
            ])
        })

        test('inside end token boundary', () => {
            const line = new Line(20, [
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
                { text: ' '.repeat(8), attr: null },
            ])
        })

        test('inside start-end tokens boundary', () => {
            const line = new Line(20, [
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
                { text: ' '.repeat(4), attr: null },
            ])
        })

        test('inside same start-end token boundary', () => {
            const line = new Line(20, [
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
                { text: ' '.repeat(8), attr: null },
            ])
        })

        test('at start and after token list end', () => {
            const line = new Line(20, [
                { text: 'aaaa' },
            ])
            const token = { text: '111111' }
            line.insert(0, token)

            expect(line.tokens).toEqual([
                { text: '111111' },
                { text: ' '.repeat(14), attr: null },
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
                { text: '1 %a   "[No Name]"                    line 1', attr: { fg: 'white' } },
                { text: '      ', attr: null }
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
