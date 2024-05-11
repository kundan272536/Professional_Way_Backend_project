import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
const ACCESS_TOKEN_SECRET="abcd";
const REFRESH_TOKEN_SECRET="abcde";
const REFRESH_TOKEN_EXPIRY="10 days";
const ACCESS_TOKEN_EXPIRY="2 days";
const userSchema=new Schema(
    {
       username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true
       },
       email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
       },
       fullname:{
        type:String,
        required:true,
        lowercase:true,
        trim:true,
        index:true
       },
       avatar:{
        type: String,  //Cloudinary url
        required:true,
       },
       coverImage:{
        type:String,
       },
       watchHistory:[
        {
            type:Schema.Types.ObjectId,
            ref:"Video"
        }
       ],
       password:{
        type: String,
        required:[true,"Password is required"]
       },
       refreshToken:{
        type:String
       }
    },
    {
        timestamps:true
    }
)

userSchema.pre("save",async function(next){
    if(!this.isModified("password"))
    return next();
        this.password=await bcrypt.hash(this.password,10);
        next();
})

userSchema.methods.isPasswordCorrect=async function(password){
  return await bcrypt.compare(password,this.password);
}

userSchema.methods.generateAccessToken= function(){
    
   return jwt.sign(
    {
        _id:this._id,
        email:this.email,
        username:this.username,
        fullname:this.fullname
    },
    ACCESS_TOKEN_SECRET,
    {
        expiresIn:ACCESS_TOKEN_EXPIRY
    }
 )
}
userSchema.methods.generateRefreshToken=function(){
    return jwt.sign(
        {
            _id:this._id,
        },
        REFRESH_TOKEN_SECRET,
        {
            expiresIn:REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User=mongoose.model("User",userSchema);