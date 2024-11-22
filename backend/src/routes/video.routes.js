import {Router} from 'express'
const router = Router();
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishAVideo,
    togglePublishStatus,
    updateVideo,
} from "../controllers/video.controller.js"

import { upload } from "../middlewares/multer.middleware.js";
import {verifyJWT} from '../middlewares/auth.middleware.js'


router
    .route('/')
    .get(getAllVideos)
    .post(verifyJWT,
          upload.fields([{ name: "video" }, { name: "thumbnail" }]),
          publishAVideo);

router
    .route('/:videoId')
    .get(getVideoById)
    .delete(deleteVideo)
    .patch(updateVideo)

router
    .route('/toggle/publish/:videoId')
    .patch(togglePublishStatus)


export default router