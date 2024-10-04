import multer from "multer"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"

const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        const { username, email } = req.body;

        // Check if the user already exists
        const existedUser = await User.findOne({
            $or: [{ username }, { email }]
        });

        if (existedUser) {
            cb(new ApiError(400, "User already exists, file not stored."));
        } else {
            cb(null, "./public/temp");
        }
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

export const upload = multer({ storage });







// previous code

// import multer from "multer";

// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//       cb(null, "./public/temp")
//     },
//     filename: function (req, file, cb) {
      
//       cb(null, file.originalname)
//     }
//   })
  
// export const upload = multer({ 
//     storage, 
// })