import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import { User } from '../models/user.model.js'
import { uploadOnCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js'
import {ApiResponse} from '../utils/ApiResponse.js'
import  jwt  from 'jsonwebtoken'


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
   let isValidPassword = user.isPasswordCorrect(password)
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

const logoutUser = asyncHandler ( async(req,res)=>{

   // get User
   await User.findByIdAndUpdate(
      req.user._id,
      {
         $set : {
            refreshToken: undefined
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
    
    
    await deleteFromCloudinary(existingUser.coverImage?.publicId)

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

const getUserChannelProfile = asyncHandler ( async(req,res)=>{})
const getWatchHistory = asyncHandler ( async(req,res)=>{})


 

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