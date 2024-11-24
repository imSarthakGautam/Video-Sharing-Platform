import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description, videos} = req.body
    if (!(name && description)) throw new ApiError(400, 'Playlist details missing')
    
    const newPlaylist = await Playlist.create({
        name,
        description,
        owner: req.user._id    
     })

     await newPlaylist.save()
     if (!videos.length) return res.status(200).json( new ApiResponse(200,{newPlaylist}, 'Playlist created <empty>'));
    newPlaylist.videos= videos
    await newPlaylist.save();
    return res.status(200).json( new ApiResponse(200, {newPlaylist}, 'Playlist created'));

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params

    // playlist {name, description, videos=[{_id}, title, description, owner={username}] }
    const userPlaylists= await Playlist.aggregate([
        //stage1
        { $match : {
            owner:new mongoose.Types.ObjectId(userId)
            }
        },

        //stage2
        {
            $lookup: {
                from: 'videos', 
                localField: 'videos', 
                foreignField: '_id',
                as: 'videos',
              
            }
        },

        {
        $unwind: {path:'$videos',  preserveNullAndEmptyArrays: true  } 
        },

        {
        $lookup: {
            from: 'users',
            localField: 'videos.owner',
            foreignField: '_id',
            as: 'videos.owner',
            pipeline : [
            {
                $project: {
                username:1,
                fullname:1,
                _id:0
                }
            }
            ]
        }
        },

        {
        $unwind: {path:'$videos.owner',  preserveNullAndEmptyArrays: true  } 
        },

        //re-join the videos array , but after adding the details

        {
            $group: {
                _id: '$_id', // grouping the Playlists with same ID
                name: { $first: '$name' }, // among same id: title of first Playlist (same)
                description: { $first: '$description' }, // Playlist description
                videos: {

                    // $push collects all the video-related data into an array, hence RECONSTRUCTING VIDEOS ARRAYS/
                    $push: { 
                        _id: '$videos._id', // Video ID
                        title: '$videos.title', // Video title
                        description: '$videos.description', // Video description
                        owner: {
                            username: '$videos.owner.username' // Owner username
                        }
                    }
                }
            }
        },
            
        
          
    ])

    if (!userPlaylists.length) return res.status(404).json(new ApiResponse(404, [], 'No playlists found'))
    return res.status(200).json(new ApiResponse(200,{userPlaylists}, 'User Playlists found'))
    
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // playlist {name, description, owner, videos=[{_id}, title, description, owner={username}] }
    const userPlaylist= await Playlist.aggregate([
        //stage1
        { $match : {
            _id:new mongoose.Types.ObjectId(playlistId)
            }
        },

        //stage2
        {
            $lookup: {
                from: 'videos', 
                localField: 'videos', 
                foreignField: '_id',
                as: 'videos',
              
            }
        },

        {
        $unwind: {path:'$videos' } 
        },

        {
        $lookup: {
            from: 'users',
            localField: 'videos.owner',
            foreignField: '_id',
            as: 'videos.owner',
            pipeline : [
            {
                $project: {
                    username:1,
                    fullname:1,
                    _id:0
                }
            }
            ]
        }
        },

        {
        $unwind: {path:'$videos.owner' } 
        },

        //re-join the videos array , but after adding the details

        {
            $group: {
                _id: '$_id', // grouping the Playlists with same ID
                name: { $first: '$title' }, // among same id: title of first Playlist (same)
                description: { $first: '$description' }, // Playlist description
                owner: { $first: '$owner' }, // Playlist description
                videos: {

                    // $push collects all the video-related data into an array, hence RECONSTRUCTING VIDEOS ARRAYS/
                    $push: { 
                        _id: '$videos._id', // Video ID
                        title: '$videos.title', // Video title
                        description: '$videos.description', // Video description
                        owner: {
                            username: '$videos.owner.username', // Owner username
                            fullname: '$videos.owner.fullname' // Owner username
                        }
                    }
                }
            }
        },
            
        
          
    ])

    if (!userPlaylist.length) throw new ApiError(200, 'No playlist found')
    return res.status(200).json(new ApiResponse(200, userPlaylist[0] , 'User Playlists found'))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    const playlist = await Playlist.findOne({_id:playlistId})
    if (playlist.owner.toString()!==req.user._id.toString()) throw new ApiError(401, 'Unauthorized to add')
    playlist.videos.push(videoId);
    await playlist.save();

    return res.status(200).json( new ApiResponse(200, {playlist, addedVideo:videoId}, 'New Video Added to Playlist'))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    // Find the playlist by ID
    const playlist = await Playlist.findOne({ _id: playlistId });

    // Check if playlist exists
    if (!playlist) throw new ApiError(404, 'Playlist not found');

    // Check if the user is authorized to modify the playlist
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(401, 'Unauthorized to remove');
    }

    // Filter out the video
    playlist.videos = playlist.videos.filter(video => video.toString() !== videoId);

    // Save the updated playlist
    await playlist.save();

    // Respond with success
    return res.status(200).json(
        new ApiResponse(200, { playlist, removedVideo: videoId }, 'Video Removed from Playlist')
    );
});


const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    
    await Playlist.findByIdAndDelete(playlistId)
    return res.status(200).json( new ApiResponse(200, {}, 'Playlist deleted'))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body

    
    const updatedPlaylist = await Playlist.findByIdAndUpdate( playlistId,
        {
            $set : {
                name,
                description
            }
        },
        { new : true }
    )
    console.log(updatedPlaylist)

    if(!updatePlaylist) throw new ApiError(400, 'Playlist could not be updated')
    return res.status(200).json( new ApiResponse(200, {updatedPlaylist}, 'Playlist updated'))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}