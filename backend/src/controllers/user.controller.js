import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import { User } from '../models/user.model.js'
import { uploadOnCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js'
import {ApiResponse} from '../utils/ApiResponse.js'
import  jwt  from 'jsonwebtoken'
import mongoose from 'mongoose'


//The registerUser route handler is wrapped by asyncHandler directly when it is defined.
//The asyncHandler utility takes the entire route handler function as its input 
const registerUser = asyncHandler ( async (req, res)=>{
   
   //1. get the user credentials
   let {username, email, fullname, password }=req.body

   //2. Check validity : empty ?
   let arr = [username, email, fullname, password ].some((feild)=>feild?.trim()==='')
   if (arr) throw new ApiError(401, 'All feilds are required')

   //3.check if user already exists
   let prevUser= await User.findOne({ 
      $or: [{email},{username}]
   })

   if (prevUser) throw new ApiError(409, 'Username or email already exists')

   //create user,
   // password hashing, generate Refresh Token, generate Access Token done in User.methods.

   //4.for avatar and coverImage : local File Paths.
   console.log(req.files)
   let avatarFilePath = req.files?.avatar[0]?.path
   console.log(avatarFilePath)
   if (!avatarFilePath) throw new ApiError(400, 'Avatar is required.')
   
   let coverImagePath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImagePath = req.files.coverImage[0].path
    }
    

   //5. upload on cloudinary
   let avatar = await uploadOnCloudinary(avatarFilePath);
   if (!avatar) throw new ApiError(400, 'Avatar is required')
   let coverImage = await uploadOnCloudinary(coverImagePath);

   //6. create user on DB

   let user= await User.create({
      username: username.toLowerCase(),
      email,
      fullname,
      password,
      avatar: { 
          url: avatar.url,
          publicId: avatar.public_id
         },
      coverImage : { 
         url: coverImage?.url || '',
         publicId: coverImage?.public_id || ''
        },
      
   })


   //7. check if user is created

   const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
  )

  if (!createdUser) {
      throw new ApiError(500, "Something went wrong while registering the user")
  }

  return res.status(201).json(
   new ApiResponse(200, createdUser, "User registered Successfully")
)


})

//-----------------GENERATE ACCESS TOKEN---------
const generateAccessAndRefreshToken = async (userId)=> {

   try {
   const user = await User.findById(userId)
   if (!user) throw new ApiError(404, 'User not found')

   //console.log('User in token gen', user)

   let accessToken = user.generateAccessToken()
   //console.log('at',accessToken)

   let refreshToken = user.generateRefreshToken()
   //console.log('rt', refreshToken)

   // -------------------refresh Token is updated here
   user.refreshToken = refreshToken

   await user.save({validateBeforeSave: false}) // to bypass mongoose validation, use sparingly for minor updates only.

   return {refreshToken, accessToken}
   } catch (err){
      throw new ApiError(500, "Something went wrong while generating referesh and access token")
   }
   
}

//--------------- LOGIN USER ------------------
const loginUser = asyncHandler ( async (req, res)=>{
   //1. input user details,
  
   const { username, email, password} = req.body;
   
   if (!username && !email) throw new ApiError(400, 'username or email missing')


   //2. verify credentials
   let user = await User.findOne({
      $or :[{username},{email}]
   })

   if (!user) throw new ApiError(404, 'User does not exist')

   //re-check logic
   let isValidPassword =await  user.isPasswordCorrect(password)
   if (!isValidPassword) throw new ApiError(401, 'Invalid user credentials') // only runs on if(true) i.e. invalid credentials

   // accesstoken and refresh token
   let { accessToken, refreshToken}= await generateAccessAndRefreshToken(user._id)
   //console.log(accessToken, refreshToken)
   
   const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

   // session creation cookie save
   let options = {
      httpOnly : true,
      secure : true
   }

   return res
   .status(200)
   .cookie('accessToken', accessToken, options)
   .cookie('refreshToken', refreshToken, options)
   .json(
      new ApiResponse(
         200,
         { //data
            user: loggedInUser,
            accessToken,
            refreshToken
         },
         'User Logged In successfully'
      )
   )

})

