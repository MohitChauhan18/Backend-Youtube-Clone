import mongoose, { Schema } from "mongoose";

const viewSchema=new Schema({
    viewBy:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },
    videoId:{
        type:Schema.Types.ObjectId,
        ref:"Video"
    }
},{
    timestamps:true
})


export const View=mongoose.model("View",viewSchema)