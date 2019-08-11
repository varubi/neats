

var { Compile } = require('../dist/compile');
var { Grammar } = require('../dist/grammar');
var { Parser } = require('../dist/parser');
var parserGrammar = Grammar.fromCompiled(require('../dist/nearley-language-bootstrapped'));

function parse(grammar, input) {

    var p = grammar instanceof Grammar ? new Parser(grammar) : Parser.fromCompiled(grammar);
    // console.log(p);    process.exit()
    p.feed(input);
    return p.results;
}

function nearleyc(source) {
    var results = parse(parserGrammar, source);

    var c = Compile(results[0], {});

    return c.generate();
}

function compile(source) {
    var compiledGrammar = nearleyc(source);

    return evalGrammar(compiledGrammar);
}

function requireFromString(source) {
    var module = { exports: null };
    eval(source)
    return module.exports;
}

function evalGrammar(compiledGrammar) {
    var exp = requireFromString(compiledGrammar);
    return Grammar.fromCompiled(exp);
}

module.exports = {
    compile: compile,
    nearleyc: nearleyc,
    evalGrammar: evalGrammar,
    parse: parse,
};

