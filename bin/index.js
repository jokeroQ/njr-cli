#!/usr/bin/env node

const { program } = require('commander')
const chalk = require('chalk')
const path = require('path')
const { compareToolVersion } = require('./version')
const { initProject } = require('./init')

// 获取项目根目录
const rootDir = path.resolve(__dirname, '..')

// 初始化项目命令
program.command('init')
    .description('Initialize a project with a selected template')
    .action(async () => {
        if (await compareToolVersion()) return
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
