import { PreProcessor, Generate } from "../generate";

export const CoffeeScriptProcessor: PreProcessor = {
    Preprocess(parser, exportName) {
        var output = "# Generated automatically by nearley, version " + parser.version + "\n";
        output += "# http://github.com/Hardmath123/nearley\n";
        output += "do ->\n";
        output += "  id = (d) -> d[0]\n";
        output += Generate.tabulateString(Generate.dedentFunc(parser.body.join('\n')), '  ') + '\n';
        output += "  grammar = {\n";
        output += "    Lexer: " + parser.config.lexer + ",\n";
        output += "    ParserRules: " +
            Generate.tabulateString(
                Generate.serializeRules(parser.rules, CoffeeScriptProcessor),
                '      ',
                { indentFirst: false })
            + ",\n";
        output += "    ParserStart: " + JSON.stringify(parser.start) + "\n";
        output += "  }\n";
        output += "  if typeof module != 'undefined' "
            + "&& typeof module.exports != 'undefined'\n";
        output += "    module.exports = grammar;\n";
        output += "  else\n";
        output += "    window." + exportName + " = grammar;\n";
        return output;
    },
    builtinPostprocessors: {
        "joiner": "(d) -> d.join('')",
        "arrconcat": "(d) -> [d[0]].concat(d[1])",
        "arrpush": "(d) -> d[0].concat([d[1]])",
        "nuller": "() -> null",
        "id": "id"
    }
}
