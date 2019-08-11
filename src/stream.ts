import { Writable } from "stream";
// Node-only
export class StreamWrapper extends Writable {
    constructor(private parser) {
        super();
    }
    _write(chunk, _encoding, callback) {
        this.parser.feed(chunk.toString());
        callback();
    };
}
