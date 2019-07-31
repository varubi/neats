import { PreProcessor, Generate } from "../generate";

export const TypeScriptProcessor: PreProcessor = {
    Preprocess(parser, exportName) {
        var output = "// Generated automatically by nearley, version " + parser.version + "\n";
        output += "// http://github.com/Hardmath123/nearley\n";
        output += "// Bypasses TS6133. Allow declared but unused functions.\n";
        output += "// @ts-ignore\n";
        output += "function id(d: any[]): any { return d[0]; }\n";
        output += parser.customTokens.map(function (token) { return "declare var " + token + ": any;\n" }).join("")
        output += parser.body.join('\n');
        output += "\n";
        output += "export interface Token { value: any; [key: string]: any };\n";
        output += "\n";
        output += "export interface Lexer {\n";
        output += "  reset: (chunk: string, info: any) => void;\n";
        output += "  next: () => Token | undefined;\n";
        output += "  save: () => any;\n";
        output += "  formatError: (token: Token) => string;\n";
        output += "  has: (tokenType: string) => boolean\n";
        output += "};\n"
        output += "\n";
        output += "export interface NearleyRule {\n";
        output += "  name: string;\n";
        output += "  symbols: NearleySymbol[];\n";
        output += "  postprocess?: (d: any[], loc?: number, reject?: {}) => any\n";
        output += "};\n";
        output += "\n";
        output += "export type NearleySymbol = string | { literal: any } | { test: (token: any) => boolean };\n";
        output += "\n";
        output += "export var Lexer: Lexer | undefined = " + parser.config.lexer + ";\n";
        output += "\n";
        output += "export var ParserRules: NearleyRule[] = " + Generate.serializeRules(parser.rules, TypeScriptProcessor.builtinPostprocessors) + ";\n";
        output += "\n";
        output += "export var ParserStart: string = " + JSON.stringify(parser.start) + ";\n";
        return output;
    },
    builtinPostprocessors: {
        "joiner": "(d) => d.join('')",
        "arrconcat": "(d) => [d[0]].concat(d[1])",
        "arrpush": "(d) => d[0].concat([d[1]])",
        "nuller": "() => null",
        "id": "id"
    }
}
