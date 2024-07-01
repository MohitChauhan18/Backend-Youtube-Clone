import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const deleteOnCloudinary = async (publicURL) => {

    try {
        const result = await cloudinary.uploader.destroy(publicURL)
        return result
    } catch (error) {
        console.log("error at cloudinarydelete function", error);

    }
}

export { deleteOnCloudinary }