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

export {app}