// init.js
const inquirer = require('inquirer')
const path = require('path')
const fs = require('fs-extra')
const chalk = require('chalk')
const { checkTemplateVersion, checkAndCreateTemplatesDir, packTemplateAndgetPath, extractTemplate, cleanUpTemplates, getTemplateFolders } = require('./template')

const prompt = inquirer.createPromptModule()
const packageName = '@htf/templates'

//首先检查并更新模版包
const checkAndUpdateTemplate=async()=>{
    //保证有存放模板的文件夹
    checkAndCreateTemplatesDir()
    const newVersion = await checkTemplateVersion()
    if (newVersion) {
        console.log(chalk.yellow(`下载并更新包${packageName}到最新版本`))
        const tgzPath = await packTemplateAndgetPath('@htf/templates')
        await extractTemplate(tgzPath)
        cleanUpTemplates(tgzPath)
    } else {
        console.log(chalk.yellow('使用本地已有模版包'))
    }
}

const initProject=async(rootDir)=> {
    //首先检查并更新模版包
    await checkAndUpdateTemplate()
    const templateFolers = getTemplateFolders()
    if (templateFolers.length === 0) {
        console.log(chalk.red('无模板可用'))
        return
    }

    const { projectName } = await prompt([{
        type: 'input',
        name: 'projectName',
        message: 'What is the name of your project?',
        validate(input) {
            if (!input) {
                return 'Project name cannot be empty'
            }
            return true
        }
    }])

    const { template } = await prompt([{
        type: 'list',
        name: 'template',
        message: 'Which template would you like to use?',
        choices: templateFolers
    }])

    console.log(chalk.green(`You selected the "${template}" template.`))

    const targetDir = path.join(process.cwd(), projectName)

    if (fs.existsSync(targetDir)) {
        console.error(chalk.red(`Project directory "${projectName}" already exists`))
        return
    }

    try {
        console.log(chalk.blue(`Initializing project in "${targetDir}"...`))
        fs.copySync(path.join(rootDir, 'templates', template), targetDir)
        console.log(chalk.blue(`Project "${projectName}" initialized using "${template}" template.`))
    } catch (error) {
        console.error(chalk.red('Error initializing the project:', error.message))
    }
}

module.exports = {
    initProject
}
