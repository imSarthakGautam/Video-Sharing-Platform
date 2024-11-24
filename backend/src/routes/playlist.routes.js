import {Router} from 'express'
const router = Router();
import {verifyJWT} from '../middlewares/auth.middleware.js'
import {
  addVideoToPlaylist,
  deletePlaylist,
  createPlaylist,
  removeVideoFromPlaylist,
  updatePlaylist,
  getPlaylistById,
  getUserPlaylists,
} from "../controllers/playlist.controller.js";

router.route('/create-playlist')
    .post(verifyJWT, createPlaylist)

router.route('/get-playlist/:playlistId/add-video/:videoId')
    .patch(verifyJWT, addVideoToPlaylist) 

router.route('/get-playlist/:playlistId/remove-video/:videoId')
    .patch(verifyJWT, removeVideoFromPlaylist) 

router.route('/get-playlist/p/:playlistId')
    .get(verifyJWT, getPlaylistById)

router.route('/get-playlist/u/:userId')
    .get(verifyJWT, getUserPlaylists)

router.route('/delete-playlist/:playlistId')
    .delete(verifyJWT, deletePlaylist)

router.route('/update-playlist/:playlistId')
    .patch(verifyJWT, updatePlaylist)

export default router