import { PreProcessor, tabulateString, deIndent, serializeRules, } from "../generate";

export const CoffeeScriptProcessor: PreProcessor = {
    preProcess(parser, exportName) {
        const rules =
            tabulateString(
                serializeRules(parser.rules, CoffeeScriptProcessor),
                '      ',
                { indentFirst: false });
        return `# Generated automatically by nearley, version ${parser.version}\n`
            + `# http://github.com/Hardmath123/nearley\n`
            + `do ->\n`
            + `  id = (d) -> d[0]\n`
            + `${tabulateString(deIndent(parser.body.join('\n')), '  ')}\n`
            + `  grammar = {\n`
            + `    Lexer: ${parser.config.lexer},\n`
            + `    ParserRules: ${rules},\n`
            + `    ParserStart: ${JSON.stringify(parser.start)}\n`
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
