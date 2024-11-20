import express from 'express'
const router = express.Router();

import {registerUser, loginUser, logoutUser, refreshAccessToken, updateUserAvatar, updateUserCoverImage} from '../controllers/user.controller.js'
import { upload } from '../middlewares/multer.middleware.js';
import {verifyJWT} from '../middlewares/auth.middleware.js';

router.route('/register').post(upload.fields([ {name: 'avatar'}, {name: 'coverImage'} ]), registerUser)
.get((req,res)=>{console.log('hi')})

router.route('/login').post(loginUser)
router.route('/logout').post(verifyJWT, logoutUser)
router.route('/refresh-token').post(refreshAccessToken)
router.route('/avatar').post(verifyJWT,upload.single("avatar"), updateUserAvatar)
router.route('/cover-image').post(verifyJWT,upload.single("coverImage"), updateUserCoverImage)

export default router