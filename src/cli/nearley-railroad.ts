#!/usr/bin/env node

import { Grammar } from "../grammar";
import { Parser } from "../parser";
import { StreamWrapper } from "../stream";

const rr = require('railroad-diagrams');
const fs = require('fs');
const path = require('path');
const opts = require('commander');

const version = require('../package.json').version;
opts.version(version, '-v, --version')
    .arguments('<file.ne>')
    .option('-o, --out [filename.svg]', 'File to output to (default stdout).', false)
    .parse(process.argv);

const input = opts.args[0] ? fs.createReadStream(opts.args[0]) : process.stdin;
const output = opts.out ? fs.createWriteStream(opts.out) : process.stdout;

function railroad(grm) {
    const rules = {};
    grm.forEach(function (instr) {
        if (instr.rules) {
            if (!rules[instr.name]) {
                rules[instr.name] = [];
            }
            rules[instr.name] = rules[instr.name].concat(instr.rules);
        }
    });

    const style = fs.readFileSync(
        path.join(
            path.dirname(require.resolve('railroad-diagrams')),
            'railroad-diagrams.css'
        )
    );

    const diagrams = Object.keys(rules).map(function (r) {
        return [
            '<h1><code>' + r + '</code></h1>',
            '<div>',
            diagram(r).toString(),
            '</div>'
        ].join('\n');
    });

    function diagram(name) {
        const selectedrules = rules[name];
        const outer = { subexpression: selectedrules };

        function renderTok(tok) {
            // ctx translated to correct position already
            if (tok.subexpression) {
                return new rr.Choice(0, tok.subexpression.map(renderTok));
            } else if (tok.ebnf) {
                switch (tok.modifier) {
                    case ":+":
                        return new rr.OneOrMore(renderTok(tok.ebnf));
                        break;
                    case ":*":
                        return new rr.ZeroOrMore(renderTok(tok.ebnf));
                        break;
                    case ":?":
                        return new rr.Optional(renderTok(tok.ebnf));
                        break;
                }
            } else if (tok.literal) {
                return new rr.Terminal(JSON.stringify(tok.literal));
            } else if (tok.mixin) {
                return new rr.Comment("Pas implementé.");
            } else if (tok.macrocall) {
                return new rr.Comment("Pas implementé.");
            } else if (tok.tokens) {
                return new rr.Sequence(tok.tokens.map(renderTok));
            } else if (typeof (tok) === 'string') {
                return new rr.NonTerminal(tok);
            } else if (tok.constructor === RegExp) {
                return new rr.Terminal(tok.toString());
            } else if (tok.token) {
                return new rr.Terminal(tok.token);
            } else {
                return new rr.Comment("[Unimplemented]");
            }
        }

        return new rr.Diagram([renderTok(outer)]);
    }

    return [
        '<!DOCTYPE html>',
        '<html>',
        '<head>',
        '<meta charset="UTF-8">',
        '<style type="text/css">',
        style.toString(),
        '</style>',
        '</head>',
        '<body>',
        diagrams.join('\n'),
        '</body>',
        '</html>'
    ].join('\n');
}

const parserGrammar = Grammar.fromCompiled(require('../nearley-language-bootstrapped'));
const parser = new Parser(parserGrammar);
input
    .pipe(new StreamWrapper(parser))
    .on('finish', function () {
        if (!parser.results)
            return;
        if (parser.results[0]) {
            output.write(railroad(parser.results[0]));
        } else {
            process.stderr.write('SyntaxError: unexpected EOF\n');
        }
    });
