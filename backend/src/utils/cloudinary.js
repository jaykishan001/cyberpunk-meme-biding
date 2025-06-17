import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (localFilePath, folder = "memes") => {
  try {
    if (!localFilePath) return null;

    const result = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "image",
      folder,
    });

    fs.unlinkSync(localFilePath); 
    return result.secure_url;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    throw error;
  }
};
