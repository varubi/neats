import { JavaScriptProcessor } from "./Processors/javascript-processor";
import { ESModule } from "./Processors/esmodule-processor";
import { CoffeeScriptProcessor } from "./Processors/coffeescript-processor";
import { TypeScriptProcessor } from "./Processors/typescript-processor";

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

export interface PreProcessor {
    Preprocess(parser, exportName): string;
    builtinPostprocessors?: {
        [key: string]: string;
    }
}