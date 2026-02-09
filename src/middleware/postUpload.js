const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (_, __, cb) => {
    cb(null, 'uploads/posts');
  },

  filename: (_, file, cb) => {
    const name = Date.now() + path.extname(file.originalname);
    cb(null, name);
  },
});

module.exports = multer({ storage });