import app from './app.js';
const serverless = require('serverless-http');

module.exports = serverless(app);
