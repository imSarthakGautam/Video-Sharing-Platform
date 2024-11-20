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


router
    .route('/')
    .get(getAllVideos)
    .post(publishAVideo);

router
    .route('/:videoId')
    .get(getVideoById)
    .delete(deleteVideo)
    .patch(updateVideo)

router
    .route('/toggle/publish/:videoId')
    .patch(togglePublishStatus)


export default router