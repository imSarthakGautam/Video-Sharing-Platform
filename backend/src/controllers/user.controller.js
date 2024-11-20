import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import { User } from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import {ApiResponse} from '../utils/ApiResponse.js'


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
      avatar: avatar.url,
      coverImage : coverImage?.url || '',
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

   let accessToken = user.generateAccessToken()
   let refreshToken = user.generateRefreshToken()

   // refresh Token is updated here
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

   //1. cookie clear
   //2. reset Refresh Token
})


const refreshAccessToken = asyncHandler ( async(req,res)=>{})
const changeCurrentPassword = asyncHandler ( async(req,res)=>{})
const getCurrentUser = asyncHandler ( async(req,res)=>{})
const updateAccountDetails = asyncHandler ( async(req,res)=>{})
const updateUserAvatar = asyncHandler ( async(req,res)=>{})
const updateUserCoverImage = asyncHandler ( async(req,res)=>{})
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