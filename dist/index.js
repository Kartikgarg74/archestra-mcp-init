#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const generate_1 = require("./commands/generate");
const addTool_js_1 = require("./commands/addTool.js");
const program = new commander_1.Command();
program
    .name('archestra-mcp-init')
    .description('Generate production-ready MCP servers with Archestra-native patterns')
    .version('1.0.0');
program
    .command('generate')
    .alias('gen')
    .description('Generate a new MCP server project')
    .option('-n, --name <name>', 'Project name')
    .option('-l, --language <lang>', 'Language (typescript|python)', 'typescript')
    .option('-d, --directory <dir>', 'Output directory', '.')
    .option('--skip-install', 'Skip npm/pip install')
    .action(generate_1.generateCommand);
program
    .command('list-templates')
    .alias('ls')
    .description('List available templates')
    .action(() => {
    console.log(chalk_1.default.blue('\n📦 Available Templates:\n'));
    console.log(chalk_1.default.green('  • typescript') + chalk_1.default.gray(' - TypeScript/Node.js with FastMCP'));
    console.log(chalk_1.default.green('  • python') + chalk_1.default.gray(' - Python with FastMCP\n'));
    console.log(chalk_1.default.yellow('Usage: archestra-mcp-init generate -l typescript\n'));
});
program
    .command('add-tool')
    .alias('tool')
    .description('Add a new tool to an existing MCP server project')
    .option('-n, --name <name>', 'Tool name (camelCase)')
    .option('-t, --template <template>', 'Template (api-call|file-operation|database-query|custom)')
    .option('-l, --language <lang>', 'Language (typescript|python)')
    .action(addTool_js_1.addToolCommand);
// Default help
if (process.argv.length === 2) {
    program.help();
}
program.parse();
