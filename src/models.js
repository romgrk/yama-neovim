/*
 * models.js
 */

const isEqual = require('lodash.isequal')

class Token {
    constructor(text, attr) {
        this.text = text
        this.attr = attr
    }
}

class Line {
    constructor(length, tokens = []) {
        this.length = length
        this.tokens = tokens
    }

    setLength(length) {
        if (this.length > length) {

            let index
            let charCount = 0

            for (index = 0; index < this.tokens.length; index++) {
                const token = this.tokens[index]
                const tokenLength = token.text.length
                const tokenEnd = charCount + tokenLength - 1

                if (isInRange(length, charCount, tokenEnd)) {
                    if (length > charCount) {
                        const breakPoint = length - charCount
                        const textBefore = token.text.slice(0, breakPoint)
                        const textAfter  = token.text.slice(breakPoint)

                        this.tokens.splice(index, 1,
                            { ...token, text: textBefore },
                            { ...token, text: textAfter })
                        index += 1
                    }
                    this.tokens.splice(index, this.tokens.length - index)
                    break
                }

                charCount += tokenLength
            }
        }
        this.length = length
    }

    getText() {
        const text = this.tokens.map(t => t.text).join('')
        const diff = this.length - text.length
        if (diff > 0)
            return text + ' '.repeat(diff)
        return text
    }

    append(token) {
        this.tokens.push(token)
    }

    slice(start, end) {
        const {startIndex, endIndex} = this._prepareSlice(start, end - start)

        // FIXME(performance: implement this without mutation)
        const result = this.tokens.slice(startIndex, endIndex + 1)
        this._normalize()
        return result
    }

    insert(position, token) {
        const {startIndex, endIndex} = this._prepareSlice(position, token.text.length)
        const deleteCount = (endIndex + 1) - startIndex

        this.tokens.splice(startIndex, deleteCount, token)
    }

    insertTokens(position, tokens) {
        const length = tokens.reduce((length, t) => length + t.text.length, 0)
        const {startIndex, endIndex} = this._prepareSlice(position, length)
        const deleteCount = (endIndex + 1) - startIndex

        this.tokens.splice(startIndex, deleteCount, ...tokens)
    }

    clear(position = 0) {
        if (position === 0) {
            this.tokens.splice(0, this.tokens.length)
            return
        }

        const length = this.length - position
        const {startIndex, endIndex} = this._prepareSlice(position, length)
        const deleteCount = (endIndex + 1) - startIndex

        this.tokens.splice(startIndex, deleteCount)
    }

    _normalize() {
        let i = 0
        while (i < this.tokens.length - 1) {
            const currentToken = this.tokens[i]
            const nextToken    = this.tokens[i + 1]

            if (isEqual(currentToken.attr, nextToken.attr)) {
                const newToken = { text: currentToken.text + nextToken.text, attr: currentToken.attr }
                this.tokens.splice(i, 2, newToken)
                continue
            }

            i += 1
        }
    }

    _prepareSlice(position, length) {
        let index
        let startIndex
        let endIndex
        let currentToken
        let currentTokenEnd = 0
        let charCount = 0

        const positionEnd = position + length
        const positions = []

        // 012345678
        //   |--|
        // aaaabbbbcccc

        for (index = 0; index < this.tokens.length; index++) {
            positions.push(charCount)
            currentToken = this.tokens[index]
            currentTokenEnd = charCount + currentToken.text.length

            const isPastStart = charCount + currentToken.text.length - 1 >= position

            if (isPastStart && startIndex === undefined) {
                startIndex = index
            }

            if (isPastStart && isInRange(positionEnd, charCount, currentTokenEnd)) {
                endIndex = index
                break;
            }

            charCount += currentToken.text.length
        }

        // Insert token at or after the end of current tokens
        //        position
        //            |---->[1111]
        // [aaaa][bbbb]
        if (startIndex === undefined) {
            const diff = position - currentTokenEnd
            if (diff > 0) {
                this.tokens.push({ text: ' '.repeat(diff), attr: null })
            }
            return { startIndex: this.tokens.length, endIndex: this.tokens.length }
        }


        // Insert token over one or more tokens
        //     position         + length
        //         |--------------|
        // [aaaa][bbbbb][ccccc][ddddd]
        const startToken = this.tokens[startIndex]

        if (position > positions[startIndex]) {
            const breakPoint = position - positions[startIndex]
            const textBefore = startToken.text.slice(0, breakPoint)
            const textAfter  = startToken.text.slice(breakPoint)

            positions.splice(startIndex, 1, positions[startIndex], positions[startIndex] + textBefore.length)
            this.tokens.splice(startIndex, 1,
                { ...startToken, text: textBefore },
                { ...startToken, text: textAfter })

            startIndex += 1
            if (endIndex !== undefined)
                endIndex += 1
        }

        if (endIndex === undefined) {
            if (positionEnd >= charCount) {
                const diff = positionEnd - charCount
                if (diff > 0) {
                    this.tokens.push({ text: ' '.repeat(diff), attr: null })
                }
            }
            endIndex = this.tokens.length - 1
        }
        else if (endIndex !== undefined) {
            const endToken = this.tokens[endIndex]
            const endTokenEnd = positions[endIndex] + endToken.text.length

            if (positionEnd < endTokenEnd) {
                const breakPoint = endToken.text.length - (endTokenEnd - positionEnd)
                const textBefore = endToken.text.slice(0, breakPoint)
                const textAfter  = endToken.text.slice(breakPoint)

                positions.splice(endIndex, 1, textBefore.length, textAfter.length)
                this.tokens.splice(endIndex, 1,
                    { ...endToken, text: textBefore },
                    { ...endToken, text: textAfter })
            }
        }

        return { startIndex, endIndex }
    }
}

