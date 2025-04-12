const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const config = require('config');
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');
require('dotenv').config();

const app = express();


const allowedOrigins = [
  process.env.REQUEST_ORIGIN || '*'
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
//Basic Middleware
app.use(cors(corsOptions));
app.use(helmet());
app.use(morgan(config.get('logging.format')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const apiRouter = express.Router();

// Public routes
apiRouter.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Protected routes - Add auth middleware
// apiRouter.use(authMiddleware); // All routes below this will require authentication
// Add your protected routes here

// Mount routes
app.use(config.get('api.prefix'), apiRouter);
apiRouter.use('/v1', routes);

// Remove the old error handling middleware
// and replace with the new error handler
app.use(errorHandler);

// Server setup
const PORT = process.env.PORT || config.get('server.port');
const HOST = process.env.HOST || config.get('server.host');

app.listen(PORT, HOST, () => {
  console.log(`Server is running on ${HOST}:${PORT}`);
});

module.exports = app;
