import { User } from "../models/user.model.js";
import { ApiErrors } from "../utils/apiErrors.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"

export const verifyJwt = asyncHandler(async(req,_,next)=>{

    try {
        const token = req.cookies?.accessToken || req.header("Authorizition")?.replace("bearer ","")
    
        if(!token){
            throw new ApiErrors(401,"Unauthorized request")
        }
    
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken._id).select("-password -refreshToken")
    
        if(!user){
            throw new ApiErrors(404,"Invalid access Token!!")
        }
    
        req.user = user
        next()  
    } catch (error) {
        throw new ApiErrors(401,"Invalid access Token")
    }
}) 