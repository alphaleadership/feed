const fs =require('fs');
const path = require('path');
fs.readdirSync('./source/_posts', { withFileTypes: true,recursive: true }).forEach(file => {
  if (file.isFile() && path.extname(file.name) === '.md') {
    if (!fs.existsSync(path.join(__dirname, 'archive'))) {
      fs.mkdirSync(path.join(__dirname, 'archive'));
    }
    if(file.name.includes('temp.md')) {
      return;
    }
    console.log(`Moving file: ${JSON.stringify(file)}`);
    const oldPath = path.join(__dirname,file.parentPath, file.name);
    const newPath = path.join(__dirname,  'archive', file.name);
    fs.renameSync(oldPath, newPath);
  }
});
