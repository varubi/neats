import { Grammar } from "./grammar";
import { Parser } from "./parser";
import { PreProcessors, PreProcessor } from "./Processors/preprocessors";
import { Rule } from "./rule";
import { Lexer, Dictionary, Token, RuleSymbol, TokenLiteral, ProductionRule, Macro, ProductionRuleRulesRule, SubExpressionToken, EBNFToken, MacroToken } from "./common/types";

export interface CompilerConfig {
    preprocessor: string;
    lexer: Lexer;
}
export interface CompilerArguments {
    alreadycompiled: Dictionary<boolean>;
    args: string[];
    nojs: boolean;
}

export function Compile(structure: ProductionRule[], opts: CompilerArguments) {
    const c = new Compiler(structure, opts);
    c.initialize();
    return c;
}
export class Compiler {
    private _uniqueCache: Dictionary<number> = {};

    public rules: Rule[] = [];
    public body: any = [];
    public customTokens: Dictionary<boolean> = {};
    public config: CompilerConfig = <CompilerConfig>{};
    public macros: Dictionary<Macro> = {};
    public start: string = '';
    public version;

    constructor(private structure: ProductionRule[], private args: CompilerArguments) {
        this.args.alreadycompiled = this.args.alreadycompiled || {};
    }

    initialize() {
        for (let i = 0; i < this.structure.length; i++) {
            const productionRule = this.structure[i];
            if ("body" in productionRule) {
                if (!this.args.nojs) {
                    this.body.push(productionRule.body);
                }
            } else if ("include" in productionRule) {
                let path;
                if (!productionRule.builtin) {
                    path = require('path').resolve(this.args.args[0] ? require('path').dirname(this.args.args[0]) : process.cwd(), productionRule.include);
                } else {
                    path = require('path').resolve(__dirname, '../builtin/', productionRule.include);
                }
                if (!this.args.alreadycompiled[path]) {
                    this.args.alreadycompiled[path] = true;
                    const f = require('fs').readFileSync(path).toString();
                    const { Lexer, ParserRules, ParserStart } = require('./nearley-language-bootstrapped.js');
                    const parserGrammar = Grammar.fromCompiled({ Lexer, ParserRules, ParserStart });
                    const parser = new Parser(parserGrammar, { lexer: Lexer || ParserRules.lexer });
                    parser.feed(f);
                    if (!parser.results)
                        continue;
                    const c = Compile(parser.results[0], <CompilerArguments>(<any>{ __proto__: this.args, args: [path] }));
                    this.body = [...this.body, ...c.body];
                    this.rules = [...this.rules, ...c.rules];
                    this.customTokens = { ...this.customTokens, ...c.customTokens };
                    this.config = { ...this.config, ...c.config };
                    this.macros = { ...this.macros, ...c.macros };
                }
            } else if ("macro" in productionRule) {
                this.macros[productionRule.macro] = {
                    args: productionRule.args,
                    exprs: productionRule.exprs
                };
            } else if ("config" in productionRule) {
                if (productionRule.config === 'lexer') {
                    this.config.lexer = productionRule.value;
                }
                if (productionRule.config === 'preprocessor' && typeof productionRule.value === 'string') {
                    this.config.preprocessor = productionRule.value;
                }
            } else {
                this.produceRules(productionRule.name, productionRule.rules, {});
                if (!this.start) {
                    this.start = productionRule.name;
                }
            }
        }
    }

    generate(exportName: string, preprocessor?: PreProcessor): string {
        if (!this.config.preprocessor) {
            this.config.preprocessor = "_default";
        }

        preprocessor = preprocessor || PreProcessors[this.config.preprocessor];

        if (!preprocessor) {
            throw new Error("No such preprocessor: " + this.config.preprocessor)
        }

        return preprocessor.preProcess(this, exportName);

    }

    private produceRules(name: string, rules: ProductionRuleRulesRule[], env: Dictionary<string>) {
        for (let i = 0; i < rules.length; i++) {
            const rule = this.buildRule(name, rules[i], env);
            if (this.args.nojs) {
                rule.postprocess = null;
            }
            this.rules.push(rule);
        }
    }

    private buildRule(ruleName, rule, env) {
        const tokens: RuleSymbol[] = [];
        for (let i = 0; i < rule.tokens.length; i++) {
            const token = this.buildToken(ruleName, rule.tokens[i], env);
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
                const name = token.token;
                if (!this.customTokens[name]) {
                    this.customTokens[name] = true;
                }
                const expr = this.config.lexer + ".has(" + JSON.stringify(name) + ") ? {type: " + JSON.stringify(name) + "} : " + name;
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

    private buildStringToken(ruleName: string, token: TokenLiteral, env) {
        const newname = this.unique(ruleName + "$string");
        this.produceRules(newname, [
            {
                tokens: token.literal.split("").map((d) => {
                    return { literal: d };
                }),
                postprocess: { builtin: "joiner" }
            }
        ], env);
        return newname;
    }

    private buildSubExpressionToken(ruleName: string, token: SubExpressionToken, env) {
        const data = token.subexpression;
        const name = this.unique(ruleName + "$subexpression");
        this.produceRules(name, data, env);
        return name;
    }

    private buildEBNFToken(ruleName: string, token: EBNFToken, env) {
        switch (token.modifier) {
            case ":+":
                return this.buildEBNFPlus(ruleName, token, env);
            case ":*":
                return this.buildEBNFStar(ruleName, token, env);
            case ":?":
                return this.buildEBNFOpt(ruleName, token, env);
        }
    }

    private buildEBNFPlus(ruleName: string, token: EBNFToken, env) {
        const name = this.unique(ruleName + "$ebnf");
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

    private buildEBNFStar(ruleName: string, token: EBNFToken, env) {
        const name = this.unique(ruleName + "$ebnf");
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

    private buildEBNFOpt(ruleName: string, token: EBNFToken, env) {
        const name = this.unique(ruleName + "$ebnf");
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

    private buildMacroCallToken(ruleName: string, token: MacroToken, env) {
        const name = this.unique(ruleName + "$macrocall");
        const macro = this.macros[token.macrocall];
        if (!macro) {
            throw new Error("Unkown macro: " + token.macrocall);
        }
        if (macro.args.length !== token.args.length) {
            throw new Error("Argument count mismatch.");
        }
        const newenv = { __proto__: env };
        for (let i = 0; i < macro.args.length; i++) {
            const argrulename = this.unique(ruleName + "$macrocall");
            newenv[macro.args[i]] = argrulename;
            this.produceRules(argrulename, [token.args[i]], env);
        }
        this.produceRules(name, macro.exprs, newenv);
        return name;
    }

    private unique(name: string) {
        const un = this._uniqueCache[name] = (this._uniqueCache[name] || 0) + 1;
        return name + '$' + un;

    }
}