import { PreProcessor, Generate } from "../generate";
import { JavaScriptProcessor } from "./javascript-processor";


export const ESModule: PreProcessor = {
    Preprocess(parser, exportName) {
        var output = "// Generated automatically by nearley, version " + parser.version + "\n";
        output += "// http://github.com/Hardmath123/nearley\n";
        output += "function id(x) { return x[0]; }\n";
        output += parser.body.join('\n');
        output += "let Lexer = " + parser.config.lexer + ";\n";
        output += "let ParserRules = " + Generate.serializeRules(parser.rules, JavaScriptProcessor.builtinPostprocessors) + ";\n";
        output += "let ParserStart = " + JSON.stringify(parser.start) + ";\n";
        output += "export default { Lexer, ParserRules, ParserStart };\n";
        return output;
    }
}
