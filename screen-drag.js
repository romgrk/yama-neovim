/*
 * screen-drag.js
 */

const MouseButtonKind = ['Left', 'Middle', 'Right'];

module.exports = class ScreenDrag {
    /* line: number;
     * col: number;
     * parentX: number;
     * parentY: number; */

    static buildInputOf(e, type, line, col) {
        let seq = '<';
        if (e.ctrlKey) {
            seq += 'C-';
        }
        if (e.altKey) {
            seq += 'A-';
        }
        if (e.shiftKey) {
            seq += 'S-';
        }
        seq += MouseButtonKind[e.button] + type + '>';
        seq += `<${col},${line}>`;
        return seq;
    }

    constructor(store) {
        this.store = store
        this.line = 0;
        this.col = 0;
        this.parentX = 0;
        this.parentY = 0;
    }

    start(down_event) {
        const wrapper = this.store.dom.container;
        if (wrapper !== null && down_event.target !== null) {
            const rect = down_event.target.getBoundingClientRect();
            this.parentY = rect.top;
            this.parentX = rect.left;
        }
        [this.line, this.col] = this.getPos(down_event);
        console.log('Drag start', down_event, this.line, this.col);
        const input = ScreenDrag.buildInputOf(down_event, 'Mouse', this.line, this.col);
        console.log('Mouse input: ' + input);
        return input;
    }

    drag(move_event) {
        const [line, col] = this.getPos(move_event);
        if (line === this.line && col === this.col) {
            console.log('ignored MouseMove event');
            return null;
        }
        move_event.preventDefault();
        console.log('Drag continue', move_event, line, col);
        const input = ScreenDrag.buildInputOf(move_event, 'Drag', line, col);
        this.line = line;
        this.col = col;
        console.log('Mouse input: ' + input);
        return input;
    }

    end(up_event) {
        up_event.preventDefault();

        [this.line, this.col] = this.getPos(up_event);
        console.log('Drag end', up_event, this.line, this.col);

        const input = ScreenDrag.buildInputOf(up_event, 'Release', this.line, this.col);
        console.log('Mouse input: ' + input);
        return input;
    }

    getPos(e) {
        // Note:
        // e.offsetX and e.offsetY is not available. On mouseup event, the cursor is under the mouse
        // pointer becase mousedown event moves the cursor under mouse pointer. In the case, e.target
        // is a cursor <canvas> element. And offset is calculated based on the cursor element.
        // So we need to have a screen element's position (parentX and parentY) and calculate offsets
        // based on it.
        const offsetY = e.clientY - this.parentY;
        const offsetX = e.clientX - this.parentX;
        return [Math.floor(offsetY / this.store.fontAttributes.height), Math.floor(offsetX / this.store.fontAttributes.width)];
    }
}
