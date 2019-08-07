import { PostProcessor } from "./common/types";

export class Rule {
    static highestId = 0;
    id: number;

    constructor(public name: string, private symbols: (string | RegExp)[], public postprocess?: PostProcessor | null) {
        this.id = ++Rule.highestId;
    }

    toString(withCursorAt?: number): string {
        function stringifySymbolSequence(e) {
            return e.literal ? JSON.stringify(e.literal) :
                e.type ? '%' + e.type : e.toString();
        }
        var symbolSequence: string = (typeof withCursorAt === "undefined")
            ? this.symbols.map(stringifySymbolSequence).join(' ')
            : (this.symbols.slice(0, withCursorAt).map(stringifySymbolSequence).join(' ')
                + " ● "
                + this.symbols.slice(withCursorAt).map(stringifySymbolSequence).join(' '));
        return this.name + " → " + symbolSequence;
    }
}