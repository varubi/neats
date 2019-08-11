import { Parser } from "./parser";
import { Token } from "./common/types";
import { Rule } from "./rule";

export class State {
    data: StateData = [];
    isComplete: boolean;
    left?: State;
    right?: StateRight | State;

    constructor(
        public rule: Rule,
        public dot: number,
        public reference: number,
        public wantedBy: State[]
    ) {
        this.isComplete = this.dot === rule.symbols.length;
    }


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

    finish() {
        if (this.rule.postprocess)
            this.data = this.rule.postprocess(this.data, this.reference, Parser.fail);
    }
}

export type StateData = any;
export interface StateRight {
    data: StateData,
    token: Token,
    isToken: boolean,
    reference: number;
}