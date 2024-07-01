import { Router } from 'express';
import {
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription,
} from "../controllers/subscription.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
    .route("/c/:channelId")
    .get(getUserChannelSubscribers)//here getUserChannelSubscribers should be used not getUserChannelSubscribers
    .post(toggleSubscription);

router.route("/u/:subscriberId").get(getSubscribedChannels);// here getSubscribedChannels should be used not getUserChannelSubscribers

export default router