#!/usr/bin/env node

const { program } = require('commander')
const chalk = require('chalk')
const path = require('path')
const { getLatestToolVersion } = require('./version')
const { initProject } = require('./init')

// 获取项目根目录
const rootDir = path.resolve(__dirname, '..')
const cliName = "@htf/ubooter"

// 检查CLI工具版本
async function checkToolVersion() {
    const cliVersion = await getLatestToolVersion()
    if (cliVersion) {
        console.log(chalk.yellow(`你的工具版本已过时，请更新到最新版本`))
        console.log(chalk.yellow(`运行 \`npm install -g ${cliName}\`已更新到最新版本`))
        return true
    }
    return false
}

// 初始化项目命令
program.command('init')
    .description('Initialize a project with a selected template')
    .action(async () => {
        if (await checkToolVersion()) return
        initProject(rootDir)  // 传入项目根目录路径
    })

// 在命令行工具中加入帮助选项
program.command('help')
    .description('Show help information about the command')
    .action(() => {
        console.log(chalk.blue('Displaying help information for the commands...'))
        program.outputHelp()
    })

// 定义CLI工具的版本
program.version(require('../package.json').version)

program.parse(process.argv)
