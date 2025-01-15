// version.js
const chalk = require('chalk')
const fs = require('fs-extra')
const path = require('path')
const { getOnlineVersion } = require('./utils')

const npmResitry = 'http://172.26.200.183:9081/repository/npm-group/'
const cliName = "@htf/ubooter"
const packageJsonPath = path.join(__dirname, '..', 'package.json')

// 获取CLI工具当前版本
const getToolVersion=()=> {
    try {
        const packageJson = fs.readFileSync(packageJsonPath, 'utf-8')
        const { version } = JSON.parse(packageJson)
        return version
    } catch (error) {
        console.error(chalk.red('读取package.json失败：', error.message))
        return null
    }
}

// 获取CLI工具最新版本
const getLatestToolVersion=async()=> {
    try {
        const url = `${npmResitry}${cliName}`
        const latestVersion = await getOnlineVersion(url)
        return latestVersion
    } catch (err) {
        console.error(chalk.red('获取最新版本信息出错:', err))
        return null
    }
}
//新旧版本比较
const compareToolVersion = async () => {
    const latestVersion = await getLatestToolVersion()
    const currentVersion = getToolVersion()
    if (currentVersion !== latestVersion) {
        console.log(chalk.yellow(`监测到最新版本${cliName} ${latestVersion}`))
        console.log(chalk.yellow(`你的工具版本已过时，请更新到最新版本`))
        console.log(chalk.yellow(`运行 \`npm install -g ${cliName}\`已更新到最新版本`))
        return latestVersion
    }else{
        return null
    }
}

module.exports = {
    getToolVersion,
    getLatestToolVersion,
    compareToolVersion,
}
