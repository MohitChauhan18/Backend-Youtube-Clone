import {v2 as cloudinary} from "cloudinary"
import fs from "fs"


cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // file has been uploaded successfull
        //console.log("file is uploaded on cloudinary ", response.url);
        fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}

/**
 * Deletes an image from Cloudinary.
 * @param {string} imageUrl - The URL of the image to be deleted.
 * @returns {Promise} - A promise that resolves to the response from Cloudinary if the image is deleted successfully, or null if there is an error or the imageUrl is empty.
 */
const deleteImageOnCloudinary = async (imageUrl) => {
    try {
        // checking loacalpath //
        if (!imageUrl) {
            console.log("image url required");
            return null;
        }

        // getting file id //

        const parts = imageUrl.split("/");
        const idWithExtension = parts[parts.length - 1];
        const idWithoutExtension = idWithExtension.split(".");
        const publicId = idWithoutExtension[0];

        // console.log(publicId);
        // end of getting file id //

        // delete file on cloudinary //
        const responce = await cloudinary.uploader.destroy(publicId);
        if (!responce) {
            console.log("erorr on uploading");
        }

        return responce; // for user
        // end of delete file on cloudinary //
    } catch (error) {
        console.log("error on deleting image on cloudinary:", error);
        fs.unlinkSync(localFilePath);
        return null;
    }
};

export {uploadOnCloudinary, deleteImageOnCloudinry}
