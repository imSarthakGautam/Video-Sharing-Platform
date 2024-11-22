
express file upload /or/  multer

file--> upload via multer--->temp local storage---> upload to  cloudinary --> server

# Multer
- Multer is a popular Node.js middleware for handling file uploads. It simplifies the process of receiving and storing files in your Node.js applications.

- diskStorage is a configuration option provided by Multer to specify how files should be stored on the disk. It allows you to customize the 
    - destination directory and 
    - filename for each uploaded file.

    ```js
    const multer = require('multer');

    const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Specify the destination   
    directory
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`); // Generate a unique filename
    }
    });

    // sets up MIDDLEWARE for handling multipart/form-data : for uploading files.

    const upload = multer({ storage:   
    storage });
    ```

- To use it with `upload` middleware :

- Upload Methods

    ```js
    app.post('/upload' ,upload.single('username'), (req,res)=>{})
    ```
    ```js
    //similarly
    upload.array('photos',5) 
    upload.feilds([ {name: 'image_galary', maxCount: 3}])
    ```

- Multer adds file/files object to request object. and from `req.file.path` you get `localFilePath`
    ```js
    req.body = { textfeildValues, }
    req.file= { files_Uploaded_via_form}
    ```

- Acess Methods
    ```js
    // for single file
    let file = req.file
    
     if (file) {
    const originalname = file.originalname;
    const mimetype = file.mimetype;
    const size = file.size;
    const path = file.path;
     }

     // for multiple files in array:
     const files = req.files;

     if (files.length > 0) {
        files.forEach(file => {
        const originalname = file.originalname;
        const mimetype = file.mimetype;
        const size = file.size;
        const path = file.path;

    // for file uploads in feilds
    const images = req.files.images_gallery;

     if (images.length > 0) {
      images.forEach(image => {
      const originalname = image.originalname;
      const mimetype = image.mimetype;
      const size = image.size;
      const path = image.path;

      // or instead of forEach  req.files.image-gallery[0].path
    ```
    This path is served as parameter to upload file on cloudinary.

- In Frontend whenever file input is taken, for form
    ```html
    <form ecrypte= multipart/form-data >
    ``` 


For handling file system:
fs.

## Cloudinary

- configure Cloudinary after setting up it's secret keys (which you get after creating an acccount)

