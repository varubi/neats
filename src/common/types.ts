export interface Dictionary<T> {
    [key: string]: T;
}

export interface CompiledRules {
    Lexer: Lexer;
    ParserRules: ParserRule[];
    ParserStart: string;
}

export interface ParserRule {
    name: string;
    symbols: string[];
    postprocess?: (args: any[]) => any;
}

export interface Lexer {
    reset(data: string, state?: LexerState): void;
    next(): TokenValue | undefined;
    save(): LexerState;
    formatError(token: Token, message: string): string;
}

export interface TokenBase {
    toString(): string;
    type?: string;
    text?: string;
    offset?: number;
    lineBreaks?: number;
    line?: number;
    col?: number;
}
export interface TokenLiteral extends TokenBase {
    literal: string;
}
export interface TokenValue extends TokenBase {
    value: string;
}
export type Token = TokenLiteral | TokenValue;

export interface LexerState {
    [x: string]: any;
}

export type PostProcessor = (data: any[], reference: number, wantedBy: {}) => void;