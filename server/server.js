import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import cookieParser from 'cookie-parser';
import connectDB from './config/mongodb.js';
import authRouter from './routes/authRoute.js'
import userRouter from './routes/userRoutes.js';

const app = express();
connectDB();

const allowedOrigins = ['https://mern-auth-indol-beta.vercel.app', 'https://mern-auth-indol-beta.vercel.app/' , ]
app.use(cors({ origin: allowedOrigins, credentials: true }));

app.use(express.json());
app.use(cookieParser());


//API Endpoints
app.get('/', (req, res) => res.send("API working"))
app.use('/api/auth', authRouter)
app.use('/api/user', userRouter)


if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000
    app.listen(PORT, () => console.log("Server is running on PORT: " + PORT))
}

//export server for vercel
export default app;