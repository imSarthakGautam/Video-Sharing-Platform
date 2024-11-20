import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import { User } from '../models/user.model.js'
import { Video } from '../models/video.model.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import {ApiResponse} from '../utils/ApiResponse.js'

const getAllVideos= asyncHandler(async (req,res)=>{})
const publishAVideo= asyncHandler(async (req,res)=>{})
const getVideoById= asyncHandler(async (req,res)=>{})
const updateVideo= asyncHandler(async (req,res)=>{})
const deleteVideo= asyncHandler(async (req,res)=>{})
const togglePublishStatus= asyncHandler(async (req,res)=>{})



export {
getAllVideos,
publishAVideo,
getVideoById,
updateVideo,
deleteVideo,
togglePublishStatus
}
