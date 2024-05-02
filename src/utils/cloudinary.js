import {v2 as cloudinary} from 'cloudinary';
import fs from "fs";  
cloudinary.config({ 
  cloud_name: 'dklycn5tw', 
  api_key: '782454938374929', 
  api_secret: '30a0D6x-V4lpnnvZyRIcYt7yBVE' 
});


const uploadOnCloudinary=async (localFilepath)=>{
  try {
    if(!localFilepath) return null;
    //File Uploaded at cloudinary
    const response=await cloudinary.uploader.upload(localFilepath,{
        resource_type:"auto"
    })
    console.log("File is uploaded at cloudinary",response.url);
    return response;
  } catch (error) {
     fs.unlinkSync(localFilepath);
     // Remove the locally saved temporary file as the upload operation get failed


     return null
  }
}
export {uploadOnCloudinary}