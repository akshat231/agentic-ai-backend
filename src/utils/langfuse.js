const { CallbackHandler } =  require("langfuse-langchain");
const config = require ('config');
 
// Initialize Langfuse callback handler
const langfuseHandler = new CallbackHandler({
  publicKey: config.get('langfuse.publicKey'),
  secretKey: config.get('langfuse.secretKey'),
  baseUrl: config.get('langfuse.baseUrl')
});

module.exports = langfuseHandler;