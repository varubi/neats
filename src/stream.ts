// Node-only

var Writable = require('stream').Writable;
var util = require('util');

class StreamWrapper {
    constructor(private parser) {
        Writable.call(this);
    }
    _write(chunk, encoding, callback) {
        this.parser.feed(chunk.toString());
        callback();
    };
}
util.inherits(StreamWrapper, Writable);
export default StreamWrapper;
