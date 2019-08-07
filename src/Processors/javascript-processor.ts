import { PreProcessor } from "./preprocessors";
import { serializeRules } from "../common/util";

export const JavaScriptProcessor: PreProcessor = {
    preProcess(compiler, exportName) {
        return `// Generated automatically by nearley, version ${compiler.version}\n`
            + `// http://github.com/Hardmath123/nearley\n`
            + `(function () {\n`
            + `function id(x) { return x[0]; }\n`
            + compiler.body.join('\n')
            + `var grammar = {\n`
            + `    Lexer: ${compiler.config.lexer},\n`
            + `    ParserRules: ${serializeRules(compiler.rules, this.builtinPostprocessors)}\n`
            + `  , ParserStart: ${JSON.stringify(compiler.start)}\n`
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