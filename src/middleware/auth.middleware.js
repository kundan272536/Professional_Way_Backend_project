import { ApiError } from "../utils/ApiError.js";
import { asynHandlers } from "../utils/ayncHandlers.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
const ACCESS_TOKEN_SECRET="abcd";
export const verifyJwt = asynHandlers(async(req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        console.log("Inside the verifyjwt  ",token);
        // console.log(token);
        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }
        console.log("after the if conditions ");

        const decodedToken = jwt.verify(token,ACCESS_TOKEN_SECRET)
        // console.log("decodeToken : ", decodedToken);

        console.log("after the if decodedToken ");

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
        console.log("Inside the verifyjwt after user");

        if (!user) {
            
            throw new ApiError(401, "Invalid Access Token")
        }
    
        req.user = user;
        next()
    } catch (error) {
        
        console.log("inside the catch the block",error);
        throw new ApiError(401, error?.message || "Invalid access token")
    }
    
})