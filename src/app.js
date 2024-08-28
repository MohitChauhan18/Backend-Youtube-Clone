import cors from 'cors'
import cookieParser from 'cookie-parser' //server can access coookies of users browser and perform CRUD
import express from 'express'
const app = express()


// "use" method is mostly used for middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN, // allow to server to accept request from different origin
    credentials: true
}))

app.use(express.json({ limit: '16kb' })) // get data in form of json and limit is 16kb
app.use(express.urlencoded({ extended: true, limit: '16kb' })) // use to encode data in url %20 + * -  with extended object(nested object)
app.use(express.static('public')) //create folder for files like pdf, img
app.use(cookieParser()) //server can access coookies of users browser and perform CRUD

// routes import
import userRouter from './routes/user.routes.js'
import videoRouter from './routes/video.routes.js'
import subscriptionRouter from './routes/subscription.routes.js'
import commentRouter from "./routes/comment.routes.js"
import dashboardRouter from "./routes/dashboard.routes.js"
import likeRouter from "./routes/like.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
import healthcheckRouter from './routes/healthcheck.routes.js'

// routes declaration
app.use('/api/v1/users', userRouter) // when user hit the url with /api/v1//users then it will go to userRouter
app.use('/api/v1/video', videoRouter) // when user hit the url with /api/v1//video then it will go to videoRouter
app.use('/api/v1/subs', subscriptionRouter)
app.use('/api/v1/comment', commentRouter)
app.use('/api/v1/dashboard', dashboardRouter)
app.use('/api/v1/like', likeRouter)
app.use('/api/v1/tweet', tweetRouter)
app.use('/api/v1/playlist', playlistRouter)
app.use('/api/v1/healthcheck', healthcheckRouter)

export default app
