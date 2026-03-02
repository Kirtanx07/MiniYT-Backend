import mongoose, { Schema } from "mongoose";

const userSchema = new mongoose.Schema(
    {username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
    },
    id:{
        type:String,
    },
    watchHistory:{
        type:[{
            type: Schema.Types.ObjectId,
            ref:"Video"
        }]
    },
    fullName:{
        type:String,
        required:true,
        trim:true,
        index:true
    },
    avatar:{
        type:String,
        required:true,
        //cloudnary service
    },
    coverimage:{
        type:String,
        //cloudnary service
    },
    password:{
        type:String,
        //encrpt
        required:[true,'Password is required']
    },
    refreshToken:{
        type:String,

    },
    createdAt:{},
    updatedAt:{}


    },{timestamps:true})

export const User = mongoose.model("user",userSchema)