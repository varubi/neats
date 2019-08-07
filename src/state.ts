import { Parser } from "./parser";
import { Token } from "./common/types";


export class State {
    data: StateData = [];
    isComplete: boolean;
    public left?: State;
    public right?: StateRight | State;

    constructor(
        public rule,
        public dot,
        public reference,
        public wantedBy: State[]
    ) {
        this.isComplete = this.dot === rule.symbols.length;
    }

    toString(): string {
        return "{" + this.rule.toString(this.dot) + "}, from: " + (this.reference || 0);
    };

    nextState(child: StateRight | State): State {
        var state = new State(this.rule, this.dot + 1, this.reference, this.wantedBy);
        state.left = this;
        state.right = child;
        if (state.isComplete) {
            state.data = state.build();
        }
        return state;
    };

    build(): StateData[] {
        let children: StateData[] = [];
        let node: State | undefined = this;
        do {
            children.push(node!.right!.data);
            node = node.left;
        } while (node && node.left);
        children.reverse();
        return children;
    };

    finish(): void {
        if (this.rule.postprocess) {
            this.data = this.rule.postprocess(this.data, this.reference, Parser.fail);
        }
    }
}

export type StateData = any;
export interface StateRight {
    data: StateData,
    token: Token,
    isToken: boolean,
    reference: number;
}