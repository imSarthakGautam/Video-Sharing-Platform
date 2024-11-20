import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";

//Verify user from JWT (accessToken/ refreshToken)

/*
1. from access Token get userId,
2. from Id, remove password and refresh Token
3. attach user object to request and next()
*/
export const verifyJWT = asyncHandler(async(req,res, next)=>{


    try{
    //request has access to cookie: cookie-parser
    /*
    if access token is stored in cookie named accessToken or
     is sent in Authorization header using Bearer scheme 

       const headers = {
        'Authorization': `Bearer ${accessToken}`
    };
    */


    const token = req.cookies?.accessToken || req.header("Authorization")
    if (!token) throw ApiError(401, 'Unauthorized request')

    const decoded_token = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    //decoded_token has {_id, email, fullname }
    let user= await User.findById(decoded_token?._id).select('-password -refreshToken')

    if (!user) throw new ApiError(401, "Invalid Access Token")

    req.user= user;
    next()

    } catch (error){

        throw new ApiError(401, error.message || 'Invalid Access Token')

    }
    
})