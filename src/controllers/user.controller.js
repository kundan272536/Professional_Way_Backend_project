import { asynHandlers } from "../utils/ayncHandlers.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";
const registerUser=asynHandlers(async(req,res)=>{
    //get user details from frontend
    //validation -not empty
    //check if user already exists:username,email
    //check for images, check for avatar
    //upload them to cloudinary, avatar
    // create user object-create entry in db
    //remove password and refresh token field from response
    //check for user creation
    //return response
    const {username,email,fullname,password}=req.body;
    if([username,email,fullname,pa].some((field)=>field.trim()==="")){
        throw new ApiError (400,"All fields are required")
    }
    const existedUser=User.findOne({
        $or:[{username},{email}]
    })
    if(existedUser){
        throw new ApiError (409,"User with email or username already exists")
    }
    const avatarLocalPath=req.files?.avatar[0]?.path;
    const coverImageLocalPath=req.files?.coverImage[0]?.path;
    const avatar=await uploadOnCloudinary(avatarLocalPath);
    const coverImage=await uploadOnCloudinary(coverImageLocalPath);
    if(!avatar){
        throw new ApiError (400,"Avtar file is requied!");
    }
   const User=await User.create({
        fullname,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        username:username.toLowerCase()
    })
    const createdUser=await User.findById(User._id).select(
        "-password -refreshToken"
    );
    if(!createdUser){
        throw new ApiError(500,"Something went wrong during user registration!");
    }
return res.status(201).json(
    new ApiResponse (200,createdUser,"User registered successfully")
)
});
const loginUser=asynHandlers(async(req,res)=>{
    const {email, password}=req.body;
    res.status(200).json({
        message:"ok"
    })
});
export {registerUser,loginUser};