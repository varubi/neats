import { PreProcessor, serializeRules } from "../generate";

export const JavaScriptProcessor: PreProcessor = {
    preProcess(parser, exportName) {
        return `// Generated automatically by nearley, version ${parser.version}\n`
            + `// http://github.com/Hardmath123/nearley\n`
            + `(function () {\n`
            + `function id(x) { return x[0]; }\n`
            + parser.body.join('\n')
            + `var grammar = {\n`
            + `    Lexer: ${parser.config.lexer},\n`
            + `    ParserRules: ${serializeRules(parser.rules, this.builtinPostprocessors)}\n`
            + `  , ParserStart: ${JSON.stringify(parser.start)}\n`
            + `}\n`
            + `if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {\n`
            + `   module.exports = grammar;\n`
            + `} else {\n`
            + `   window.${exportName} = grammar;\n`
            + `}\n`
            + `})();\n`;
    },
    builtinPostprocessors: {
        "joiner": "function joiner(d) {return d.join('');}",
        "arrconcat": "function arrconcat(d) {return [d[0]].concat(d[1]);}",
        "arrpush": "function arrpush(d) {return d[0].concat([d[1]]);}",
        "nuller": "function(d) {return null;}",
        "id": "id"
    }
}