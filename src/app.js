const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const config = require('config');
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');

const app = express();

// Basic Middleware
app.use(cors(config.get('cors')));
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
const PORT = config.get('server.port');
const HOST = config.get('server.host');

app.listen(PORT, HOST, () => {
  console.log(`Server is running on ${HOST}:${PORT}`);
});

module.exports = app;
