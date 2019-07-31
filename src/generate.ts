export class Generate {
    private static preprocessors: { [key: string]: PreProcessor } = {
        '_default': JavaScriptProcessor,
        'js': JavaScriptProcessor,
        'javascript': JavaScriptProcessor,
        'module': ESModule,
        'esmodule': ESModule,
        'cs': CoffeeScriptProcessor,
        'coffeescript': CoffeeScriptProcessor,
        'coffee': CoffeeScriptProcessor,
        'ts': TypeScriptProcessor,
        'typescript': TypeScriptProcessor
    }
    constructor(parser, exportName) {
        if (!parser.config.preprocessor) {
            parser.config.preprocessor = "_default";
        }

        if (!Generate.preprocessors[parser.config.preprocessor]) {
            throw new Error("No such preprocessor: " + parser.config.preprocessor)
        }

        return Generate.preprocessors[parser.config.preprocessor].Preprocess(parser, exportName);
    }

    public static serializeRules(rules, builtinPostprocessors) {
        return "[\n    " + rules.map(function (rule) {
            return Generate.serializeRule(rule, builtinPostprocessors);
        }).join(",\n    ") + "\n]";
    }

    public static dedentFunc(func) {
        var lines = func.toString().split(/\n/);

        if (lines.length === 1) {
            return [lines[0].replace(/^\s+|\s+$/g, '')];
        }

        var indent = null;
        var tail = lines.slice(1);
        for (var i = 0; i < tail.length; i++) {
            var match = /^\s*/.exec(tail[i]);
            if (match && match[0].length !== tail[i].length) {
                if (indent === null ||
                    match[0].length < indent.length) {
                    indent = match[0];
                }
            }
        }

        if (indent === null) {
            return lines;
        }

        return lines.map(function dedent(line) {
            if (line.slice(0, indent.length) === indent) {
                return line.slice(indent.length);
            }
            return line;
        });
    }

    public static tabulateString(string, indent, options?) {
        var lines;
        if (Array.isArray(string)) {
            lines = string;
        } else {
            lines = string.toString().split('\n');
        }

        options = options || {};
        tabulated = lines.map(function addIndent(line, i) {
            var shouldIndent = true;

            if (i == 0 && !options.indentFirst) {
                shouldIndent = false;
            }

            if (shouldIndent) {
                return indent + line;
            } else {
                return line;
            }
        }).join('\n');

        return tabulated;
    }

    private static serializeSymbol(s) {
        if (s instanceof RegExp) {
            return s.toString();
        } else if (s.token) {
            return s.token;
        } else {
            return JSON.stringify(s);
        }
    }

    private static serializeRule(rule, builtinPostprocessors) {
        var ret = '{';
        ret += '"name": ' + JSON.stringify(rule.name);
        ret += ', "symbols": [' + rule.symbols.map(Generate.serializeSymbol).join(', ') + ']';
        if (rule.postprocess) {
            if (rule.postprocess.builtin) {
                rule.postprocess = builtinPostprocessors[rule.postprocess.builtin];
            }
            ret += ', "postprocess": ' + Generate.tabulateString(Generate.dedentFunc(rule.postprocess), '        ', { indentFirst: false });
        }
        ret += '}';
        return ret;
    }


}
const JavaScriptProcessor: PreProcessor = {
    Preprocess(parser, exportName) {
        var output = "// Generated automatically by nearley, version " + parser.version + "\n";
        output += "// http://github.com/Hardmath123/nearley\n";
        output += "(function () {\n";
        output += "function id(x) { return x[0]; }\n";
        output += parser.body.join('\n');
        output += "var grammar = {\n";
        output += "    Lexer: " + parser.config.lexer + ",\n";
        output += "    ParserRules: " + Generate.serializeRules(parser.rules, this.builtinPostprocessors) + "\n";
        output += "  , ParserStart: " + JSON.stringify(parser.start) + "\n";
        output += "}\n";
        output += "if (typeof module !== 'undefined'"
            + "&& typeof module.exports !== 'undefined') {\n";
        output += "   module.exports = grammar;\n";
        output += "} else {\n";
        output += "   window." + exportName + " = grammar;\n";
        output += "}\n";
        output += "})();\n";
        return output;
    },
    builtinPostprocessors: {
        "joiner": "function joiner(d) {return d.join('');}",
        "arrconcat": "function arrconcat(d) {return [d[0]].concat(d[1]);}",
        "arrpush": "function arrpush(d) {return d[0].concat([d[1]]);}",
        "nuller": "function(d) {return null;}",
        "id": "id"

    }
}

const ESModule: PreProcessor = {
    Preprocess(parser, exportName) {
        var output = "// Generated automatically by nearley, version " + parser.version + "\n";
        output += "// http://github.com/Hardmath123/nearley\n";
        output += "function id(x) { return x[0]; }\n";
        output += parser.body.join('\n');
        output += "let Lexer = " + parser.config.lexer + ";\n";
        output += "let ParserRules = " + Generate.serializeRules(parser.rules, JavaScriptProcessor.builtinPostprocessors) + ";\n";
        output += "let ParserStart = " + JSON.stringify(parser.start) + ";\n";
        output += "export default { Lexer, ParserRules, ParserStart };\n";
        return output;
    }
}

const CoffeeScriptProcessor: PreProcessor = {
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

const TypeScriptProcessor: PreProcessor = {
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


interface PreProcessor {
    Preprocess(parser, exportName): string;
    builtinPostprocessors?: {
        [key: string]: string;
    }
}