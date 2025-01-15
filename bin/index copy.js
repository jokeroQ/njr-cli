#!/usr/bin/env node
const { program } = require('commander')
const inquirer = require('inquirer')
const path = require('path')
const fs = require('fs-extra')
const chalk = require('chalk')
const { execSync } = require('child_process')
const request = require('axios')
const tar = require('tar')

//要检查的包名称
const packageName = '@htf/templates'

//CLI工具包
const cliName = "@htf/ubooter"

const prompt = inquirer.createPromptModule()

//定义本地npm包路径
const templatesDir = path.resolve(__dirname,'..', 'templates')
const templatesPackagePath = path.resolve(templatesDir,'..', 'package.json')
const npmResitry='http://172.26.200.183:9081/repository/npm-group/'

//检查本地模版包是否为最新
async function checkLocalTemplateVersion() {
    let currentVersion = ''
    try {
        if (fs.existsSync(templatesDir) && fs.existsSync(templatesPackagePath)) {
            const packageJsonPath = fs.readFileSync(templatesPackagePath, 'utf-8')
            currentVersion = JSON.parse(packageJsonPath).version
        } else {
            return 1
        }
    } catch (error) {
        console.error(chalk.red('读取本地模版包失败'))
    }

    try {
        //此处url包地址需要动态更换调整
        const url = `${npmResitry}${packageName}`
        return request(url).then((resp) => {
            const data = resp.data
            const latestVersion = data['dist-tags'].latest
            if (currentVersion !== latestVersion) {
                console.log(chalk.yellow(`监测到最新版本${packageName}${latestVersion}`))
                return latestVersion
            } else {
                return null
            }
        }).catch((err => {
            console.error(chalk.red('获取最新版本信息出错:', err))
        }))
    } catch (error) {
        console.error(chalk.red('获取最新模版包失败：', error))
    }
}

//检查本地是否有templates文件夹
function checkAndCreateTemplatesDir() {
    if (!fs.existsSync(templatesDir)) {
        fs.mkdirSync(templatesDir)
    }
}

//通过`npm pack` 获取远程包并解压
async function packTemplate(packageName) {
    try {
        //创建临时目录
        const tmpDir = path.join(__dirname, '..','tmp_templates')
        if (!fs.existsSync) {
            fs.mkdirSync(tmpDir)
        }
        console.log(chalk.yellow(`从npm下载模版包${packageName}...`))
        execSync(`npm cache clean --force`,{stdio:'inherit'})
        execSync(`npm pack ${packageName} --registry=${npmResitry}`, { cwd: tmpDir, stdio: 'inherit' })
        const tgzFiles = fs.readdirSync(tmpDir).filter(file => file.startsWith('htf-templates-') && file.endsWith('.tgz'))
        if (tgzFiles.length === 0) {
            console.error(chalk.red('未找到对应模版包文件'))
            return
        }
        const tgzPath = path.join(tmpDir, tgzFiles[0])
        return tgzPath;
    } catch (error) {
        console.error(chalk.red('更新模版包失败:', error))
    }
}

//解压tgz文件到本地templates目录
async function extractTmeplate(tgzPath) {
    try {
        console.log(chalk.yellow('正在解压模版包...'))
        await tar.x({
            file: tgzPath,
            //解压到templates目录
            C: templatesDir,
            strip: 1
        })
        console.log(chalk.yellow('模版解压成功'))
    } catch (error) {
        console.error(chalk.red('模版解压失败'))
    }
}

//删除临时文件
function cleanUpTemplates(tgzPath) {
    try {
        //删除tgz文件
        fs.removeSync(tgzPath)
        //删除临时文件夹
        const tempDir = path.dirname(tgzPath)
        fs.removeSync(tempDir)
    } catch (error) {
        console.error(chalk.red('删除临时文件失败', error))
    }
}

//读取模版文件夹
function getTemplateFolders() {
    //读取templates目录中的所有文件
    const files = fs.readdirSync(templatesDir)
    //过滤掉名为"public"的文件夹
    return files.filter(file => {
        const filePath = path.join(templatesDir, file)
        return fs.statSync(filePath).isDirectory() && file !== 'public'
    })
}

async function initProject() {
    const cliVersion=await getLatestToolVersion()
    if(cliVersion){
        console.log(chalk.yellow(`你的工具版本已过时，请更新到最新版本`))
        console.log(chalk.yellow(`运行 \`npm install -g ${cliName}\`已更新到最新版本`))
        return;
    }
    //首先检查并更新模版包
    checkAndCreateTemplatesDir()
    const newVersion = await checkLocalTemplateVersion()
    if (newVersion) {
        console.log(chalk.yellow(`下载并更新包${packageName}到最新版本`))
        const tgzPath = await packTemplate(packageName)
        await extractTmeplate(tgzPath)
        cleanUpTemplates(tgzPath)
    } else {
        console.log(chalk.yellow('使用本地已有模版包'))
    }
    const templateFolers = getTemplateFolders()
    if (templateFolers.length === 0) {
        console.log(chalk.red('无模板可用'))
        return
    }

    //第一步：询问项目名称
    const { projectName } = await prompt([
        {
            type: 'input',
            name: 'projectName',
            message: 'What is the name of your project?',
            validate(input) {
                if (!input) {
                    return 'Project name cannot be empty'
                }
                return true
            }
        }
    ])

    //第二步：选择模版
    const { template } = await prompt([
        {
            type: 'list',
            name: 'template',
            message: 'Which template would you like to use?',
            choices: templateFolers
        }
    ])

    console.log(chalk.green(`You selected the "${template}" template.`))

    //创建目标项目目录
    const targetDir = path.join(process.cwd(), projectName)

    //检查目标路径是否存在
    if (fs.existsSync(targetDir)) {
        console.error(chalk.red(`Project directory "${projectName}" already exsits`))
        return
    }

    //使用fs-extra拷贝模板到目标路径
    try {
        console.log(chalk.blue(`Initializing project in "${targetDir}"...`))
        fs.copySync(path.join(templatesDir, template), targetDir)
        console.log(chalk.blue(`Initializing project "${projectName}" using ${template}...`))
    } catch (error) {
        console.error(chalk.red('Error Initializing the project:', error.message))
    }
}

//动态获取CLI工具的版本号
function getToolVersion() {
    try {
        const packageJsonPath = path.join(__dirname,'..', 'package.json')
        const packageJson = fs.readFileSync(packageJsonPath, 'utf-8')
        const { version } = JSON.parse(packageJson)
        return version
    } catch (error) {
        console.error(chalk.red('读取package.json失败：', error.message))
        return null
    }
}

//获取CLI工具最新版本号
async function getLatestToolVersion() {
    let currentVersion=getToolVersion()
    try {
        const url=`${npmResitry}${cliName}`
        return request(url).then((resp) => {
            const data = resp.data
            const latestVersion = data['dist-tags'].latest
            if (currentVersion !== latestVersion) {
                console.log(chalk.yellow(`监测到最新版本${cliName}${latestVersion}`))
                return latestVersion
            } else {
                return null
            }
        }).catch((err => {
            console.error(chalk.red('获取最新版本信息出错:', err))
        }))
    } catch (error) {
        console.error(chalk.red('获取最新CLI包出错:', err))
    }
}

//初始化功能
program.command('init')
    .description('Initialize a project with a selected template')
    .action(initProject)

//在命令行工具中加入帮助选项
program.command('help')
    .description('Show help information about the command')
    .action(() => {
        console.log(chalk.blue('Displaying help information for the commands...'))
        program.outputHelp()
    })

//定义CLI工具的版本
program.version(getToolVersion())
program.parse(process.arg)