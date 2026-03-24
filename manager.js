const data =require("./source/_data/breaches.json")
const fs =require("fs")
fs.writeFileSync("./data.txt","")
data.breaches.filter((item)=>{
    return !item.IsRetired
}).map
((item)=>{
    fs.appendFileSync("./data.txt", `${item.Name}:${item.slug}\n`)
})
