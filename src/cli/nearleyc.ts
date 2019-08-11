#!/usr/bin/env node

import { Parser } from "../parser";
import { Grammar } from "../grammar";
import { StreamWrapper } from "../stream";
import { Compile } from "../compile";
import { lint } from "../lint";

const fs = require('fs');
const opts = require('commander');

const version = require('../package.json').version;

opts.version(version, '-v, --version')
    .arguments('<file.ne>')
    .option('-o, --out [filename.js]', 'File to output to (defaults to stdout)', false)
    .option('-e, --export [name]', 'Variable to set parser to', 'grammar')
    .option('-q, --quiet', 'Suppress linter')
    .option('--nojs', 'Do not compile postprocessors')
    .parse(process.argv);


const input = opts.args[0] ? fs.createReadStream(opts.args[0]) : process.stdin;
const output = opts.out ? fs.createWriteStream(opts.out) : process.stdout;

const parserGrammar = Grammar.fromCompiled(require('../nearley-language-bootstrapped'));
const parser = new Parser(parserGrammar);

input
    .pipe(new StreamWrapper(parser))
    .on('finish', function () {
        parser.feed('\n');
        if (!parser.results)
            return;
        const c = Compile(parser.results[0], { version, ...opts });
        if (!opts.quiet)
            lint(c, { 'out': process.stderr, 'version': version });
        output.write(c.generate(opts.export));
    });
