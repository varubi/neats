import { Parser } from "./parser";
import { State, StateRight } from "./state";
import { Grammar } from "./grammar";
import { Dictionary, LexerState } from "./common/types";

export class Column {
    states: State[] = [];
    wants: Dictionary<State[]> = {};
    scannable: State[] = [];
    completed: Dictionary<State[]> = {};
    lexerState?: LexerState;

    constructor(private grammar: Grammar, public index: number) { }

    process() {
        for (let w = 0; w < this.states.length; w++) { // nb. we push() during iteration
            const state = this.states[w];

            if (state.isComplete) {
                state.finish();
                if (state.data !== Parser.fail) {
                    // complete
                    const wantedBy = state.wantedBy;
                    for (let i = wantedBy.length; i--;) { // this line is hot
                        const left = wantedBy[i];
                        this.complete(left, state);
                    }

                    // special-case nullables
                    if (state.reference === this.index) {
                        // make sure future predictors of this rule get completed.
                        const name = state.rule.name;
                        (this.completed[name] = this.completed[name] || []).push(state);
                    }
                }

            } else {
                // queue scannable states
                const name = state.rule.symbols[state.dot];
                if (typeof name !== 'string') {
                    this.scannable.push(state);
                    continue;
                }

                // predict
                if (this.wants[name]) {
                    this.wants[name].push(state);

                    if (this.completed.hasOwnProperty(name)) {
                        const nulls = this.completed[name];
                        for (let i = 0; i < nulls.length; i++) {
                            const right = nulls[i];
                            this.complete(state, right);
                        }
                    }
                } else {
                    this.wants[name] = [state];
                    this.predict(name);
                }
            }
        }
    }

    predict(name: string) {
        const rules = this.grammar.byName[name] || [];
        for (let i = 0; i < rules.length; i++) {
            this.states.push(new State(rules[i], 0, this.index, this.wants[name]));
        }
    }

    complete(left: State, right: StateRight | State) {
        const copy = left.nextState(right);
        this.states.push(copy);
    }

}
