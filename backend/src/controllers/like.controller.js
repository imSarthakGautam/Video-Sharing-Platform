import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params

    let existingLike = await Like.findOne({video: videoId, owner:req.user._id})
    if (!existingLike) {    
        const like =await Like.create({
            owner: req.user._id,
            video: videoId,
            isLiked: true
        })
        return res.status(200).json(new ApiResponse(201, { like }, 'Video liked successfully'));
    }

    //if (req.user._id.toString()!== like.owner.toString()) throw new ApiError(401, 'Unauthorized')
    existingLike.isLiked = !existingLike.isLiked;
    await existingLike.save();
    return res.status(200).json(new ApiResponse(200, {like: existingLike}, 'Like toggled successfully'))
})


const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params

    let existingLike = await Like.findOne({comment: commentId, owner:req.user._id})
    if (!existingLike) {    
        const like =await Like.create({
            owner: req.user._id,
            comment: commentId,
            isLiked: true
        })
        return res.status(200).json(new ApiResponse(201, { like: like }, 'comment liked successfully'));
    }

    //if (req.user._id.toString()!== like.owner.toString()) throw new ApiError(401, 'Unauthorized')
    existingLike.isLiked = !existingLike.isLiked;
    await existingLike.save();
    return res.status(200).json(new ApiResponse(200, {like:existingLike}, 'Like toggled successfully'))
})


const getLikedVideos = asyncHandler(async (req, res) => {
    
    const likedVideos = await Like.find({
        owner:req.user._id,
        video: { $exists: true },
        isLiked:true
    }).populate('video')

    if(!likedVideos.length) throw new ApiError(404, 'No liked videos found')

    const videos = likedVideos.map(like=>like.video)
    

    return res.status(200).json(new ApiResponse(200, {videos}, 'All liked Videos'))
})

export {
    toggleCommentLike,
    toggleVideoLike,
    getLikedVideos
}