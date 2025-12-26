const crible=(n)=>{
    let arr=[]
    for(let i=1;i<=n;i++){
        arr.push(i)
    }
    return arr
}
const estpremier=(n)=>{
    if(n<2){
        return false
    }
    for(let i=2;i<n;i++){
        if(n%i==0){
            return false
        }
    }
    return true
}
const crible2=(n)=>{
    let arr=crible(n)
    for(let i=0;i<arr.length;i++){
        if(!estpremier(arr[i])){
            arr.splice(i,1)
            i--
        }
    }
    return arr
}
console.log(crible2(1000))
const i=crible2(1000)[Math.floor(Math.random()*crible2(1000).length)]
const choix=crible2(i)[Math.floor(Math.random()*crible2(i).length)]
console.log(choix)
module.exports={estpremier,crible2,choix}