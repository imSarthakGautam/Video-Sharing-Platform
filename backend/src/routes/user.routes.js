import express from 'express'
const router = express.Router();

import {registerUser, loginUser, logoutUser} from '../controllers/user.controller.js'
import { upload } from '../middlewares/multer.middleware.js';
import {verifyJWT} from '../middlewares/auth.middleware.js';

router.route('/register').post(upload.fields([ {name: 'avatar'}, {name: 'coverImage'} ]), registerUser)
.get((req,res)=>{console.log('hi')})

router.route('/login').post(loginUser)
router.route('/logout').post(verifyJWT, logoutUser)

export default router