class Screen extends Array {
    constructor(lines, cols) {
        super()
        this.lines = []
        this.size = { lines, cols }

        for (let i = 0; i < lines; i++) {
            this.lines.push(new Line(cols))
        }
    }

    resize(lines, cols) {
        if (lines < this.size.lines) {
            const index = this.size.lines - lines
            this.lines.splice(index, this.lines.length - index)
        }
        else if (lines > this.size.lines) {
            const diff = lines - this.size.lines
            for (let i = 0; i < diff; i++) {
                this.lines.push(new Line(this.size.cols))
            }
        }

        if (cols !== this.size.cols) {
            this.lines.forEach(line => {
                line.setLength(cols)
            })
        }

        this.size = { lines, cols }
    }

    put(cursor, token) {
        const line = this.lines[cursor.line]
        const tokens = JSON.parse(JSON.stringify(line.tokens))
        line.insert(cursor.col, token)
    }

    scroll(region, count) {
        const top    = region.top
        const bottom = region.bottom + 1
        const left   = region.left
        const right  = region.right + 1
        const horizontalLength = right - left
        const verticalLength = bottom - top

        if (count > 0) {
            const destinationTop = top - count
            const destinationBottom = bottom - count

            for (let i = 0, line = destinationTop; line < destinationBottom; line++, i++) {
                if (line < top)
                    continue
                const sourceIndex = top + i
                const currentLine = this.lines[line]
                const sourceLine = this.lines[sourceIndex]
                const tokens = sourceLine ? sourceLine.slice(left, right) : [{ text: ' '.repeat(horizontalLength) }]
                currentLine.insertTokens(left, tokens)
            }
        }
        else /* if (count < 0) */ {
            const sourceTop = top + count
            const sourceBottom = bottom + count

            for (let i = 0, line = sourceBottom; line >= sourceTop; line--, i++) {
                const destinationIndex = line - count
                if (destinationIndex >= bottom || destinationIndex <= top)
                    continue
                const sourceLine = this.lines[line]
                const destinationLine = this.lines[destinationIndex]
                const tokens = sourceLine ? sourceLine.slice(left, right) : [{ text: ' '.repeat(horizontalLength) }]
                destinationLine.insertTokens(left, tokens)
            }
        }
    }

    clearLine(line, col = 0) {
        this.lines[line].clear(col)
    }

    clearAll() {
        for (let i = 0; i < this.lines.length; i++) {
            this.lines[i].clear()
        }
    }

    getTokenAt(lnum, col) {
        const line = this.lines[lnum]
        return line.slice(col, col + 1)[0]
    }

    getText(cursor) {
        let text = (
            '   ╭' + '─'.repeat(this.size.cols) + '╮\n'
          + this.lines.map((line, i) =>
                String(i).padEnd(2, ' ') + ' │' + line.getText() + '│').join('\n')
          + '\n   ╰' + '─'.repeat(this.size.cols) + '╯\n'
        )
        if (cursor) {
            const index = (cursor.line + 1) * (this.size.cols + 6) + cursor.col + 4
            text = text.slice(0, index) + '█' + text.slice(index + 1)
        }
        return text
    }
}

// Helpers

function isInRange(position, start, end) {
    return position >= start && position <= end
}

module.exports = { Token, Line, Screen }
