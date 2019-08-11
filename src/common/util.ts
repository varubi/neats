// const cache = {};
// const types = {};
// export const log = console.log;
// console.log = function (...args) {
//     if (new Error()!.stack!.indexOf('identify') >= 0) {
//         log(...args);
//     }
// }
// export function identify(obj) {
//     if (!types[typeof obj]) {
//         console.log('------');
//         console.log(typeof obj);
//         console.log('------');
//         types[typeof obj] = true;
//     }
//     if (typeof obj === 'object') {
//         const key = Object.keys(obj).sort().join();
//         if (!cache[key]) {
//             console.log('!!!!!!');
//             console.log(key);
//             console.log('------');
//             console.log(obj);
//             console.log('======');
//             cache[key] = true;
//         }
//     }
// }


export function deIndent(func) {
    var lines = func.toString().split(/\n/);

    if (lines.length === 1) {
        return [lines[0].replace(/^\s+|\s+$/g, '')];
    }

    var indent: any;
    for (var i = 1; i < lines.length; i++) {
        var match = /^\s*/.exec(lines[i]);
        if (match && match[0].length !== lines[i].length) {
            if (!indent ||
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

export function indentString(string: string | string[], indent: string, options: { indentFirst: boolean } = { indentFirst: false }) {
    return (Array.isArray(string) ? string : string.split('\n'))
        .map((line, i) => i > 0 || options.indentFirst ? indent + line : line)
        .join('\n');
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

export function serializeRules(rules, builtinPostprocessors) {
    return `[\n    ${rules.map(rule => serializeRule(rule, builtinPostprocessors)).join(",\n    ")}\n]`;
}

function serializeRule(rule, builtinPostprocessors) {
    const name = JSON.stringify(rule.name);
    const symbols = rule.symbols.map(serializeSymbol).join(', ');
    let postprocess = '';
    if (rule.postprocess) {
        if (rule.postprocess.builtin) {
            rule.postprocess = builtinPostprocessors[rule.postprocess.builtin];
        }
        postprocess = ',\n "postprocess": ' + indentString(deIndent(rule.postprocess), '        ', { indentFirst: false });
    }
    return `{"name":${name}\n,"symbols":[${symbols}]${postprocess}}`;

}
