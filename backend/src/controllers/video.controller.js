import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import { User } from '../models/user.model.js'
import { Video } from '../models/video.model.js'
import { deleteFromCloudinary, uploadOnCloudinary, deleteVideoFromCloudinary } from '../utils/cloudinary.js'
import {ApiResponse} from '../utils/ApiResponse.js'
import mongoose from 'mongoose'

// ---------------------GET ALL VIDEOS -----------------------
const getAllVideos= asyncHandler(async (req,res)=>{
    //handle pagination
    //DB call to find all videos
    // populate all the videos/ aggregation pipleine
   
    //let videos = await Video.find({}).populate('users')
    
    let videos = await Video.aggregate([
        //stage 1
        {
            $lookup : {
                from: 'users',
                foreignField: '_id',
                localField: 'owner',
                as : 'owner',
                pipeline : [
                    //pipleine stage 1
                    {
                        $project :{
                            fullName: 1,
                            username:1,
                            avatar:1,
                        }
                    }
                ]

            } 
        },
        //stage2
        // Convert owner array to an object
        {
            $addFields: {
                owner: { $first: "$owner" } // Extract the first (and only) element
            }
        },
        //stage3
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "video",
                as: "comments"
            }
        },
        //stage4
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        //stage 5
        {
            $addFields: {
                numberOfComments: { $size: "$comments" },
                numberOfLikes: { $size: "$likes" }
            }
        },
        //stage 6 --remove likes and comments field
        {
            $project : {
                likes:0,
                comments:0
            }
        }
    ])
    console.log('here')

    if (!videos?.length) throw new ApiError(404, "Videos not found") 

    return res.status(200).json(new ApiResponse(200, {videos}, 'Videos loading'))  
})

//------------------ PUBLISH A VIDEO -------------------
const publishAVideo= asyncHandler(async (req,res)=>{
   
    console.log(req.body)
    const {title, description} = req.body
    
    //2. from req.file get video local file path and thumbnail file path
    console.log(req.files)
    let videoLocalPath = req.files?.video[0].path
    console.log(videoLocalPath)
    if (!videoLocalPath) throw new ApiError(400, 'Video is required')

    let thumbnailLocalPath = req.files?.thumbnail[0].path
    console.log(thumbnailLocalPath)
    //if (!thumbnailLocalPath) throw new ApiError(400, 'Video is required')
    
    //3. upload on cloudinary 
    let videoRes= await uploadOnCloudinary(videoLocalPath);
    if (!videoRes) throw new ApiError(400, 'Error uploading video')
    console.log(videoRes)
    //{ public_id, url, duration }

    let thumbnailRes= await uploadOnCloudinary(thumbnailLocalPath)
    console.log(thumbnailRes)
    // {public_id, url, duration}

    // save the response metadata, filesize resolution, duration
    let video= await Video.create({   
        videoFile: { 
            url: videoRes.url,
            publicId: videoRes.public_id
           },
        thumbnail : { 
           url: thumbnailRes?.url || '',
           publicId: thumbnailRes?.public_id || ''
          },
        title,
        description,
        duration: videoRes.duration,
        owner: req.user._id

     })
  
     //7. check if user is created
    const createdVideo= await Video.findById(video._id)
    if (!createdVideo) {
        throw new ApiError(500, "Something went wrong while uploading  the video")
    }
  
    return res.status(201).json(
     new ApiResponse(200, createdVideo, "Video published Successfully")
  )
  

})

//-------------------  GET VIDEO BY ID -------------------
const getVideoById= asyncHandler(async (req,res)=>{
    //query from req.params
    let videoId = req.params.videoId;
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID format");
    }
    // get videoUrl & return 
    let video = await Video.aggregate([
        {
            $match: {
                //[26]
                 _id: new mongoose.Types.ObjectId(videoId)  // Using ObjectId conversion for safety
               }
        },
        //stage 1
        {
            $lookup : {
                from: 'users',
                foreignField: '_id',
                localField: 'owner',
                as : 'owner',
                pipeline : [
                    //pipleine stage 1
                    {
                        $project :{
                            fullName: 1,
                            username:1,
                            avatar:1,
                        }
                    }
                ]

            } 
        },
        //stage2
        // Convert owner array to an object
        {
            $addFields: {
                owner: { $first: "$owner" } // Extract the first (and only) element
            }
        },
        //stage3
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "video",
                as: "comments"
            }
        },
        //stage4
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        //stage 5
        {
            $addFields: {
                numberOfComments: { $size: "$comments" },
                numberOfLikes: { $size: "$likes" }
            }
        },
        

    ])

     if (!video.length) throw new ApiError(404, 'Video Not found')

     return res.status(200).json( new ApiResponse (200, video[0], 'Video fetched successfully'))

    // populate/ aggregate the video details like : owner, comments, likes,
    // increment view count if successfully fetched. [Future functionality]

    //return video details

})

