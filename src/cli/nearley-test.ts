#!/usr/bin/env node

import { Parser } from "../parser";
import { Grammar } from "../grammar";
import { StreamWrapper } from "../stream";

/* eg. node bin/nearleythere.js examples/js/left.js --input "....."
   or, node bin/nearleythere.js examples/js/AycockHorspool.js --input "aa" 
 */

const fs = require('fs');
const opts = require('commander');

const version = require('../package.json').version;
opts.version(version, '-v, --version')
    .arguments('<file.js>')
    .option('-i, --input [string]', 'An input string to parse (if not provided then read from stdin)')
    .option('-s, --start [symbol]', 'An optional start symbol (if not provided then use the parser start symbol)', false)
    .option('-o, --out [filename]', 'File to output to (defaults to stdout)', false)
    .option('-q, --quiet', 'Output parse results only (hide Earley table)', false)
    .parse(process.argv);

const output = opts.out ? fs.createWriteStream(opts.out) : process.stdout;

const filename = require('path').resolve(opts.args[0]);
const grammar = Grammar.fromCompiled(require(filename));
if (opts.start) grammar.start = opts.start
const parser = new Parser(grammar, {
    keepHistory: true,
});

const writeTable = function (writeStream, parser) {
    writeStream.write("Table length: " + parser.table.length + "\n");
    writeStream.write("Number of parses: " + parser.results.length + "\n");
    writeStream.write("Parse Charts");
    parser.table.forEach(function (column, index) {
        writeStream.write("\nChart: " + index++ + "\n");
        const stateNumber = 0;
        column.states.forEach(function (state, stateIndex) {
            writeStream.write(stateIndex + ": " + state.toString() + "\n");
        })
    })
    writeStream.write("\n\nParse results: \n");
}

const writeResults = function (writeStream, parser) {
    writeStream.write(require('util').inspect(parser.results, {colors: !opts.quiet, depth: null}));
    writeStream.write("\n");
}

if (typeof(opts.input) === "undefined") {
    process.stdin
        .pipe(new StreamWrapper(parser))
        .on('finish', function() {
            if (!opts.quiet) writeTable(output, parser);
            writeResults(output, parser);
        });
} else {
    parser.feed(opts.input);
    if (!opts.quiet) writeTable(output, parser);
    writeResults(output, parser);
}

