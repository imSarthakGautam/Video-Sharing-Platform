import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser'


const app = express()

//-----------middlewares--------------
app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials: true
}))

// to parse json into JS-Objects
app.use(express.json({
    limit:'16kb'
}))

// name=Bob&age=25--> {name:'Bob, age:'25'}
app.use(express.urlencoded({
    extended:true,
    limit:'16kb'
}))

//to store assets like image, favicons
app.use(express.static('public'))

// to access and set user's browser cookies from server
app.use(cookieParser())



//----ROUTES IMPORT
import userRouter from './routes/user.routes.js'
import videoRouter from './routes/video.routes.js'
import playlistRouter from './routes/playlist.routes.js'
import commentRouter from './routes/comment.routes.js'
import likeRouter from './routes/like.routes.js'
import subscriptionRouter from './routes/subscription.routes.js'

//---ROUTES DECLARATION
app.use('/api/v1/users', userRouter)
app.use('/api/v1/videos', videoRouter)
app.use('/api/v1/playlists', playlistRouter)
app.use('/api/v1/comments', commentRouter)
app.use('/api/v1/likes', likeRouter)

app.get('/', (req,res)=>{
    console.log('home reached')
    res.send(200)
})


export {app}