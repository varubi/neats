#!/usr/bin/env node

import { Unparse } from "../unparse";

const fs = require('fs');
const opts = require('commander');
const version = require('../package.json').version;
opts.version(version, '-v, --version')
    .arguments('<file.js>')
    .option('-s, --start [name]', 'An optional start symbol (if not provided then use the parser start symbol)', false)
    .option('-n, --count [n]', 'The number of samples to generate (separated by \\n).', 1)
    .option('-d, --depth [n]', 'The depth bound of each sample. Defaults to -1, which means "unbounded".', -1)
    .option('-o, --out [filename]', 'File to output to (defaults to stdout)')
    .parse(process.argv);

const output = opts.out ? fs.createWriteStream(opts.out) : process.stdout;

const grammar = require(require('path').resolve(opts.args[0]));

// the main loop
for (let i = 0; i < parseInt(opts.count); i++) {
    output.write(Unparse(grammar, opts.start ? opts.start : grammar.ParserStart, (opts.depth === -1) ? null : parseInt(opts.depth)));
    if (parseInt(opts.count) > 1) output.write("\n");
}
