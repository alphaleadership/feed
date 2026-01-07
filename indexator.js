const fs = require('fs');
const path = require('path');
const varia=require("./eratos")
console.log(varia)
if(!fs.existsSync("./temp")){
    fs.mkdirSync("./temp")
}
var storage=fs.readdirSync("./temp")
if(storage.length>varia.choix){
    fs.readdirSync("./temp").forEach(file => {
        fs.readdirSync("./temp/"+file).forEach(file2 => {
            console.log(path.join("./temp",file,file2))
            fs.unlinkSync("./temp/"+file+"/"+file2)
        })
        fs.rmdirSync("./temp/"+file)
    });
    fs.rmdirSync("./temp")

} 