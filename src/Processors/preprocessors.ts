import { JavaScriptProcessor } from "./javascript-processor";
import { ESModule } from "./esmodule-processor";
import { CoffeeScriptProcessor } from "./coffeescript-processor";
import { TypeScriptProcessor } from "./typescript-processor";
import { Compiler } from "../compile";

export const PreProcessors: { [key: string]: PreProcessor } = {
    '_default': JavaScriptProcessor,
    'js': JavaScriptProcessor,
    'javascript': JavaScriptProcessor,
    'module': ESModule,
    'esmodule': ESModule,
    'cs': CoffeeScriptProcessor,
    'coffeescript': CoffeeScriptProcessor,
    'coffee': CoffeeScriptProcessor,
    'ts': TypeScriptProcessor,
    'typescript': TypeScriptProcessor
}

export interface PreProcessor {
    preProcess(compiler: Compiler, exportName: string): string;
    builtinPostprocessors?: {
        [key: string]: string;
    }
}