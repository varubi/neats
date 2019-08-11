// Node-only

function warn(opts, str) {
    opts.out.write("WARN" + "\t" + str + "\n");
}

function lintNames(grm, opts) {
    const all: string[] = grm.rules.map(r => r.name);
    grm.rules.forEach((rule) =>
        rule.symbols.forEach((symbol) => {
            if (!symbol.literal && !symbol.token && symbol.constructor !== RegExp) {
                if (all.indexOf(symbol) === -1) {
                    warn(opts, "Undefined symbol `" + symbol + "` used.");
                }
            }
        }));
}

export function lint(grm, opts) {
    if (!opts.out) opts.out = process.stderr;
    lintNames(grm, opts);
}

