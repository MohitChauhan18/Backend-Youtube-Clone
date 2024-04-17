import { v2 as cloudinary } from "cloudinary"
import fs from "fs"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        //upload the file on cloudinary
        return await cloudinary.uploader.upload(localFilePath, {
            folder: "Merntube",
            resource_type: "auto"
        })

    } catch (error) {
        console.log(error)
        return null;
    } finally {
        fs.unlinkSync(localFilePath)
    }
}

const deleteOnCloudinary = async (url, resource_type = "image") => {
    const publicId = `${url.split("/")[7]}/${url.split("/")[8].split(".")[0]}`
    try {
        return await cloudinary.uploader.destroy(publicId, { resource_type })
    } catch (error) {
        return null
    }
}

export { uploadOnCloudinary, deleteOnCloudinary }