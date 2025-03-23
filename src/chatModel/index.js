const config = require('config');
const logger = require('../utils/logger');
const { initChatModel } = require('langchain/chat_models/universal');

const initializeChatModel = async () => {
    try {
        logger.info('Initializing chat model');
        const model = await initChatModel(config.get('llm.openai.model'), {
            modelProvider: config.get('llm.openai.modelProvider'),
            temperature: config.get('llm.openai.temperature'),
            apiKey: config.get('llm.openai.apiKey')
        });
        return model;
    } catch (error) {
        logger.error('Error initializing chat model');
        throw error;
    }
};

module.exports = initializeChatModel