import multer from 'multer'

//disk Storage
const storage = multer.diskStorage({

    // 2 options destination & filename
    destination: function (req, file, cb) { //cb=callback
      cb(null, "./public/temp")
    },

    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, file.originalname + '-' + uniqueSuffix)
    }
  })
  
  const upload = multer({ storage })
  export {upload}