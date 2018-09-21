/*
 * models.js
 */


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

    insert(position, token) {
        let index
        let startIndex
        let endIndex
        let currentToken
        let end = 0
        let charCount = 0
        const endPosition = position + token.text.length
        const positions = []

        // 012345678
        //   |--|
        // aaaabbbbcccc

        for (index = 0; index < this.tokens.length; index++) {
            positions.push(charCount)
            currentToken = this.tokens[index]
            end = charCount + currentToken.text.length
            const length = currentToken.text.length
            const isPastStart = charCount + length - 1 >= position

            if (isPastStart && startIndex === undefined) {
                startIndex = index
            }

            if (isPastStart && isInRange(endPosition, charCount, end)) {
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
            const diff = position - end
            if (diff > 0) {
                this.tokens.push({ text: ' '.repeat(diff), attr: null })
            }
            this.tokens.push(token)
            return
        }


        // Insert token over one or more tokens
        //     position         + length
        //         |--------------|
        // [aaaa][bbbbb][ccccc][ddddd]
        const startToken = this.tokens[startIndex]

        if (position > positions[startIndex]) {
            const breakPoint = position - positions[startIndex]
            const textBefore = startToken.text.slice(0, breakPoint)
            const textAfter = startToken.text.slice(breakPoint)

            positions.splice(startIndex, 1, positions[startIndex], positions[startIndex] + textBefore.length)
            this.tokens.splice(startIndex, 1,
                { ...startToken, text: textBefore },
                { ...startToken, text: textAfter })

            startIndex += 1
            if (endIndex !== undefined)
                endIndex += 1
        }

        if (position >= charCount && endIndex === undefined) {
            const diff = position - charCount
            positions.push(charCount)
            this.tokens.push({ text: ' '.repeat(diff), attr: null })
            positions.push(diff)
        }
        else if (endIndex !== undefined) {
            const endToken = this.tokens[endIndex]
            const endTokenEnd = positions[endIndex] + endToken.text.length

            if (endPosition < endTokenEnd) {
                const breakPoint = endToken.text.length - (endTokenEnd - endPosition)
                const textBefore = endToken.text.slice(0, breakPoint)
                const textAfter  = endToken.text.slice(breakPoint)

                positions.splice(endIndex, 1, textBefore.length, textAfter.length)
                this.tokens.splice(endIndex, 1,
                    { ...endToken, text: textBefore },
                    { ...endToken, text: textAfter })
            }
        }

        this.tokens.splice(startIndex, (endIndex || 0) + 1 - startIndex, token)
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
}

class Screen extends Array {
    constructor(lines, cols) {
        super()
        this.lines = lines
        this.cols = cols

        for (let i = 0; i < lines; i++) {
            this.push(new Line(cols))
        }
    }

    resize(lines, cols) {
        if (lines < this.lines) {
            const index = this.lines - lines
            this.splice(index, this.length - index)
        }
        else if (lines > this.lines) {
            const diff = lines - this.lines
            for (let i = 0; i < diff; i++) {
                this.push(new Line(this.cols))
            }
        }

        if (cols !== this.cols) {
            this.forEach(line => {
                line.setLength(cols)
            })
        }

        this.lines = lines
        this.cols = cols
    }

    put(cursor, token) {
        this[cursor.line].insert(cursor.col, token)
    }

    getText(cursor) {
        let text = (
            '╭' + '─'.repeat(this.cols) + '╮\n'
          + this.map(line => '│' + line.getText() + '│').join('\n')
          + '\n╰' + '─'.repeat(this.cols) + '╯\n'
        )
        if (cursor) {
            const index = (cursor.line + 1) * (this.cols + 2) + cursor.col + 2
            text = text.slice(0, index) + '#' + text.slice(index + 1)
        }
        return text
    }
}

// Helpers

function isInRange(position, start, end) {
    return position >= start && position <= end
}

module.exports = { Token, Line, Screen }
