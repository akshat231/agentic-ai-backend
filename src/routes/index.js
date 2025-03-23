const express = require('express');
const router = express.Router();

const redditRoutes = require('./redditRoutes');

router.use('/reddit', redditRoutes);

module.exports = router;
