const crypto = require("crypto")


let key1 = crypto.randomBytes(32).toString('hex')
let key2 = crypto.randomBytes(32).toString('hex')

console.table({key1,key2})