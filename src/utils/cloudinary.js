import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        const absolutePath = path.resolve(localFilePath);

        const response = await cloudinary.uploader.upload(
            absolutePath,
            {
                resource_type: "auto"
            }
        );

        // delete local file after upload
        fs.unlinkSync(localFilePath);

        return response;

    } catch (error) {
        console.log("Cloudinary Upload Error:", error);

        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        return null;
    }
};

export { uploadOnCloudinary };