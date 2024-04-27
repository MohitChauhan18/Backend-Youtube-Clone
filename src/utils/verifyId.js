import mongoose from "mongoose"
import { ApiError } from "./ApiError.js"

export const verifyId=(id)=>{
    try {
        return new mongoose.Types.ObjectId(id)
    } catch (error) {
        throw new  ApiError(400,"Not a valid Id")
    }
}