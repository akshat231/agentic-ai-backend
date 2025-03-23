const config = require('config');
const logger = require('../utils/logger');
const  initializeChatModel  = require('../chatModel');
const runGraph = require('../graph/redditLanggraph');

class redditLangraphAgent {
    constructor() {
        this.initialize();
    }

    async initialize() {
        this.chatModel = await initializeChatModel();
        logger.info('Chat model initialized with ' + JSON.stringify(this.chatModel));
    }
    async execute(prompt) {
        try {
            logger.info('execute::reddit-langraph-agent');
            const response = await runGraph(prompt, this.chatModel);
            return response;
        } catch (error) {
            logger.error(`Error executing redditLangraphAgent: ${error.message}`);
            throw error;
        }
    };
};

module.exports = redditLangraphAgent;