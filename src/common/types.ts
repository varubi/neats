import { Rule } from "../rule";

export interface Dictionary<T> {
    [key: string]: T;
}

export interface CompiledRules {
    Lexer: Lexer;
    ParserRules: Rule[];
    ParserStart: string;
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

export interface TokenValue extends TokenBase {
    value: string;
}

export interface TokenLiteral extends TokenBase {
    literal: string;
}

export type RuleSymbol = TokenLiteral | TokenTester;

export type Token = TokenLiteral | TokenValue;

export interface TokenError extends Error {
    offset?: number;
    token?: Token;
}

export type LexerState = Dictionary<any>;

export type PostProcessor = (data: any[], reference: number, wantedBy: {}) => void;

export interface TokenTester {
    test: Function;
}


export interface Macro {
    args: any;
    exprs: any;
};


export interface ProductionRuleBody {
    body: string;
}

export interface ProductionRuleInclude {
    include: any;
    builtin: any;
}

export interface ProductionRuleMacro {
    macro: string;
    args: any;
    exprs: any;
}

type ProductionRuleConfig = { config: 'lexer' & string, value: Lexer } | { config: 'preprocessor' & string, value: string };

export interface ProductionRuleRules {
    name: string;
    rules: ProductionRuleRulesRule[];
}

export interface ProductionRuleRulesRule {
    tokens: (Token | string)[];
    postprocess?: {
        builtin: string;
    }
}

export interface SubExpressionToken {
    subexpression: ProductionRuleRulesRule[];
}

export interface EBNFToken {
    ebnf: string;
    modifier: string;
}

export interface MacroToken {
    macrocall: string;
    args: ProductionRuleRulesRule[];
}

export type ProductionRule = ProductionRuleBody | ProductionRuleInclude | ProductionRuleMacro | ProductionRuleConfig | ProductionRuleRules;


