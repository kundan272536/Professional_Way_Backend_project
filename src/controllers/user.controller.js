import { asynHandlers } from "../utils/ayncHandlers.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
const REFRESH_TOKEN_SECRET="abcde";


const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token",error)
    }
}


// UserRegistered Controller
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
    if([username,email,fullname,password].some((field)=>field.trim()==="")){
        throw new ApiError (400,"All fields are required")
    }
    const existedUser=await User.findOne({
        $or:[{username},{email}]
    })
    if(existedUser){
        throw new ApiError (409,"User with email or username already exists")
    }
    const avatarLocalPath=req.files?.avatar[0]?.path;
    // const coverImageLocalPath=req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && (req.files.coverImage.length>0)){
     coverImageLocalPath=req.files.coverImage[0].path;
    }
    const avatar=await uploadOnCloudinary(avatarLocalPath);
    const coverImage=await uploadOnCloudinary(coverImageLocalPath);
    if(!avatar){
        throw new ApiError (400,"Avtar file is requied!");
    }
   const user=await User.create({
        fullname,
        password,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        username:username.toLowerCase()
    })
    console.log("CoverImage Details:",coverImage);
    const createdUser=await User.findById(user._id).select(
        "-password -refreshToken"
    );
    if(!createdUser){
        throw new ApiError(500,"Something went wrong during user registration!");
    }
return res.status(201).json(
    new ApiResponse (200,createdUser,"User registered successfully")
)
});



//UserLogin Controller
const loginUser=asynHandlers(async(req,res)=>{
    //req body->data
    // username or email
    // find the user
    // password check
    // access and refresh token
    // send cookie
    const {email, username,password}=req.body;
    // console.log("email: ",email, password);
    if(!(username || email)){
        throw new ApiError (400,"Username or email and Password is required");
    }
    const user=await User.findOne({
        $or:[{username},{email}]
    });
    // console.log("User", user);
    if(!user){
        throw new ApiError (404,"User does not exist");
    }
    const isPasswordValid=await user.isPasswordCorrect(password);
    console.log("Password Check",isPasswordValid);
    if(!isPasswordValid){
        throw new ApiError (401,"Invalid user credentials");
    }
    const {accessToken,refreshToken}=await generateAccessAndRefereshTokens(user._id);
    const loggedInUser=await User.findById(user._id).select("-password -refreshToken")
    const options={
        httpOnly:true,
        secure:true
    }
    res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
            user:loggedInUser,accessToken,refreshToken
            },
            "User logged In successfully"
        )
    )
});

// Logout Controller
//Logout controller is not working
const logoutUser=asynHandlers(async(req,res)=>{
    console.log("Inside the logoutuser");
    await User.findByIdAndUpdate(
        req.user._id,
    {
     $unset:{
        refreshToken:undefined
     }
     
    },
    {
        new:true
     }
    )
    console.log("Inside the logoutuser after teh findbyid");

    const options={
        httpOnly:true,
        secure:true
    }
    res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User Logged Out"))
})


// RefreshAccessToken
const refreshAccessToken= asynHandlers(async(req,res)=>{
    // const incomingRefreshToken=req.cookies.refreshAccessToken || req.body.refreshAccessToken;
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    console.log("Incoming refresh token",incomingRefreshToken);
    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized request")
    }
    try {
        const decodedToken=jwt.verify(incomingRefreshToken,REFRESH_TOKEN_SECRET)
        console.log("decodedToken details:",decodedToken);
        const user=await User.findById(decodedToken?._id);
        console.log("Users details",user);
        if(!user){
            throw new ApiError(401,"Invalid refresh Token");
        }
        if(incomingRefreshToken !==user?.refreshToken){
            throw new ApiError(401,"Refresh Token is expired or used")
        }
        const options={
            httpOnly:true,
            secure:true
        }
        const {newRefreshToken,accessToken}=await generateAccessAndRefereshTokens(user._id)
        return res.status(200)
        .cookie("accesstoken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(new ApiResponse(
            200, 
            {accessToken, refreshToken: newRefreshToken},
            "Access token refreshed"
        )
    )
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid refresh Token")
    }
})

//Change CurrentPassword
const changeCurrentPassword=asynHandlers(async(req,res)=>{
  const {oldPassword,newPassword}=req.body;
  const user=await User.findById(req.User?._id)
  const isPasswordCorrect=await user.isPasswordCorrect(oldPassword);
  if(!isPasswordCorrect){
    throw new ApiError(400,"Invalid old password")
  }
  user.password=newPassword;
  await user.save({validateBeforeSave:false});
  return res 
  .status(200)
  .json(new ApiResponse (200,{},"Password Updated succesfully"))
});

const getCurrentUser=asynHandlers(async(req,res)=>{
    return res
    .status(200)
    .json(new ApiResponse (200,req.user,"Current User Fetched Successfully"));
})

const updateAccountDetails=asynHandlers(async(req,res)=>{
    const {fullname,email}=req.body;
    if(!fullname || email){
        throw new ApiError(400,"All fields are required");
    }
    const user=await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                fullname,
                email
            }
        },
        {
            new:true
        }
    ).select("-password")
    return res
    .status(200)
    .json(new ApiResponse(200,user,"User`s accounts details updated successfully"));
})

const updateUserAvatar=asynHandlers(async(req,res)=>{
    const avatarLocalPath=req.file?.path;
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing");

    }
    const avatar=await uploadOnCloudinary(avatarLocalPath);
    if(!avatar.url){
        throw new ApiError(400,"Error during the uploading avatar at cloudinary")
    }
    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar?.url
            }
        },
        {
            new:true
        }
    ).select("-password")
    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
    )
})

const updateUserCoverImage=asynHandlers(async(req,res)=>{
    const coverImageLocalPath=req.file?.path;
    if(!coverImageLocalPath){
        throw new ApiError(400,"Avatar file is missing");

    }
    const coverImage=await uploadOnCloudinary(coverImageLocalPath);
    if(!coverImage.url){
        throw new ApiError(400,"Error during the uploading avatar at cloudinary")
    }
    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {
            new:true
        }
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover image updated successfully")
    )
})

const getUserChannelProfile=asynHandlers(async(req,res)=>{
    const {username}=req.params;
    if(!username?.trim()){
        throw new ApiError(400,"Username is missing");
    }
    const channel=await User.aggregate([
    
    {  
        $match:{
            username:username?.toLowerCase()
        }
    },
    {    
        $lookup:{
            from:"subscriptions",
            localField:"_id",
            foreignField:"channel",
            as:"subscribers"
        },
    },
    { 
        $lookup:{
            from:"subscriptions",
            localField:"_id",
            foreignField:"subscriber",
            as:"subscribedTo"
        },
    },     
    { 
        $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
    },
    {
        $project:{
            fullName: 1,
            username: 1,
            subscribersCount: 1,
            channelsSubscribedToCount: 1,
            isSubscribed: 1,
            avatar: 1,
            coverImage: 1,
            email: 1

        }
    }    
    ])
    if (!channel?.length) {
        throw new ApiError(404, "channel does not exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
    )
})

const getWatchHistory = asynHandlers(async(req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
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
};