//--------------LOGOUT USER----------------
const logoutUser = asyncHandler ( async(req,res)=>{

   // get User
   await User.findByIdAndUpdate(
      req.user._id,
      {
         $unset : {
            refreshToken: 1 // this removes field from the document
         }
      },
      {
         new: true 
         //option passed to mongoose ensures this method returns updated document.
      }
   )

   let options = {
      httpOnly : true,
      secure : true
   }

   //1. cookie clear res.clearCookie
   return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json( new ApiResponse(200, {}, 'User Logged Out'))
   //2. reset Refresh Token
})

// ------------------ REFRESH ACCESS TOKEN ---------
const refreshAccessToken = asyncHandler ( async(req,res)=>{

   // send refresh token in cookie
   // match with refresh token in db
   
   const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
   if (!incomingRefreshToken) throw new ApiError(401, 'Unauthorized Access')

   
   try {
      //verify incoming token 
      const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
   
      const user = await User.findById(decodedToken?._id)
      if (!user) throw new ApiError(401, 'Invalid Refresh Token')
   
      if (incomingRefreshToken !== user.refreshToken) throw new ApiError(401, 'Refresh token is expired or used')
   
      let options = {
         httpOnly : true,
         secure : true
      }
      //generate new tokens
   
      const {accessToken, newrefreshToken } =await generateAccessAndRefreshToken(user._id);
      res.status(200)
         .cookie('accessToken', accessToken, options)
         .cookie('refreshToken', newrefreshToken, options)
         .json( 
            new ApiResponse(
               200, {
               accessToken,
               refreshToken: newrefreshToken
               },
               'Access Token refreshed sucessfully'
            )
         )
   } catch (error) {
      throw new ApiError(400, error?.message || 'Invalid Refresh Token') 
   }


})

//------------- CHANGE CURRENT PASSWORD ----------
const changeCurrentPassword = asyncHandler ( async(req,res)=>{

   //loggedIn so -- from req.user, password query
   // input old password and new password from req. body
   // if matched, update password feild
   const {oldPassword, newPassword} = req.body

   const user = await User.findById(req.user?._id)
   const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

   if (!isPasswordCorrect) {
       throw new ApiError(400, "Invalid old password")
   }

   user.password = newPassword
   await user.save({validateBeforeSave: false})

   return res
   .status(200)
   .json(new ApiResponse(200, {}, "Password changed successfully"))

})

//------------- GET CURRENT USER ---------------
const getCurrentUser = asyncHandler ( async(req,res)=>{
   // from req.user middleware
   return res
   .status(200)
   .json(new ApiResponse(
       200,
       req.user,
       "User fetched successfully"
   ))
})

//----------------- UPDATE ACCOUNT DETAILS ------------
const updateAccountDetails = asyncHandler ( async(req,res)=>{
   // from req.user --query account
   // from req.body--feilds to update
   const {fullName, email} = req.body

   if (!fullName || !email) {
       throw new ApiError(400, "All fields are required")
   }

   const user = await User.findByIdAndUpdate(
       req.user?._id,
       {
           $set: {
               fullName,
               email: email
           }
       },
       {new: true}
       
   ).select("-password")

   return res
   .status(200)
   .json(new ApiResponse(200, user, "Account details updated successfully"))

})

//--------------- CHANGE AVATAR -----------
const updateUserAvatar = asyncHandler ( async(req,res)=>{
   //multer middleware single upload, 
   //get file path
   //upload to middleware
   // remove previous avatar
   const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

   
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const existingUser = await User.findById(req.user?._id)
    if (!existingUser) throw new ApiError(400, 'Error deleting image from Cloudinary')
    
    console.log(existingUser.avatar)
    await deleteFromCloudinary(existingUser.avatar.publicId)

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                'avatar.url': avatar.url,
                'avatar.publicId': avatar.public_id
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
    )
})

const updateUserCoverImage = asyncHandler ( async(req,res)=>{
   //multer middleware single upload, 
   //get file path
   //upload to middleware
   // remove previous coverImage
   const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "CoverImage file is missing")
    }

   
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const existingUser = await User.findById(req.user?._id)
    if (!existingUser) throw new ApiError(400, 'Error deleting image from Cloudinary')
    
    if (existingUser.coverImage?.publicId){
    await deleteFromCloudinary(existingUser.coverImage?.publicId)
    }

    let user= await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                'coverImage.url': coverImage.url,
                'coverImage.publicId': coverImage.public_id
            }
        },
        {new: true}
    ).select('-password')

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "CoverImage image updated successfully")
    )
})

