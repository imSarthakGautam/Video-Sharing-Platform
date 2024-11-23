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
import { ApiError } from './ApiError.js';


// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET  
    // Click 'View API Keys' above to copy your API secret
});

// Upload an image
const uploadOnCloudinary = async (localfilePath) => {
    try{
        if (!localfilePath) return null
        //upload file in cloudinary
        //console.log('uploading to cloudinary next...', localfilePath)
        const response = await 
        cloudinary.uploader.upload(localfilePath, {
                resource_type: 'auto'
            })

        //file has been uploaded succesfully
        console.log('File uploaded on cloudinary', response.url) 
        // response = {url, public_id, secure_url, format}
        fs.unlinkSync(localfilePath)
        return response

    } catch (error) {

        //remove the locally saved temporary file
        fs.unlinkSync(localfilePath)
        return null

    }
}

// Delete a file from Cloudinary
const deleteFromCloudinary = async (publicId) => {
    try {
        if (!publicId) {
            throw new ApiError(400, "Public ID is required for deletion");
        }
        console.log('Inside deleteFromCloudinary function publicId recieved is: \n',publicId)
        const result = await cloudinary.uploader.destroy(publicId);
        console.log(result)
        if (result.result !== 'ok') {
            throw new ApiError(500, "Failed to delete file from Cloudinary");
        }
        console.log('File deleted from Cloudinary:', result);
        return result;
    } catch (error) {
        console.error('Error deleting from Cloudinary:', error.message);
        throw new ApiError(500, "Failed to delete file from Cloudinary");
    }
};

const deleteVideoFromCloudinary = async (publicId) => {
    if (!publicId) {
        throw new ApiError(400, "Public ID is required for deletion");
    }

    try {
        console.log('Attempting to delete file from Cloudinary with public_id:', publicId);

        // Specify the resource_type as 'video' and type as 'upload' (unless using authenticated upload)
        const result = await cloudinary.uploader.destroy(publicId, { 
            resource_type: 'video',
            type: 'upload' // or 'authenticated', depending on your upload settings
        });

        console.log('Full Cloudinary delete response:', result);
        
        if (result.result === 'not found') {
            throw new ApiError(404, "File not found on Cloudinary with the provided public_id");
        }

        if (result.result === 'ok') {
            console.log('File successfully deleted from Cloudinary:', result);
        } else {
            throw new ApiError(500, "Failed to delete file from Cloudinary");
        }

        return result;
    } catch (error) {
        console.error('Error deleting from Cloudinary:', error.message);
        throw new ApiError(500, "Failed to delete file from Cloudinary");
    }
};


export {uploadOnCloudinary, deleteFromCloudinary, deleteVideoFromCloudinary}

    
