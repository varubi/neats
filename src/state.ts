import { Parser } from "./parser";


export class State {
    data = [];
    isComplete: boolean;
    public left: State;
    public right: State;

    constructor(private rule, private dot, private reference, private wantedBy) {
        this.isComplete = this.dot === rule.symbols.length;
    }

    toString() {
        return "{" + this.rule.toString(this.dot) + "}, from: " + (this.reference || 0);
    };

    nextState(child) {
        var state = new State(this.rule, this.dot + 1, this.reference, this.wantedBy);
        state.left = this;
        state.right = child;
        if (state.isComplete) {
            state.data = state.build();
        }
        return state;
    };

    build() {
        let children = [];
        let node: State = this;
        do {
            children.push(node.right.data);
            node = node.left;
        } while (node.left);
        children.reverse();
        return children;
    };

    finish() {
        if (this.rule.postprocess) {
            this.data = this.rule.postprocess(this.data, this.reference, Parser.fail);
        }
    }
}
