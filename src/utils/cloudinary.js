import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
import { ApiError } from "./ApiError.js"; 

// 1. Configure Cloudinary inside the function so it catches the .env variables
const uploadOnCloudinary = async (localFilePath) => {
    try {
        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET,
        });

        if (!localFilePath) return null;

        const absolutePath = path.resolve(localFilePath);


        const response = await cloudinary.uploader.upload(absolutePath, {
            resource_type: "auto"
        });

        // delete local file after upload
        fs.unlinkSync(localFilePath);
        return response;

    } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
        return null;
    }
};

const deleteFromCloudinary = async(cloudinaryVideoUrl, resourceType = "video") =>{
    try {
        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET,
        });
    if (!cloudinaryVideoUrl) return null;
    const publicId = cloudinaryVideoUrl.split("/").pop().split(".")[0];

    const response = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType
        });
        

    } catch (error) {
        console.error("Cloudinary Delete Error:", error);
        return null;
        
    }

};
export { uploadOnCloudinary , deleteFromCloudinary };