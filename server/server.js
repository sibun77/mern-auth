import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import cookieParser from 'cookie-parser';
import connectDB from './config/mongodb.js';
import authRouter from './routes/authRoute.js'
import userRouter from './routes/userRoutes.js';

const app = express();
connectDB();

const allowedOrigins = ['https://mern-auth-indol-beta.vercel.app/',['http://localhost:5173/']]
app.use(cors({ origin: allowedOrigins, credentials: true }));

// app.use(cors());

app.use(express.json());
app.use(cookieParser());

//API Endpoints
app.get('/', (req, res) => res.send("API working"))
app.use('/api/auth', authRouter)
app.use('/api/user', userRouter)

// Export the app instance for Vercel
export default app;