//require('dotenv').config({path: './env'})
import dotenv from 'dotenv'
import connectDB from './db/mongoose-connection.js';
import { app } from './app.js';

dotenv.config({
    path: './env'
})
let port = process.env.PORT || 8000;

connectDB()
.then(()=>{
    app.listen(port, ()=>{
        console.log(`Server is running at port ${port}`)
    })
})
.catch((err)=>{
    console.log('MongoDB connection failed :', err)
});