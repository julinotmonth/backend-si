/**
 * SI-DIROK Backend API
 * Sistem Informasi Diagnosis Penyakit Akibat Rokok
 * 
 * Express.js REST API with SQLite database
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import database initialization
import { initDatabase } from './config/database.js';

// Import routes
import {
  authRoutes,
  symptomsRoutes,
  diseasesRoutes,
  rulesRoutes,
  diagnosisRoutes,
  educationRoutes,
  adminRoutes,
  contactRoutes
} from './routes/index.js';

// Import middleware
import { notFound, errorHandler } from './middleware/errorHandler.js';

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging in development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/symptoms', symptomsRoutes);
app.use('/api/diseases', diseasesRoutes);
app.use('/api/rules', rulesRoutes);
app.use('/api/diagnosis', diagnosisRoutes);
app.use('/api/education', educationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'SI-DIROK API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to SI-DIROK API',
    version: '1.0.0',
    endpoints: {
      auth: {
        'POST /api/auth/register': 'Register new user',
        'POST /api/auth/login': 'Login user',
        'GET /api/auth/me': 'Get current user profile',
        'PUT /api/auth/profile': 'Update profile',
        'PUT /api/auth/password': 'Change password'
      },
      symptoms: {
        'GET /api/symptoms': 'Get all symptoms',
        'GET /api/symptoms/categories': 'Get symptom categories',
        'GET /api/symptoms/:id': 'Get symptom by ID'
      },
      diseases: {
        'GET /api/diseases': 'Get all diseases',
        'GET /api/diseases/:id': 'Get disease by ID'
      },
      rules: {
        'GET /api/rules': 'Get all rules',
        'GET /api/rules/:id': 'Get rule by ID'
      },
      diagnosis: {
        'POST /api/diagnosis': 'Process diagnosis',
        'GET /api/diagnosis/history': 'Get diagnosis history'
      },
      education: {
        'GET /api/education': 'Get all articles',
        'GET /api/education/:idOrSlug': 'Get article'
      },
      contact: {
        'POST /api/contact': 'Submit contact message'
      }
    }
  });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Initialize database before starting server
    await initDatabase();
    
    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🏥 SI-DIROK Backend API                                 ║
║   Sistem Informasi Diagnosis Penyakit Akibat Rokok        ║
║                                                           ║
║   Server running on: http://localhost:${PORT}              ║
║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(28)}║
║                                                           ║
║   API Documentation: http://localhost:${PORT}/api          ║
║   Health Check: http://localhost:${PORT}/api/health        ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