//-------------------- GET USER CHANNEL { fullname, username, subscibers, subscribed }------------
const getUserChannelProfile = asyncHandler ( async(req,res)=>{

   
   let {username} = req.params // video.com/:username
   if (!username.trim()) throw new ApiError(400, 'Not a valid user channel')

   //User.find({username})
   // see aggregation_pipleine.md for confusion.
   let channel = await User.aggregate([ 
      //stage1
      { $match :{ 
          username : username?.toLowerCase()
         }
      },
      //stage2
      {
         $lookup : {
            from: 'Subscription',
            localField: '_id',
            foreignField: 'channel',
            as: 'subscribers'
         }
      },
      // this subsribers is an array having documents of subscription Schema
      //stage 3
      {
         $lookup : {
            from: 'Subscription',
            localField: '_id',
            foreignField: 'subscriber',
            as: 'subscribedTo'
         }
      },
      //stage 4
      {
         $addFields : {
            subscribersCount : {
               $size : { $ifNull: ['$subscribers', []] }
            },
            subscribedToCount :{
               $size :{ $ifNull: ['$subscribedTo', []] }
            },
            isSubscribed : {
               $cond: {
                  if: {$in: [req.user?._id, '$subscribers.subscribed']},
                  then : true,
                  else: false
               }
            }  
         }
      },
      //stage 5
      {
         $project : {
            fullname: 1,
            username :1,
            subscribersCount:1,
            subscribedToCount:1,
            isSubscribed: 1,
            avatar:1,
            coverImage:1   
         }
      }
   ])
   console.log(channel)

   if (!channel?.length) throw new ApiError(404, 'Channel does not exists')

   return res
   .status(200)
   .json(
      new ApiResponse(200, channel[0], 'User channel fetched successfully')
   )   
})

const getWatchHistory = asyncHandler ( async(req,res)=>{

   const user = await User.aggregate([
      {
        $match: {
         // _id: req.user._id [26]
          _id: new mongoose.Types.ObjectId(req.user._id)  // Using ObjectId conversion for safety
        }
      },
      // stage2: Lookup to get watch history and the video owner details
      {
        $lookup: {
          from: 'videos',
          localField: 'watchHistory',
          foreignField: '_id',
          as: 'watchHistory', // watchHistory will be placed in watchHistory array

          //pipeline is applied to 'from' collection i.e videos
          pipeline: [
            // 1st pipline stage 1
            {
              $lookup: { //performs another $lookup to the users using the owner field in the videos collection.
                from: 'users',
                localField: 'owner',
                foreignField: '_id',
                as: 'owner',

                pipeline: [
                  // 2nd pipleine stage1
                  {
                    $project: {
                      fullName: 1,
                      username: 1,
                      avatar: 1
                    }
                  },

                  // 2nd pipleine stage2
                  //without this owner :[{}] so extract first element from array and replace it as field.
                  {
                    $addFields: {
                      owner: {
                        $first: "$owner"  // Ensure to extract the first matching owner
                      }
                    }
                  }
                ]

               }
              
            }
            //1st pipeline stage1 complete
          ]

        }
      }
      //stage 2 complete
    ]);

   /* sample output from this pipeline
   [
      {
         "_id": ObjectId("user_id"),
         "watchHistory": 
         [
            {
            "_id": ObjectId("video_id_1"),
            "title": "Video 1",
            "owner": {
               "_id": ObjectId("owner_id_1"),
               "fullName": "Owner One",
               "username": "owner1",
               "avatar": "owner1_avatar_url"
               } ,
               // other fields from the Video document
            },

            {
            "_id": ObjectId("video_id_2"),
            "title": "Video 2",
            "owner": {
               "_id": ObjectId("owner_id_2"),
               "fullName": "Owner Two",
               "username": "owner2",
               "avatar": "owner2_avatar_url"
               },
               // other fields from the Video document
            }
         ]
      }
   ]
   */
    
   return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            //extract first elemetn from pipleine
            user[0].watchHistory,
            "Watch history fetched successfully"
        )
    )
})


 

export { 
   registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}