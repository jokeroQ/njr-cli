const ora=require('ora')
let spinner=null

//开始加载动画
const startLoading=(message)=>{
    if(spinner){
        spinner.stop()
    }
    spinner=ora(message).start
}

//停止加载动画
const stopLoading=()=>{
    if(spinner){
        spinner.stop()
    }
}

//更新loading动画文字
const updateLoading=(message)=>{
    if(spinner){
        spinner.text=message
    }
}

module.exports={
    startLoading,
    stopLoading,
    updateLoading
}
