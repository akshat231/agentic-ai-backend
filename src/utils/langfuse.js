const { Langfuse } = require("langfuse");
const config = require('config');

const langfuse = new Langfuse({
  secretKey: config.get('langfuse.secretKey'),
  publicKey: config.get('langfuse.publicKey'),
  baseUrl: config.get('langfuse.baseUrl'),
});

module.exports = langfuse;
