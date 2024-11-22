
// for each particular subscription a document is created

import mongoose,{Schema} from 'mongoose'

let subscriptionSchema = new Schema({
    // one who is subscribing
    subscriber :{
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    //channel/user to whom subscriber is subsribing to.
    channel :{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }

},{
    timestamps:true
})

export const Subscription = mongoose.model('Subscription', subscriptionSchema)

