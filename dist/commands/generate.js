"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCommand = generateCommand;
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const path_1 = __importDefault(require("path"));
const templates_1 = require("../templates");
const fileGenerator_1 = require("../utils/fileGenerator");
async function generateCommand(options) {
    console.log(chalk_1.default.blue('\n🚀 Archestra MCP Server Generator\n'));
    // Interactive prompts if options not provided
    const answers = await inquirer_1.default.prompt([
        {
            type: 'input',
            name: 'name',
            message: 'Project name:',
            default: options.name || 'my-archestra-mcp-server',
            when: !options.name
        },
        {
            type: 'list',
            name: 'language',
            message: 'Choose language:',
            choices: ['typescript', 'python'],
            default: options.language || 'typescript',
            when: !options.language
        },
        {
            type: 'input',
            name: 'description',
            message: 'Project description:',
            default: 'An Archestra-native MCP server'
        },
        {
            type: 'input',
            name: 'author',
            message: 'Author name:',
            default: ''
        },
        {
            type: 'confirm',
            name: 'includeObservability',
            message: 'Include Prometheus metrics and logging?',
            default: true
        },
        {
            type: 'confirm',
            name: 'includeSecurity',
            message: 'Include Archestra security patterns (Dual LLM hooks)?',
            default: true
        }
    ]);
    const config = {
        name: options.name || answers.name,
        language: options.language || answers.language,
        directory: options.directory || '.',
        description: answers.description,
        author: answers.author,
        includeObservability: answers.includeObservability,
        includeSecurity: answers.includeSecurity,
        skipInstall: options.skipInstall || false
    };
    const projectPath = path_1.default.resolve(config.directory, config.name);
    // Check if directory exists
    if (await (0, fileGenerator_1.createDirectory)(projectPath)) {
        const { overwrite } = await inquirer_1.default.prompt([{
                type: 'confirm',
                name: 'overwrite',
                message: `Directory ${config.name} exists. Overwrite?`,
                default: false
            }]);
        if (!overwrite) {
            console.log(chalk_1.default.yellow('\n⚠️  Aborted. Use a different name.\n'));
            return;
        }
    }
    console.log(chalk_1.default.blue(`\n📁 Creating project: ${config.name}`));
    console.log(chalk_1.default.gray(`   Location: ${projectPath}\n`));
    try {
        // Create project directory
        await (0, fileGenerator_1.createDirectory)(projectPath);
        // Generate based on language
        if (config.language === 'typescript') {
            await (0, templates_1.generateTypeScriptProject)(projectPath, config);
        }
        else if (config.language === 'python') {
            await (0, templates_1.generatePythonProject)(projectPath, config);
        }
        console.log(chalk_1.default.green('\n✅ Project generated successfully!\n'));
        console.log(chalk_1.default.blue('Next steps:'));
        console.log(chalk_1.default.white(`  cd ${config.name}`));
        if (config.language === 'typescript') {
            console.log(chalk_1.default.white('  npm install'));
            console.log(chalk_1.default.white('  npm run build'));
            console.log(chalk_1.default.white('  npm start\n'));
        }
        else {
            console.log(chalk_1.default.white('  python -m venv venv'));
            console.log(chalk_1.default.white('  source venv/bin/activate  # Windows: venv\\Scripts\\activate'));
            console.log(chalk_1.default.white('  pip install -r requirements.txt'));
            console.log(chalk_1.default.white('  python src/server.py\n'));
        }
        console.log(chalk_1.default.yellow('📚 Documentation:'));
        console.log(chalk_1.default.gray('  • README.md - Getting started guide'));
        console.log(chalk_1.default.gray('  • ARCHESTRA.md - Archestra integration guide'));
        console.log(chalk_1.default.gray('  • src/tools/ - Add your MCP tools here\n'));
    }
    catch (error) {
        console.error(chalk_1.default.red('\n❌ Error generating project:'), error);
        process.exit(1);
    }
}
