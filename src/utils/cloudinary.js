import { v2 as cloudinary } from "cloudinary";
import {fs} from "fs"

cloudinary.config({
cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
api_key: process.env.CLOUDINARY_API_KEY,
api_secret: process.env.CLOUDINARY_API_SECRET
})



const uploadonCloudinary = async (localFilePath) => {
try {
    if(!localFilePath) return null;
    //upload the file on cloudinary

     const response = await cloudinary.uploader.upload(localFilePath,{
        resource_type: auto
    })
    //File has been uploaded successfully.'
    console.log("File has been uploaded successfully")
    
} catch (error) {
    
fs.unlinkSync(localFilePath) //remove the locally saved temprory file as 
                            //  the upload operation got filed
return null;
}


}