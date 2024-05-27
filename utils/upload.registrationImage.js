var multer = require('multer')
const path = require("path")
const fs = require("fs")


const destinationFolder = path.join(__dirname, '../registrationImages/');
if (!fs.existsSync(destinationFolder)) {
    fs.mkdirSync(destinationFolder, { recursive: true });
}

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, destinationFolder);
    },
    filename: function (req, file, cb) {
        
        
        cb(null, Math.random() * 9999 + 9999 + '.' + file.originalname.split('.').pop());
        
    }
})
module.exports = multer({ storage })