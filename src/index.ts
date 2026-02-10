#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { generateCommand } from './commands/generate';

const program = new Command();

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
  .action(generateCommand);

program
  .command('list-templates')
  .alias('ls')
  .description('List available templates')
  .action(() => {
    console.log(chalk.blue('\n📦 Available Templates:\n'));
    console.log(chalk.green('  • typescript') + chalk.gray(' - TypeScript/Node.js with FastMCP'));
    console.log(chalk.green('  • python') + chalk.gray(' - Python with FastMCP\n'));
    console.log(chalk.yellow('Usage: archestra-mcp-init generate -l typescript\n'));
  });

// Default help
if (process.argv.length === 2) {
  program.help();
}

program.parse();
