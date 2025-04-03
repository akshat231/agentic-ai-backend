// redditAgentRunner.js
const logger = require("../utils/logger");
const { redditLangraphAgent } = require('../agent');

const processUserPrompt = async (prompt) => {
  try {
    logger.info('process-user-prompt::agent-runner');
    const redditAgent = new redditLangraphAgent();
    await redditAgent.initialize();
    const response = await redditAgent.execute(prompt);
    return response;
  } catch (error) {
    logger.error(`Error in processUserPrompt: ${error.message}`);
    throw error;
  }
};

module.exports = { processUserPrompt };