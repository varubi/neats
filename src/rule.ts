export class Rule {
    static highestId = 0;
    private id: number;
    constructor(private name, private symbols, public postprocess) {
        this.id = ++Rule.highestId;
    }


    toString(withCursorAt) {
        function stringifySymbolSequence(e) {
            return e.literal ? JSON.stringify(e.literal) :
                e.type ? '%' + e.type : e.toString();
        }
        var symbolSequence = (typeof withCursorAt === "undefined")
            ? this.symbols.map(stringifySymbolSequence).join(' ')
            : (this.symbols.slice(0, withCursorAt).map(stringifySymbolSequence).join(' ')
                + " ● "
                + this.symbols.slice(withCursorAt).map(stringifySymbolSequence).join(' '));
        return this.name + " → " + symbolSequence;
    }
}