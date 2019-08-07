import { tabulateString, serializeRules, deIndent } from "../common/util";
import { PreProcessor } from "./preprocessors";

export const CoffeeScriptProcessor: PreProcessor = {
    preProcess(compiler, exportName) {
        const rules =
            tabulateString(
                serializeRules(compiler.rules, CoffeeScriptProcessor),
                '      ',
                { indentFirst: false });
        return `# Generated automatically by nearley, version ${compiler.version}\n`
            + `# http://github.com/Hardmath123/nearley\n`
            + `do ->\n`
            + `  id = (d) -> d[0]\n`
            + `${tabulateString(deIndent(compiler.body.join('\n')), '  ')}\n`
            + `  grammar = {\n`
            + `    Lexer: ${compiler.config.lexer},\n`
            + `    ParserRules: ${rules},\n`
            + `    ParserStart: ${JSON.stringify(compiler.start)}\n`
            + `  }\n`
            + `  if typeof module != 'undefined' && typeof module.exports != 'undefined'\n`
            + `    module.exports = grammar;\n`
            + `  else\n`
            + `    window.${exportName} = grammar;\n`;
    },
    builtinPostprocessors: {
        "joiner": "(d) -> d.join('')",
        "arrconcat": "(d) -> [d[0]].concat(d[1])",
        "arrpush": "(d) -> d[0].concat([d[1]])",
        "nuller": "() -> null",
        "id": "id"
    }
}
