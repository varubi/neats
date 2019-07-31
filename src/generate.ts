import { JavaScriptProcessor } from "./Processors/javascript-processor";
import { ESModule } from "./Processors/esmodule-processor";
import { CoffeeScriptProcessor } from "./Processors/coffeescript-processor";
import { TypeScriptProcessor } from "./Processors/typescript-processor";


export function Generate(parser, exportName: string) {
    const preprocessors: { [key: string]: PreProcessor } = {
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

    if (!parser.config.preprocessor) {
        parser.config.preprocessor = "_default";
    }

    if (!preprocessors[parser.config.preprocessor]) {
        throw new Error("No such preprocessor: " + parser.config.preprocessor)
    }

    return preprocessors[parser.config.preprocessor].preProcess(parser, exportName);
}

export function serializeRules(rules, builtinPostprocessors) {
    return "[\n    "
        + rules
            .map((rule) => serializeRule(rule, builtinPostprocessors))
            .join(",\n    ")
        + "\n]";
}

export function deIndent(func) {
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

export function tabulateString(string, indent, options?) {
    var lines;
    if (Array.isArray(string)) {
        lines = string;
    } else {
        lines = string.toString().split('\n');
    }

    options = options || {};
    let tabulated = lines.map(function addIndent(line, i) {
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

function serializeSymbol(s) {
    if (s instanceof RegExp) {
        return s.toString();
    } else if (s.token) {
        return s.token;
    } else {
        return JSON.stringify(s);
    }
}

function serializeRule(rule, builtinPostprocessors) {
    var ret = '{';
    ret += '"name": ' + JSON.stringify(rule.name);
    ret += ', "symbols": [' + rule.symbols.map(serializeSymbol).join(', ') + ']';
    if (rule.postprocess) {
        if (rule.postprocess.builtin) {
            rule.postprocess = builtinPostprocessors[rule.postprocess.builtin];
        }
        ret += ', "postprocess": ' + tabulateString(deIndent(rule.postprocess), '        ', { indentFirst: false });
    }
    ret += '}';
    return ret;
}

export interface PreProcessor {
    preProcess(parser, exportName): string;
    builtinPostprocessors?: {
        [key: string]: string;
    }
}