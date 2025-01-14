// version.js
const request = require('axios')
const chalk = require('chalk')
const fs = require('fs-extra')
const path = require('path')

const npmResitry = 'http://172.26.200.183:9081/repository/npm-group/'
const cliName = "@htf/ubooter"
const packageJsonPath = path.join(__dirname, '..', 'package.json')

// 获取CLI工具当前版本
function getToolVersion() {
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
async function getLatestToolVersion() {
    const currentVersion = getToolVersion()
    try {
        const url = `${npmResitry}${cliName}`
        const response = await request(url)
        const data = response.data
        const latestVersion = data['dist-tags'].latest
        if (currentVersion !== latestVersion) {
            console.log(chalk.yellow(`监测到最新版本${cliName} ${latestVersion}`))
            return latestVersion
        }
        return null
    } catch (err) {
        console.error(chalk.red('获取最新版本信息出错:', err))
        return null
    }
}

module.exports = {
    getToolVersion,
    getLatestToolVersion
}
