import { PreProcessor, serializeRules } from '../generate';
import { JavaScriptProcessor } from './javascript-processor';


export const ESModule: PreProcessor = {
    preProcess(parser, _exportName) {
        return `// Generated automatically by nearley, version ` + parser.version + `\n`
            + `// http://github.com/Hardmath123/nearley\n`
            + `function id(x) { return x[0]; }\n`
            + parser.body.join('\n')
            + `let Lexer = ${parser.config.lexer}\n`
            + `let ParserRules = ${serializeRules(parser.rules, JavaScriptProcessor.builtinPostprocessors)}\n`
            + `let ParserStart = ${JSON.stringify(parser.start)}\n`
            + `export default { Lexer, ParserRules, ParserStart };\n`;
    }
}
