import express from "express";
const router = express.Router();

import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  updateUserAvatar,
  updateUserCoverImage,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  getUserChannelProfile,
  getWatchHistory
} from "../controllers/user.controller.js";

import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

router.route("/register").post(
    upload.fields([{ name: "avatar" }, { name: "coverImage" }]),
    registerUser
  )
  
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);

router
  .route("/avatar")
  .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
router
  .route("/coverImage")
  .patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);

router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/update-account").patch(verifyJWT, updateAccountDetails);
router.route("/update-account").patch(verifyJWT, updateUserCoverImage);


router.route("/c/:username").get(verifyJWT, getUserChannelProfile)
router.route("/history").get(verifyJWT, getWatchHistory)

export default router;
