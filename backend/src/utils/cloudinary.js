/*
Context : Files are stored temporarily in server, 
        We need to store files to cloudinary from these temp. files

1. Configure cloudinary connection
2. Upload image to cloudinary
     if local file path is valid--> upload to cloudinary
     else delete local file.

*/


import fs from'fs'
import { v2 as cloudinary } from 'cloudinary';


// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_API_SECRET, 
    api_key: process.env.CLOUDINARY_CLOUD_NAME, 
    api_secret: process.env.CLOUDINARY_API_ENVIRONMENT_VARIABLE  // Click 'View API Keys' above to copy your API secret
});

// Upload an image
const uploadOnCloudinary = async (localfilePath) => {
    try{
        if (!localfilePath) return null
        //upload file in cloudinary
        const response = await cloudinary.uploader
        .upload(localfilePath, {
                resource_type: 'auto'
            
        })

        //file has been uploaded succesfully
        console.log('File uploaded on cloudinary', response.url) // response = {url, public_id, secure_url, format}
        
        return response

    } catch (error) {

        //remove the locally saved temporary file
        fs.unlinkSync(localfilePath)
        return null

    }
}

export {uploadOnCloudinary}

    
