import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";


const videoSchema = new Schema(
    {
        videoFile:{
            type: String, // cloudinary url
            required:true
        },
        thumbnail:{
            type: String,
            required:true
        },
        title:{
            type: String,
            required:true
        },
        description:{
            type: String,
            required:true
        },
        duration:{
            type: Number,
            required:true
        },//cloudnary url
        views:{
            type: Number,
            default:0
        },
        isPublished:{
            default:true,
            type: Boolean
        },
        owner:{
            type: Schema.Types.ObjectId,
            ref:"user"
        }
    },
    {timestamps:true}
)

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video",videoSchema)