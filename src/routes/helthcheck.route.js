import { Router } from "express";
import {verifyJwt} from "../middlewares/auth.middleware"
import { healthcheck } from "../controllers/helthcheck.controller";
const router = Router()

router.route("/helth-check").get(verifyJwt,healthcheck)
export default router