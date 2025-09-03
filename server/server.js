import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import cookieParser from 'cookie-parser';
import connectDB from './config/mongodb.js';
import authRouter from './routes/authRoute.js';
import userRouter from './routes/userRoutes.js';

const app = express();
const port = process.env.PORT || 5000;

connectDB();

// Detect environment
const isProd = process.env.NODE_ENV === 'production';

// Allowed frontend URLs
const allowedOrigin = isProd
  ? 'https://mern-auth-indol-beta.vercel.app' // your deployed frontend
  : 'http://localhost:5174';                  // vite dev server

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true, // required for cookies
  })
);

// API Endpoints
app.get('/', (req, res) => res.send('API working'));
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);

// Start server in dev (Vercel handles prod)
if (!isProd) {
  app.listen(port, () => console.log(`Server started on PORT: ${port}`));
}

export default app;
