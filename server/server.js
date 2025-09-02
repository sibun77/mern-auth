import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import cookieParser from 'cookie-parser';
import connectDB from './config/mongodb.js';
import authRouter from './routes/authRoute.js'
import userRouter from './routes/userRoutes.js';

const app = express();
const port = process.env.PORT || 4000;
connectDB();

const allowedOrigins = ['http://localhost:5173']

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: allowedOrigins, credentials: true }));

//API Endpoints
app.get('/', (req, res) => res.send("API working"))
app.use('/api/auth', authRouter)
app.use('/api/user', userRouter)


if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000
    server.listen(PORT, () => console.log("Server is running on PORT: " + PORT))
}

//export server for vercel
export default server;