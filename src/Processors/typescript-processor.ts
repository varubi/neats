import { PreProcessor, serializeRules } from "../generate";

export const TypeScriptProcessor: PreProcessor = {
    preProcess(parser, _exportName) {
        return `// Generated automatically by nearley, version ${parser.version}\n`
            + `// http://github.com/Hardmath123/nearley\n`
            + `// Bypasses TS6133. Allow declared but unused functions.\n`
            + `// @ts-ignore\n`
            + `function id(d: any[]): any { return d[0]; }\n`
            + parser.customTokens.map((token) => `declare var ${token}: any;\n`).join(``)
            + parser.body.join('\n')
            + `\n`
            + `export interface Token { value: any; [key: string]: any };\n`
            + `\n`
            + `export interface Lexer {\n`
            + `  reset: (chunk: string, info: any) => void;\n`
            + `  next: () => Token | undefined;\n`
            + `  save: () => any;\n`
            + `  formatError: (token: Token) => string;\n`
            + `  has: (tokenType: string) => boolean\n`
            + `};\n`
            + `\n`
            + `export interface NearleyRule {\n`
            + `  name: string;\n`
            + `  symbols: NearleySymbol[];\n`
            + `  postprocess?: (d: any[], loc?: number, reject?: {}) => any\n`
            + `};\n`
            + `\n`
            + `export type NearleySymbol = string | { literal: any } | { test: (token: any) => boolean };\n`
            + `\n`
            + `export var Lexer: Lexer | undefined = ${parser.config.lexer};\n`
            + `\n`
            + `export var ParserRules: NearleyRule[] = ${serializeRules(parser.rules, TypeScriptProcessor.builtinPostprocessors)};\n`
            + `\n`
            + `export var ParserStart: string = ${JSON.stringify(parser.start)};\n`;
    },
    builtinPostprocessors: {
        "joiner": "(d) => d.join('')",
        "arrconcat": "(d) => [d[0]].concat(d[1])",
        "arrpush": "(d) => d[0].concat([d[1]])",
        "nuller": "() => null",
        "id": "id"
    }
}
