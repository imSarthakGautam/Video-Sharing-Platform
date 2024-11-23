import mongoose, { Schema } from "mongoose";
const likeSchema = new Schema({

  isLiked: {
    type:Boolean,
    default:false
  },
  
  video: {
    type: Schema.Types.ObjectId,
    ref: 'Video'
  },
  comment: {
    type: Schema.Types.ObjectId,
    ref: 'Comment'
  },
   
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }

},
{
    timestamps: true
});

export const Like = mongoose.model('Like', likeSchema)