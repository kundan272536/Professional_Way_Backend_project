import { ApiError } from "../utils/ApiError.js";
import { asynHandlers } from "../utils/ayncHandlers.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
export const verifyJwt=asynHandlers(async(req,res,next)=>{
    try {
        const token=req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer","");
        if(!token){
            throw new ApiError(401,"Unauthorized Token")
        }
        const decodeToken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
        const user=await User.findById(decodeToken._id).select("-password -refreshToken")
        if (!user) {
            //Discuss about frontend
            throw new ApiError(401,"Invalid Access Token");
        }
        req.user=user;
        next();
    } catch (error) {
        throw new ApiError(401,error?.message ||" Invalid Access Token")
    }
})