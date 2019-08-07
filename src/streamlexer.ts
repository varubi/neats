import { Lexer, Token, LexerState, TokenValue } from "./common/types";

export class StreamLexer implements Lexer {
    private buffer: string = "";
    private index: number = 0;
    private line: number = 1;
    private lastLineBreak: number = 0;

    constructor() { }

    reset(data: string, state?: LexerState) {
        this.buffer = data;
        this.index = 0;
        this.line = state ? state.line : 1;
        this.lastLineBreak = state ? -state.col : 0;
    }

    next(): TokenValue | undefined {
        if (this.index < this.buffer.length) {
            var ch = this.buffer[this.index++];
            if (ch === '\n') {
                this.line += 1;
                this.lastLineBreak = this.index;
            }
            return { value: ch };
        }
    }

    save(): { line: number, col: number } {
        return {
            line: this.line,
            col: this.index - this.lastLineBreak,
        }
    }

    formatError(_token: Token, message: string): string {
        // nb. this gets called after consuming the offending token,
        // so the culprit is index-1
        var buffer = this.buffer;
        if (typeof buffer === 'string') {
            var nextLineBreak = buffer.indexOf('\n', this.index);
            if (nextLineBreak === -1) nextLineBreak = buffer.length;
            var line = buffer.substring(this.lastLineBreak, nextLineBreak)
            var col = this.index - this.lastLineBreak;
            message += " at line " + this.line + " col " + col + ":\n\n";
            message += "  " + line + "\n"
            message += "  " + Array(col).join(" ") + "^"
            return message;
        } else {
            return message + " at index " + (this.index - 1);
        }
    }
}
