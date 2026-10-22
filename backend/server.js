import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import facultyRoutes from './routes/faculty.js';
import subjectRoutes from './routes/subject.js';
import classRoutes from './routes/class.js';
import allocationRoutes from './routes/allocation.js';
import timetableRoutes from './routes/timetable.js';
import settingsRoutes from './routes/settings.js';
import Faculty from './models/Faculty.js';
import seedData from './utils/seeder.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB and auto-seed if empty
connectDB().then(async () => {
  try {
    const facultyCount = await Faculty.countDocuments();
    if (facultyCount === 0) {
      console.log('Database is empty. Running initial seeding...');
      await seedData();
      console.log('Initial database seeding completed successfully!');
    }
  } catch (err) {
    console.error('Auto-seed check error:', err.message);
  }
});

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/allocations', allocationRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/settings', settingsRoutes);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static assets if client/dist exists (production)
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('College Timetable Management API is running...');
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: err.message || 'An internal server error occurred.',
    stack: process.env.NODE_ENV === 'development' ? err.stack : {}
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
