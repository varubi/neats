import { Rule } from "./rule";
import { Dictionary, ParserRule, CompiledRules, Lexer } from "./common/types";

export class Grammar {
    byName: Dictionary<Rule[]> = {};
    start: string;
    lexer?: Lexer;
    constructor(private rules: Rule[], start?: string) {
        this.start = start || this.rules[0].name;
        this.rules.forEach((rule) => {
            this.byName[rule.name] = this.byName[rule.name] || [];
            this.byName[rule.name].push(rule);
        });
    }

    // So we can allow passing (rules, start) directly to Parser for backwards compatibility
    static fromCompiled(rules: CompiledRules | ParserRule[], start?: string): Grammar {
        let r: ParserRule[];
        if (!Array.isArray(rules)) {
            r = rules.ParserRules;
            start = rules.ParserStart;
        } else {
            r = rules;
        }
        const rs = r.map(r => new Rule(r.name, r.symbols, r.postprocess));
        var g = new Grammar(rs, start);
        if ('Lexer' in rules) {
            g.lexer = rules.Lexer;
        }
        return g;
    }
}

