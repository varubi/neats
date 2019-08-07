import { PreProcessor } from "./preprocessors";
import { JavaScriptProcessor } from './javascript-processor';
import { serializeRules } from '../common/util';


export const ESModule: PreProcessor = {
    preProcess(compiler, _exportName) {
        return `// Generated automatically by nearley, version ` + compiler.version + `\n`
            + `// http://github.com/Hardmath123/nearley\n`
            + `function id(x) { return x[0]; }\n`
            + compiler.body.join('\n')
            + `let Lexer = ${compiler.config.lexer}\n`
            + `let ParserRules = ${serializeRules(compiler.rules, JavaScriptProcessor.builtinPostprocessors)}\n`
            + `let ParserStart = ${JSON.stringify(compiler.start)}\n`
            + `export default { Lexer, ParserRules, ParserStart };\n`;
    }
}
