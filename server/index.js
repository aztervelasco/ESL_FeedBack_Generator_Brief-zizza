import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import feedbackRouter from './routes/feedback.js';
import recordsRouter from './routes/records.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());

// Body parser
app.use(express.json());

// API Routes
app.use('/api/feedback', feedbackRouter);
app.use('/api/records', recordsRouter);

// Health check / Root route
app.get('/', (req, res) => {
  res.json({ message: 'ESL Class Observation & Feedback Generator API is running.' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
