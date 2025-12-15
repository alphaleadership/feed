const fs = require('fs');
const path = require('path');

var storage=fs.readdirSync("./temp")
if(storage.length>1000){
    fs.readdirSync("./temp").forEach(file => {
        fs.readdirSync("./temp/"+file).forEach(file2 => {
            console.log(path.join("./temp",file,file2))
            fs.unlinkSync("./temp/"+file+"/"+file2)
        })
        fs.rmdirSync("./temp/"+file)
    });
    fs.rmdirSync("./temp")

}