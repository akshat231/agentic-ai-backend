const { CallbackHandler } =  require("langfuse-langchain");
const config = require ('config');
require('dotenv').config();
 
// Initialize Langfuse callback handler
const langfuseHandler = new CallbackHandler({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: config.get('langfuse.baseUrl')
});

module.exports = langfuseHandler;