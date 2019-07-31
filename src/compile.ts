import { Grammar } from "./grammar";
import { Parser } from "./parser";
import { Rule } from "./rule";

export const Compile = (structure, opts) => new Compiler(structure, opts);
export class Compiler {
    private unique = uniquer();
    public rules: any = [];
    public body: any = [];
    public customTokens: any = [];
    public config: any = {};
    public macros: any = {};
    public start: any = '';
    public version;// opts.version || 'unknown'

    constructor(structure, private opts) {
        if (!opts.alreadycompiled) {
            opts.alreadycompiled = [];
        }

        for (var i = 0; i < structure.length; i++) {
            const productionRule = structure[i];
            if (productionRule.body) {
                if (!opts.nojs) {
                    this.body.push(productionRule.body);
                }
            } else if (productionRule.include) {
                var path;
                if (!productionRule.builtin) {
                    path = require('path').resolve(
                        opts.args[0] ? require('path').dirname(opts.args[0]) : process.cwd(),
                        productionRule.include
                    );
                } else {
                    path = require('path').resolve(
                        __dirname,
                        '../builtin/',
                        productionRule.include
                    );
                }
                if (opts.alreadycompiled.indexOf(path) === -1) {
                    opts.alreadycompiled.push(path);
                    var f = require('fs').readFileSync(path).toString();
                    var parserGrammar = Grammar.fromCompiled(require('./nearley-language-bootstrapped.js'));
                    var parser = new Parser(parserGrammar);
                    parser.feed(f);
                    var c = new Compiler(parser.results[0], { args: [path], __proto__: opts });
                    this.rules = this.rules.concat(c.rules);
                    this.body = this.body.concat(c.body);
                    this.customTokens = this.customTokens.concat(c.customTokens);
                    Object.keys(c.config).forEach((k) => {
                        this.config[k] = c.config[k];
                    });
                    Object.keys(c.macros).forEach((k) => {
                        this.macros[k] = c.macros[k];
                    });
                }
            } else if (productionRule.macro) {
                this.macros[productionRule.macro] = {
                    'args': productionRule.args,
                    'exprs': productionRule.exprs
                };
            } else if (productionRule.config) {
                // This isn't a rule, it's an @config.
                this.config[productionRule.config] = productionRule.value
            } else {
                this.produceRules(productionRule.name, productionRule.rules, {});
                if (!this.start) {
                    this.start = productionRule.name;
                }
            }
        }
    }

    private produceRules(name, rules, env) {
        for (var i = 0; i < rules.length; i++) {
            var rule = this.buildRule(name, rules[i], env);
            if (this.opts.nojs) {
                rule.postprocess = null;
            }
            this.rules.push(rule);
        }
    }

    private buildRule(ruleName, rule, env) {
        var tokens = [];
        for (var i = 0; i < rule.tokens.length; i++) {
            var token = this.buildToken(ruleName, rule.tokens[i], env);
            if (token !== null) {
                tokens.push(token);
            }
        }
        return new Rule(ruleName, tokens, rule.postprocess);
    }

    private buildToken(ruleName, token, env) {
        if (typeof token === 'string') {
            if (token === 'null') {
                return null;
            }
            return token;
        }

        if (token instanceof RegExp) {
            return token;
        }

        if (token.literal) {
            if (!token.literal.length) {
                return null;
            }
            if (token.literal.length === 1 || this.config.lexer) {
                return token;
            }
            return this.buildStringToken(ruleName, token, env);
        }
        if (token.token) {
            if (this.config.lexer) {
                var name = token.token;
                if (this.customTokens.indexOf(name) === -1) {
                    this.customTokens.push(name);
                }
                var expr = this.config.lexer + ".has(" + JSON.stringify(name) + ") ? {type: " + JSON.stringify(name) + "} : " + name;
                return { token: "(" + expr + ")" };
            }
            return token;
        }

        if (token.subexpression) {
            return this.buildSubExpressionToken(ruleName, token, env);
        }

        if (token.ebnf) {
            return this.buildEBNFToken(ruleName, token, env);
        }

        if (token.macrocall) {
            return this.buildMacroCallToken(ruleName, token, env);
        }

        if (token.mixin) {
            if (env[token.mixin]) {
                return this.buildToken(ruleName, env[token.mixin], env);
            } else {
                throw new Error("Unbound variable: " + token.mixin);
            }
        }

        throw new Error("unrecognized token: " + JSON.stringify(token));
    }

    private buildStringToken(ruleName, token, env) {
        var newname = this.unique(ruleName + "$string");
        this.produceRules(newname, [
            {
                tokens: token.literal.split("").map((d) => {
                    return {
                        literal: d
                    };
                }),
                postprocess: { builtin: "joiner" }
            }
        ], env);
        return newname;
    }

    private buildSubExpressionToken(ruleName, token, env) {
        var data = token.subexpression;
        var name = this.unique(ruleName + "$subexpression");
        this.produceRules(name, data, env);
        return name;
    }

    private buildEBNFToken(ruleName, token, env) {
        switch (token.modifier) {
            case ":+":
                return this.buildEBNFPlus(ruleName, token, env);
            case ":*":
                return this.buildEBNFStar(ruleName, token, env);
            case ":?":
                return this.buildEBNFOpt(ruleName, token, env);
        }
    }

    private buildEBNFPlus(ruleName, token, env) {
        var name = this.unique(ruleName + "$ebnf");
        this.produceRules(name,
            [{
                tokens: [token.ebnf],
            }, {
                tokens: [name, token.ebnf],
                postprocess: { builtin: "arrpush" }
            }],
            env
        );
        return name;
    }

    private buildEBNFStar(ruleName, token, env) {
        var name = this.unique(ruleName + "$ebnf");
        this.produceRules(name,
            [{
                tokens: [],
            }, {
                tokens: [name, token.ebnf],
                postprocess: { builtin: "arrpush" }
            }],
            env
        );
        return name;
    }

    private buildEBNFOpt(ruleName, token, env) {
        var name = this.unique(ruleName + "$ebnf");
        this.produceRules(name,
            [{
                tokens: [token.ebnf],
                postprocess: { builtin: "id" }
            }, {
                tokens: [],
                postprocess: { builtin: "nuller" }
            }],
            env
        );
        return name;
    }

    private buildMacroCallToken(ruleName, token, env) {
        var name = this.unique(ruleName + "$macrocall");
        var macro = this.macros[token.macrocall];
        if (!macro) {
            throw new Error("Unkown macro: " + token.macrocall);
        }
        if (macro.args.length !== token.args.length) {
            throw new Error("Argument count mismatch.");
        }
        var newenv = { __proto__: env };
        for (var i = 0; i < macro.args.length; i++) {
            var argrulename = this.unique(ruleName + "$macrocall");
            newenv[macro.args[i]] = argrulename;
            this.produceRules(argrulename, [token.args[i]], env);
        }
        this.produceRules(name, macro.exprs, newenv);
        return name;
    }
}

function uniquer() {
    var uns = {};
    return unique;
    function unique(name) {
        var un = uns[name] = (uns[name] || 0) + 1;
        return name + '$' + un;
    }
}


