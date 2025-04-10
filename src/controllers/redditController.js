const logger = require("../utils/logger");
const redditService = require("../services/redditService");
const config = require('config');
const redis = require("../utils/redisDB");
const redditAgentRunner = require("../agentRunner/redditAgentRunner")
require('dotenv').config();

const fetchAccessToken  =  async() => {
    try {
        logger.info('access-token::controller');
        const clientId = process.env.REDDIT_CLIENT_ID;
        const redirectUri = process.env.REDDIT_REDIRECT_URI
        const authCode = await redis.get("reddit_auth_code");
        logger.info(`Reddit auth code: ${authCode}`);
        const response = await redditService.fetchAccessToken(authCode, redirectUri, clientId);
        return response;
    } catch (error) {
        throw error;
    }
};

const validateAccessToken = async (accessToken) => {
    try {
        const appName = config.get("reddit.appName");
        logger.info('validate-access-token::controller');
        const response = await redditService.validateAccessToken(accessToken, appName);
        return response;
    } catch (error) {
        throw error;
    }
}

const getUserInfo = async (accessToken) => {
    try {
        logger.info('get-user-info::controller');
        const appName = config.get("reddit.appName");
        const response = await redditService.getUserInfo(accessToken, appName);
        return response;
    } catch (error) {
        throw error;
    }
}

const getUserKarma = async (accessToken) => {
    try {
        logger.info('get-user-karma::controller');
        const appName = config.get("reddit.appName");
        const response = await redditService.getUserKarma(accessToken, appName);
        return response;
    } catch (error) {
        throw error;
    }
}   

const getUserTrophies = async (accessToken) => {
    try {
        logger.info('get-user-trophies::controller');
        const appName = config.get("reddit.appName");
        const response = await redditService.getUserTrophies(accessToken, appName);
        return response;
    } catch (error) {
        throw error;
    }
}

const getSubredditPosts = async (accessToken, subreddit, sort, limit, after) => {
    try {
        logger.info('get-hot-posts::controller');
        const appName = config.get("reddit.appName");
        const response = await redditService.getSubredditPosts(accessToken, appName, subreddit, sort, limit, after);
        return response;
    } catch (error) {
        throw error;
    }
}

const getUserPosts = async (accessToken, username) => {
    try {
        logger.info('get-user-posts::controller');
        const appName = config.get("reddit.appName");
        const response = await redditService.getUserPosts(accessToken, appName, username);
        return response;
    } catch (error) {
        throw error;
    }
}


const getUserComments = async (accessToken, username) => {
    try {
        logger.info('get-user-comments::controller');
        const appName = config.get("reddit.appName");
        const response = await redditService.getUserComments(accessToken, appName, username);
        return response;
    } catch (error) {
        throw error;
    }
}

const search = async (accessToken, query, sort, limit, after, subreddit) => {
    try {
        logger.info('search::controller');
        const appName = config.get("reddit.appName");
        const response = await redditService.search(accessToken, appName, query, sort, limit, after, subreddit);
        return response;
    } catch (error) {
        throw error;
    }
};

// const post = async (accessToken, subreddit, title, kind, text, url, mediaurl, nsfw, spoiler) => {
//     try {
//         logger.info('post::controller');
//         const appName = config.get("reddit.appName");
//         const response = await redditService.post(accessToken, appName, subreddit, title, kind, text, url, mediaurl, nsfw, spoiler);
//         return response;
//     } catch (error) {
//         throw error;
//     }
// };


const post = async (accessToken, subreddit, title, kind, text, nsfw, spoiler) => {
    try {
        logger.info('post::controller');
        const appName = config.get("reddit.appName");
        const response = await redditService.post(accessToken, appName, subreddit, title, kind, text, url, mediaurl, nsfw, spoiler);
        return response;
    } catch (error) {
        throw error;
    }
};

const comment = async (accessToken, postId, text) => {
    try {
        logger.info('comment::controller');
        const appName = config.get("reddit.appName");
        const response = await redditService.comment(accessToken, appName, postId, text);
        return response;
    } catch (error) {
        throw error;
    }
};

const vote = async (accessToken, postId, voting) => {
    try {
        logger.info('vote::controller');
        const appName = config.get('reddit.appName');
        const response = await redditService.vote(accessToken, appName, postId, voting);
        return response;
    } catch (error) {
        throw error;
    }
};

const getComments = async (accessToken, postId, after, limit, subreddit, sort) => {
    try {
        logger.info('get-comments::controller');
        const appName = config.get("reddit.appName");
        const modifiedPostId = postId.split('_')[1];
        const response = await redditService.getComments(accessToken, appName, modifiedPostId, after, limit, subreddit, sort);
        return response;
    } catch (error) {
        throw error;
    }
};

const getSubscribedSubreddits = async (accessToken, limit) => {
    try {
        logger.info('get-subscribed-subreddits::controller');
        const appName = config.get("reddit.appName");
        const response = await redditService.getSubscribedSubreddits(accessToken, appName, limit);
        return response;
    } catch (error) {
        throw error;
    }
};

const processUserPrompt = async (body) => {
    try {
        logger.info('process-user-prompt::controller');
        const { prompt } = body;
        const response = await redditAgentRunner.processUserPrompt(prompt);
        return response;
    } catch (error) {
        throw error;
    }
};

const testLLMResult = async (body, chatModel) => {
    try {
        logger.info('get-llm-result::controller');
        const { prompt } = body;
        const response = await redditService.testLLMResult(prompt, chatModel);
        return response;
    } catch (error) {
        throw error;
    }
};


const getLLMResult = async (body, chatModel) => {
    try {
        logger.info('get-llm-result::controller');
        const { prompt } = body;
        const response = await redditService.getLLMResult(prompt, chatModel);
        return response;
    } catch (error) {
        throw error;
    }
};

const formatResponse = async (body, chatModel) => {
    try {
        logger.info('format-response::controller');
        const { toolOutput, intent, toolDescription } = body;
        const formattedResponse = await redditService.formatResponse(toolOutput, intent, toolDescription, chatModel);
        return formattedResponse;
    } catch (error) {
        throw error;
    }
};

const generateContent = async (body, chatModel) => {
    try {
        logger.info('get-post-data::controller');
        const { prompt } = body;
        const postData = await redditService.generateContent(prompt, chatModel);
        return postData;
    } catch (error) {
        throw error;
    }
};

module.exports = {
    fetchAccessToken,
    validateAccessToken,
    getUserInfo,
    getUserKarma,
    getUserTrophies,
    getSubredditPosts,
    getUserPosts,
    getUserComments,
    search,
    post,
    comment,
    vote,
    getComments,
    getSubscribedSubreddits,
    processUserPrompt,
    testLLMResult,
    getLLMResult,
    formatResponse,
    generateContent
};

