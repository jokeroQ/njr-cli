// template.js
const path = require('path')
const fs = require('fs-extra')
const tar = require('tar')
const chalk = require('chalk')
const { execSync } = require('child_process')
const {getOnlineVersion}=require('./utils')

const npmResitry = 'http://172.26.200.183:9081/repository/npm-group/'
const packageName = '@htf/templates'
const templatesDir = path.resolve(__dirname, '..', 'templates')
const templatesPackagePath = path.resolve(templatesDir, 'package.json')

//比较本地与最新模版包版本是否一致，检查是否需要更新模板包
const checkTemplateVersion=async()=> {
    try {
        const url = `${npmResitry}${packageName}`
        const latestVersion=await getOnlineVersion(url)
        const currentVersion=getTemplateVersion()
        if (currentVersion !== latestVersion||!currentVersion) {
            console.log(chalk.yellow(`监测到最新版本${packageName} ${latestVersion}`))
            return latestVersion
        }
        return null
    } catch (error) {
        console.error(chalk.red('获取最新版本信息出错:', error))
        return null
    }
}

//获取本地模版包版本
const getTemplateVersion=()=>{
    let currentVersion = ''
    try {
        if (fs.existsSync(templatesDir) && fs.existsSync(templatesPackagePath)) {
            const packageJsonPath = fs.readFileSync(templatesPackagePath, 'utf-8')
            currentVersion = JSON.parse(packageJsonPath).version
            return currentVersion
        } else {
            return null
        }
    } catch (error) {
        console.error(chalk.red('读取本地模版包失败'))
        return null
    }
}

//检查本地是否有templates文件夹，没有则创建一个
function checkAndCreateTemplatesDir() {
    if (!fs.existsSync(templatesDir)) {
        fs.mkdirSync(templatesDir)
    }
}

//通过`npm pack`获取远程包并下载到临时文件夹
const packTemplateAndgetPath=async(packageName)=> {
    try {
        const tmpDir = path.join(__dirname, 'tmp_templates')
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir)
        }
        console.log(chalk.yellow(`从npm下载模版包 ${packageName} ...`))
        execSync(`npm cache clean --force`,{stdio:'inherit'})
        execSync(`npm pack ${packageName} --registry=${npmResitry}`, { cwd: tmpDir, stdio: 'inherit' })
        const tgzFiles = fs.readdirSync(tmpDir).filter(file => file.startsWith('htf-templates-') && file.endsWith('.tgz'))
        if (tgzFiles.length === 0) {
            console.error(chalk.red('未找到对应模版包文件'))
            return
        }
        const tgzPath = path.join(tmpDir, tgzFiles[0])
        return tgzPath
    } catch (error) {
        console.error(chalk.red('更新模版包失败:', error))
    }
}

//解压tgz文件到本地templates目录
const extractTemplate=async(tgzPath)=> {
    try {
        console.log(chalk.yellow('正在解压模版包...'))
        await tar.x({
            file: tgzPath,
            C: templatesDir,
            strip: 1
        })
        console.log(chalk.yellow('模版解压成功'))
    } catch (error) {
        console.error(chalk.red('模版解压失败'))
    }
}

//删除临时文件
const cleanUpTemplates=(tgzPath)=> {
    try {
        fs.removeSync(tgzPath)
        const tempDir = path.dirname(tgzPath)
        fs.removeSync(tempDir)
    } catch (error) {
        console.error(chalk.red('删除临时文件失败', error))
    }
}

//读取模板文件夹下的模板
const getTemplateFolders=()=> {
    const files = fs.readdirSync(templatesDir)
    return files.filter(file => {
        const filePath = path.join(templatesDir, file)
        return fs.statSync(filePath).isDirectory() && file !== 'public'
    })
}

module.exports = {
    checkTemplateVersion,
    checkAndCreateTemplatesDir,
    packTemplateAndgetPath,
    extractTemplate,
    cleanUpTemplates,
    getTemplateFolders
}
