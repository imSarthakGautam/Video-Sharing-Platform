import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //videolink/:videoId

    const {videoId} = req.params.videoId
    //pagination
    const {page = 1, limit = 10} = req.query
    let skip = (page-1)*limit;

    //check all comments in which the video field consist of videoId
    const comments = await Comment.find({video:videoId})
        .skip(skip)
        .limit(limit)
        .sort({createdAt :-1});

    if (!comments) throw new ApiError(400, 'No any comments')

    console.log(comments)

    const totalCount = await Comment.countDocuments({video:videoId});
    const totalPages = Math.ceil(totalCount/limit)

    return res.status(200).json( new ApiResponse(200, {comments, pagination: {
        totalCount,
        totalPages,
        currentPage: page,
        pageSize: limit,
    } }, 'Comments fetched Successfully'))   

})

const addComment = asyncHandler(async (req, res) => {
    const {videoId}= req.params.videoId;
    let {content} = req.body;

    console.log(content)
    if (!content) throw new ApiError(400, 'No comments to add')

    let comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id
    })

    

    if(!comment) throw new ApiError(400, 'Comment was not added')
    return res.status(200).json(new ApiResponse(200, {comment}, 'Comment Added Successfully'))

})

const updateComment = asyncHandler(async (req, res) => {
    const commentId = req.params.commentId;
    const {content} = req.body;
    const comment = await Comment.findById(commentId)

    if (req.user._id.toString() !== comment.owner.toString()) throw new ApiError(401, 'User not authorized')
    
    comment.content= content;
    await comment.save();
    return res.status(200).json( new ApiResponse(200, {comment}, 'Comment Added Successfully'))

})

const deleteComment = asyncHandler(async (req, res) => {
    const commentId = req.params.commentId
    const comment = await Comment.findById(commentId)
    
    
    //video owner can delete functionality : future

    console.log(req.user._id,'\n', comment.owner)

    if (req.user._id.toString() !== comment.owner.toString()) throw new ApiError(401, 'User not authorized')
    await Comment.findByIdAndDelete(commentId)
    return res.status(200).json(new ApiResponse(200, {}, 'Comment deleted Successfully'))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }