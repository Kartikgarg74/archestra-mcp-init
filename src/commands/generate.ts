import inquirer from 'inquirer';
import chalk from 'chalk';
import path from 'path';
import { generateTypeScriptProject, generatePythonProject } from '../templates';
import { createDirectory } from '../utils/fileGenerator';

interface GenerateOptions {
  name?: string;
  language?: string;
  directory?: string;
  skipInstall?: boolean;
}

export async function generateCommand(options: GenerateOptions) {
  console.log(chalk.blue('\n🚀 Archestra MCP Server Generator\n'));

  // Interactive prompts if options not provided
  const answers = await inquirer.prompt([
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

  const projectPath = path.resolve(config.directory, config.name);

  // Check if directory exists
  if (await createDirectory(projectPath)) {
    const { overwrite } = await inquirer.prompt([{
      type: 'confirm',
      name: 'overwrite',
      message: `Directory ${config.name} exists. Overwrite?`,
      default: false
    }]);

    if (!overwrite) {
      console.log(chalk.yellow('\n⚠️  Aborted. Use a different name.\n'));
      return;
    }
  }

  console.log(chalk.blue(`\n📁 Creating project: ${config.name}`));
  console.log(chalk.gray(`   Location: ${projectPath}\n`));

  try {
    // Create project directory
    await createDirectory(projectPath);

    // Generate based on language
    if (config.language === 'typescript') {
      await generateTypeScriptProject(projectPath, config);
    } else if (config.language === 'python') {
      await generatePythonProject(projectPath, config);
    }

    console.log(chalk.green('\n✅ Project generated successfully!\n'));

    console.log(chalk.blue('Next steps:'));
    console.log(chalk.white(`  cd ${config.name}`));

    if (config.language === 'typescript') {
      console.log(chalk.white('  npm install'));
      console.log(chalk.white('  npm run build'));
      console.log(chalk.white('  npm start\n'));
    } else {
      console.log(chalk.white('  python -m venv venv'));
      console.log(chalk.white('  source venv/bin/activate  # Windows: venv\\Scripts\\activate'));
      console.log(chalk.white('  pip install -r requirements.txt'));
      console.log(chalk.white('  python src/server.py\n'));
    }

    console.log(chalk.yellow('📚 Documentation:'));
    console.log(chalk.gray('  • README.md - Getting started guide'));
    console.log(chalk.gray('  • ARCHESTRA.md - Archestra integration guide'));
    console.log(chalk.gray('  • src/tools/ - Add your MCP tools here\n'));

  } catch (error) {
    console.error(chalk.red('\n❌ Error generating project:'), error);
    process.exit(1);
  }
}
