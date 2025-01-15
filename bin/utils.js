const request = require('axios')
const chalk = require('chalk')

//获取指定npm包路径的线上版本
const getOnlineVersion = async (url) => {
    try {
        const res = await request(url)
        const data = res.data
        const latestVersion = data['dist-tags'].latest
        return latestVersion
    } catch (error) {
        console.error(chalk.red('获取最新版本信息出错:', error))
        return null
    }
}

module.exports={
    getOnlineVersion
}