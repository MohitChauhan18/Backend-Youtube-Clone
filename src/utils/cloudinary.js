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

const deleteFromCloudinary = async(file_public_id) => {
    try {

        if (!file_public_id) {
            console.log("File not found");
            return null;
        }

        const response = await cloudinary.uploader.destroy(file_public_id, {
            resource_type: "auto"
        });

        if (response.result === "ok") {
            console.log(`Successfully deleted file with public ID: ${file_public_id}`);
        } else {
            console.log(`Failed to delete file: ${response.result}`);
        }

        return response;
        
    } catch (error) {
        console.log("error while deleting the file");
        throw error;
    }
}


// extract public_id from url and then use it to delete the file from cloudinary

// const deleteFromCloudinary = async (file_url) => {
//     // Validate the URL
//     if (typeof file_url !== 'string' || !file_url) {
//         console.log("Invalid or missing file URL");
//         return null;
//     }

//     const part = file_url.split('/');
//     const versionIndex = part.findIndex(part => part.startsWith('v'));

//     // Check if version index is found and public_id can be extracted
//     if (versionIndex === -1 || !part[versionIndex + 1]) {
//         console.log("Unable to extract public ID from the file URL");
//         return null;
//     }

//     const public_id = part[versionIndex + 1].split('.')[0];

//     try {
//         if (!public_id) {
//             console.log("File not found");
//             return null;
//         }

//         const response = await cloudinary.uploader.destroy(public_id, {
//             resource_type: "auto"
//         });

//         // Log response for success or failure
//         if (response.result === "ok") {
//             console.log(`Successfully deleted file with public ID: ${public_id}`);
//         } else {
//             console.log(`Failed to delete file: ${response.result}`);
//         }

//         return response;

//     } catch (error) {
//         console.error("Error while deleting the file:", error.message);
//         throw error;
//     }
// };







export {uploadOnCloudinary, deleteFromCloudinary}