// ------------------- UPDATE VIDEO BY ID-----------

const updateVideo = asyncHandler(async (req, res) => {

    //------details : title/description 
    let videoId = req.params.videoId;
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID format");
    }
    let video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, 'Video not found in DB');
    }
    if (!video.videoFile || !video.videoFile.publicId) {
        throw new ApiError(400, "Video file details are missing or invalid");
    }

    // Step 3: Check if the current user is the owner of the video
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, 'User is not authorized to update this video');
    }

    // Step 4: Extract updated fields from request body
    const { title, description } = req.body;

    // Step 5: Update video details in the DB
    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        { 
            $set: { title, description } // Update title and description
        },
        { new: true } // Return the updated video document
    );

    console.log('req.file', req.file)

    //------------------ Optional: If there's a thumbnail in the request, handle it
    if (req.file?.fieldname === 'thumbnail') {
        //console.log(req.file);
        const thumbnailLocalPath = req.file?.path;

        // Step 6: Upload thumbnail to Cloudinary
        const thumbnailResponse = await uploadOnCloudinary(thumbnailLocalPath);
        
        // If thumbnail upload is successful, update the thumbnail URL and publicId in DB
        if (thumbnailResponse) {
            // Check if existing thumbnail exists and delete it
            if (updatedVideo.thumbnail?.publicId) {
                await deleteFromCloudinary(updatedVideo.thumbnail.publicId);
            }

            // Update the video object with the new thumbnail data
            updatedVideo.thumbnail = {
                url: thumbnailResponse.url,
                publicId: thumbnailResponse.public_id
            };

            // Save updated video with new thumbnail details
            await updatedVideo.save();
        } else {
            throw new ApiError(500, 'Failed to upload thumbnail to Cloudinary');
        }
    }

    // Step 7: Return success response with updated video details
    return res.status(200).json(
        new ApiResponse(200, updatedVideo, "Video updated successfully")
    );
});


// --------------- DELETE VIDEO BY ID------------
const deleteVideo= asyncHandler(async (req,res)=>{

    let videoId = req.params.videoId;
    // Validate videoId format
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID format");
    }
    //from videoId query in DB and find cloudinary url and publicId
    let video = await Video.findById(videoId)
    if (!video) throw new ApiError(404, 'Video not found in DB')
    if (!video.videoFile || !video.videoFile.publicId) {
        throw new ApiError(400, "Video file details are missing or invalid");
    }
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, 'User is not authorized to delete this video');
    }
    
    try {
        console.log('cloudinary video:\n',video.videoFile)
        await deleteVideoFromCloudinary(video.videoFile?.publicId);   
    } catch (cloudinaryError) {
        throw new ApiError(500, "Failed to delete video from Cloudinary");
    }

    try {
      console.log("cloudinary thumbnail:\n", video.thumbnail )
        await deleteFromCloudinary(video.thumbnail?.publicId);   
    } catch (cloudinaryError) {
        throw new ApiError(500, "Failed to delete thumbnail from Cloudinary");
    }

    

    //delete record
    await Video.findByIdAndDelete(video._id);
    return res.status(200).json(
        new ApiResponse(200, null, "Video deleted successfully")
    );
    
})

const togglePublishStatus= asyncHandler(async (req,res)=>{
    
    
    let videoId = req.params.videoId;
    
    
    //from videoId query in DB and find cloudinary url and publicId
    let video = await Video.findById(videoId)
    if (!video) throw new ApiError(404, 'Video not found in DB')

    console.log(video)
    if (!video.videoFile) {
        throw new ApiError(400, "Video file details are missing or invalid");
    }
    console.log('here')

    console.log('compare', video.owner.toString(),'\n',req.user._id.toString() )

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, 'User is not authorized to delete this video');
    }

    video.isPublished = !video.isPublished;

    //  Save the updated video
    const updatedVideo = await video.save();

    // Return success response with updated video details
    return res.status(200).json(
        new ApiResponse(200, updatedVideo, `Video publish status updated to ${video.isPublished ? 'published' : 'unpublished'}`)
    );
})



export {
getAllVideos,
publishAVideo,
getVideoById,
updateVideo,
deleteVideo,
togglePublishStatus
}
