import { asynHandlers } from "../utils/ayncHandlers.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";


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
    .cookie("accessToken",accessToken)
    .cookie("refreshToken",refreshToken)
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
     $set:{
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
    const incomingRefreshToken=req.cookies || req.body;
    if(!incomingRefreshToken){
        throw new ApiError(401,)
    }
})
export {registerUser,loginUser,logoutUser,refreshAccessToken};