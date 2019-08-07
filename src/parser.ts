import { Column } from "./column";
import { Grammar } from "./grammar";
import { StreamLexer } from "./streamlexer";
import { Lexer, LexerState, CompiledRules, ParserRule, Token, TokenValue } from "./common/types";
import { State, StateData } from "./state";

export class Parser {
    static fail = {};
    lexer: Lexer;
    lexerState?: LexerState;
    table: Column[];
    current: number = 0;
    results?: StateData[];
    options: ParserOptions;

    constructor(private grammar: Grammar & { start: string }, options?: Partial<ParserOptions>) {
        this.options = Object.assign({},
            { keepHistory: false, lexer: grammar.lexer || new StreamLexer },
            options,
        );

        this.lexer = this.options.lexer;
        this.lexerState = undefined;

        const column = new Column(grammar, 0);
        this.table = [column];

        column.wants[grammar.start] = [];
        column.predict(grammar.start);
        column.process();
    }

    static fromCompiled(rules: CompiledRules | ParserRule[], start: string, options: Partial<ParserOptions>) {
        const grammar = Grammar.fromCompiled(rules, start);
        return new Parser(grammar, options);
    }

    feed(chunk: string): this {
        let lexer = this.lexer;
        lexer.reset(chunk, this.lexerState);

        let token: TokenValue | undefined;
        let column: Column | null = null;
        while (token = lexer.next()) {
            column = this.table[this.current];

            if (!this.options.keepHistory) {
                delete this.table[this.current - 1];
            }

            const n = this.current + 1;
            const nextColumn = new Column(this.grammar, n);
            this.table.push(nextColumn);

            // Advance all tokens that expect the symbol
            const literal = "text" in token ? token.text : token.value;
            const value = lexer.constructor === StreamLexer ? token.value : token;
            const scannable = column.scannable;
            for (let w = scannable.length; w--;) {
                const state = scannable[w];
                const expect = state.rule.symbols[state.dot];
                // Try to consume the token
                // either regex or literal
                if (expect.test ? expect.test(value) : expect.type ? expect.type === token.type : expect.literal === literal) {
                    // Add it
                    const next = state.nextState({ data: value, token: token, isToken: true, reference: n - 1 });
                    nextColumn.states.push(next);
                }
            }


            nextColumn.process();

            if (nextColumn.states.length === 0) {
                const err: TokenError = new Error(this.reportError(token));
                err.offset = this.current;
                err.token = token;
                throw err;
            }

            if (this.options.keepHistory)
                column.lexerState = lexer.save()

            this.current++;
        }

        if (column)
            this.lexerState = lexer.save()

        this.results = this.finish();

        return this;
    };

    reportError(token: TokenValue): string {
        var lines: string[] = [];
        const tokenDisplay = (token.type ? token.type + " token: " : "") + JSON.stringify(token.value !== undefined ? token.value : token);
        lines.push(this.lexer.formatError(token, "Syntax error"));
        lines.push('Unexpected ' + tokenDisplay + '. Instead, I was expecting to see one of the following:\n');
        const lastColumnIndex = this.table.length - 2;
        const lastColumn = this.table[lastColumnIndex];
        const expectantStates = lastColumn.states
            .filter((state) => {
                const nextSymbol = state.rule.symbols[state.dot];
                return nextSymbol && typeof nextSymbol !== "string";
            });

        // Display a "state stack" for each expectant state
        // - which shows you how this state came to be, step by step. 
        // If there is more than one derivation, we only display the first one.
        const stateStacks = expectantStates
            .map((state) => {
                const stacks = this.buildStateStacks(state, []);
                return stacks[0];
            }, this);
        // Display each state that is expecting a terminal symbol next.
        stateStacks.forEach((stateStack) => {
            const state = stateStack[0];
            const nextSymbol = state.rule.symbols[state.dot];
            const symbolDisplay = this.getSymbolDisplay(nextSymbol);
            lines.push('A ' + symbolDisplay + ' based on:');
            this.displayStateStack(stateStack, lines);
        });

        lines.push("");
        return lines.join("\n");
    };

    displayStateStack(stateStack: State[], lines: string[]) {
        var lastDisplay;
        var sameDisplayCount = 0;
        for (let j = 0; j < stateStack.length; j++) {
            const state = stateStack[j];
            const display = state.rule.toString(state.dot);
            if (display === lastDisplay) {
                sameDisplayCount++;
            } else {
                if (sameDisplayCount > 0) {
                    lines.push('    ⬆ ︎' + sameDisplayCount + ' more lines identical to this');
                }
                sameDisplayCount = 0;
                lines.push('    ' + display);
            }
            lastDisplay = display;
        }
    };

    getSymbolDisplay(symbol) {
        const type = typeof symbol;
        if (type === "string") {
            return symbol;
        } else if (type === "object" && symbol.literal) {
            return JSON.stringify(symbol.literal);
        } else if (type === "object" && symbol instanceof RegExp) {
            return 'character matching ' + symbol;
        } else if (type === "object" && symbol.type) {
            return symbol.type + ' token';
        } else {
            throw new Error('Unknown symbol type: ' + symbol);
        }
    };

    buildStateStacks(state: State, visited: State[]): State[][] {
        if (visited.indexOf(state) !== -1) {
            return [];
        }
        if (state.wantedBy.length === 0) {
            return [[state]];
        }

        return state.wantedBy.reduce<State[][]>((stacks, prevState) => {
            return stacks.concat(this.buildStateStacks(
                prevState,
                [state].concat(visited))
                .map((stack) => [state].concat(stack)));
        }, []);
    };

    save() {
        var column = this.table[this.current];
        column.lexerState = this.lexerState;
        return column;
    };

    restore(column: Column) {
        var index = column.index;
        this.current = index;
        this.table[index] = column;
        this.table.splice(index + 1);
        this.lexerState = column.lexerState;

        // Incrementally keep track of results
        this.results = this.finish();
    };


    finish(): StateData[] {
        // Return the possible parsings
        const considerations: StateData[] = [];
        const start = this.grammar.start;
        const column = this.table[this.table.length - 1]
        column.states.forEach((t) => {
            if (t.rule.name === start
                && t.dot === t.rule.symbols.length
                && t.reference === 0) {
                considerations.push(t.data);
            }
        });
        return considerations;
    };
}

interface TokenError extends Error {
    offset?: number;
    token?: Token;
}
export interface ParserOptions {
    keepHistory: boolean;
    lexer: Lexer;
}