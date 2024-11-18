import mongoose, {Schema} from "mongoose"
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2'

let videoSchema = new Schema({

    videoFile: {
        type: String, // cloudinary url
        required: true
        
    }, 

    thumbnail: {
        type: string,
        required: true,
    },

    owner:{ 
        type: Schema.Types.ObjectId,
        ref:User
    }, 

    title: {
        type: String,
        required : true,
    },

    description: {
        type:String
    },
    
    duration: {
        type:Number,
        required: true
    }, //duration in seconds

    views: {
        type:Number,
        default:0,
    },

    isPublished: {
        type:Boolean
    },

    owner : {
        type: Schema.Types.ObjectId
    }
    

},{
    required : true
}
)

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model('Video', videoSchema)