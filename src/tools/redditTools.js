const { Tool } = require('@langchain/core/tools')
const { z } = require("zod");
const redis = require("../utils/redisDB");
const logger = require("../utils/logger");
const axios = require('axios');
const config = require('config');
const redditServices = require('../services/redditService');

class redditBaseTools extends Tool {
    constructor({ name, description, schema }) {
        super();
        this.name = name;
        this.description = description;
        this.schema = schema;
        this.redis = redis;
        this.service = redditServices;
      }
}


class authCodeTool extends redditBaseTools {
    constructor() {
        super({
            name: "Get Reddit Auth Code",
            description: "Get Reddit Auth Code and User Permissions",
            schema: z.object({}),
          });
        }
    async call() {
        try {
            logger.info('Auth Code Tool Fired Successfully');
            let authConfig = {
                method: 'get',
                maxBodyLength: Infinity,
                url: `${config.get('server.protocol')}://${config.get('server.host')}:${config.get('server.port')}/api/v1/reddit/auth-code`,
                headers: { }
              };
              const response = await axios.request(authConfig);
              logger.info("response fetched successfully");
              const authCode = await this.waitForAuthCode();
              logger.info('auth code is retrieved and stored in redis successfully');
              return { data: response, description: this.description };
        } catch (error) {
            logger.error('Error in Auth Code Generation: ', error);
            throw error;
        }
    }

    async waitForAuthCode() {
        return new Promise((resolve, reject) => {
            const maxAttempts = 30; // Timeout after ~5 minutes
            let attempts = 0;
    
            const interval = setInterval(async () => {
                try {
                    // Fetch user permission from Redis (correctly using await)
                    const userPermission = await redis.get("user_permission");
    
                    if (userPermission === "true") {
                        const code = await redis.get("reddit_auth_code");
    
                        if (code) {
                            clearInterval(interval);
                            return resolve(code);
                        }
                    } else if (userPermission === "false") {
                        logger.info("User permission denied");
                        clearInterval(interval);
                        return reject(new Error("User denied Reddit authorization")); 
                    } else {
                        logger.info("Waiting for user permission...");
                    }
    
                    attempts++;
                    logger.info(`Waiting for auth code... Attempt ${attempts}/${maxAttempts}`);
    
                    if (attempts >= maxAttempts) {
                        clearInterval(interval);
                        reject(new Error("Timeout waiting for Reddit authorization code"));
                    }
                } catch (error) {
                    clearInterval(interval);
                    reject(error);
                }
            }, 10000); // Check every 10 seconds
        });
    }
}    


class accessTokenTool extends redditBaseTools  {
    constructor() {
        super({
            name: "Get Reddit Access Token",
            description: "Get Reddit Access Token from Auth Code",
            schema: z.object({}),
        });
    }

    async call() {
        try {
            logger.info('Access Token Tool Fired Successfully');
            let accessTokenConfig = {
                method: 'get',
                maxBodyLength: Infinity,
                url: `${config.get('server.protocol')}://${config.get('server.host')}:${config.get('server.port')}/api/v1/reddit/access-token`,
                headers: { }
              };
            const response = await axios.request(accessTokenConfig);
            logger.info(`Reddit access token received: ${response.access_token}`);
            return { data: response, description: this.description };
        } catch (error) {
            logger.error('Error in Access Token Generation');
            throw error;
        }
    }
}

class validateAccessTokenTool extends redditBaseTools {
    constructor() {
        super({
            name: "Validate Reddit Access Token",
            description: "Validate Reddit Access Token",
            schema: z.object({}),
        })
    }

    async call() {
        try {
            logger.info('Validate Access Token Tool Fired Successfully');
            const validateAccessTokenConfig = {
                method: 'get',
                maxBodyLength: Infinity,
                url: `${config.get('server.protocol')}://${config.get('server.host')}:${config.get('server.port')}/api/v1/reddit/validate-access-token`,
                headers: { }
            };
            const response = await axios.request(validateAccessTokenConfig);
            return { data: response, description: this.description };
        } catch (error) {
            logger.error('Error in Validate Access Token');
            throw error;
        }
    }
};

class userInfoTool extends redditBaseTools {
    constructor() {
        super({
            name: "Get Reddit User Info",
            description: "Get Reddit User Info",
            schema: z.object({}),
        });
    };
    async call() {
        try {
            logger.info('User Info Tool Fired Successfully');
            const accessToken = await this.redis.get('reddit_access_token');
            if (!accessToken) {
                throw new Error('Access Token not found in Redis');
            }
            const appName = config.get("reddit.appName");
            const response = await this.service.getUserInfo(accessToken, appName);
            return { data: response, description: this.description};
        } catch (error) {
            logger.error('Error in User Info');
            throw error;
        }
    }
}


class userKarmaTool extends redditBaseTools {
    constructor() {
        super({
            name: "Get Reddit User Karma",
            description: "Get Reddit User Karma",
            schema: z.object({}),
        });
    }

    async call() {
        try {
            logger.info('User Karma Tool Fired Successfully');
            const accessToken = await this.redis.get('reddit_access_token');
            if (!accessToken) {
                throw new Error('Access Token not found in Redis');
            }
            const appName = config.get("reddit.appName");
            const response = await this.service.getUserKarma(accessToken, appName);
            return { data: response, description: this.description };
        } catch (error) {
            logger.error('Error in User Karma');
            throw error;
        }
    }
}

class userTrophiesTool extends redditBaseTools {
    constructor() {
        super({
            name: "Get Reddit User Trophies",
            description: "Get Reddit User Trophies",
            schema: z.object({}),
        });
    }

    async call () {
        try {
            logger.info('User Trophies Tool Fired Successfully');
            const accessToken = await this.redis.get('reddit_access_token');
            if (!accessToken) {
                throw new Error('Access Token not found in Redis');
            }
            const appName = config.get("reddit.appName");
            const response = await this.service.getUserTrophies(accessToken, appName);
            return { data: response, description: this.description };
        } catch (error) {
            logger.error('Error in User Trophies');
            throw error;
        }
    }
}

class subredditPostsTool extends redditBaseTools {
    constructor() {
        super({
            name: "Get Reddit Subreddit Posts",
            description: "Get Reddit Subreddit Posts",
            schema: z.object({
               subreddit: z.string(),
               sort: z.enum(['hot', 'new', 'controversial', 'top']).default('hot'),
               limit: z.number(),
               after: z.string()
            })
        });
    }

    async call({subreddit, sort='hot', limit=10, after=0}) {
        try {
            logger.info('Subreddit Posts Tool Fired Successfully');
            const accessToken = await this.redis.get('reddit_access_token');
            if (!accessToken) {
                throw new Error('Access Token not found in Redis');
            }
            const appName = config.get("reddit.appName");
            const response = await this.service.getSubredditPosts(accessToken,appName, subreddit, sort, limit, after);
            return { data: response, description: this.description };
        } catch (error) {
            logger.error('Error in Subreddit Posts');
            throw error;
        }
    }
}

class userPostsTool extends redditBaseTools {
    constructor() {
        super({
            name: "Get Reddit User Posts",
            description: "Get Reddit User Posts",
            schema: z.object({}),
        });
    }

    async call() {
        try {
            logger.info('User Posts Tool Fired Successfully');
            const accessToken = await this.redis.get('reddit_access_token');
            const redditUsername = await this.redis.get('reddit_username');
            if (!accessToken || !redditUsername) {
                throw new Error('Access Token or reddit username not found in Redis');
            }
            const appName = config.get("reddit.appName");
            const response = await this.service.getUserPosts(accessToken, appName, redditUsername);
            return { data: response, description: this.description };
        } catch (error) {
            logger.error('Error in User Posts');
            throw error;
        }
    }
}

class userCommentsTool extends redditBaseTools {
    constructor() {
        super({
            name: "Get Reddit User Comments",
            description: "Get Reddit User Comments",
            schema: z.object({}),
        });
    }
    async call () {
        try {
            logger.info('User Comments Tool Fired Successfully');
            const accessToken = await this.redis.get('reddit_access_token');
            const redditUsername = await this.redis.get('reddit_username');
            if (!accessToken ||!redditUsername) {
                throw new Error('Access Token or reddit username not found in Redis');
            }
            const appName = config.get("reddit.appName");
            const response = await this.service.getUserComments(accessToken,appName,  redditUsername);
            return { data: response, description: this.description };
        } catch (error) {
            logger.error('Error in User Comments');
            throw error;
        }
    }
}

class redditSearchTool extends redditBaseTools {
    constructor() {
        super({
            name: "Search Reddit",
            description: "Search Reddit",
            schema: z.object({
                query: z.string(),
                sort: z.enum(['hot', 'new', 'controversial', 'top']).default('hot'),
                limit: z.number(),
                after: z.string(),
                subreddit: z.string()
            })
        });
    }

    async call ({query = '', sort = 'hot', limit = 10, after = 0, subreddit}) {
        try {
            logger.info('Reddit Search Tool Fired Successfully');
            const accessToken = await this.redis.get('reddit_access_token');
            if (!accessToken) {
                throw new Error('Access Token not found in Redis');
            }
            const appName = config.get("reddit.appName");
            const response = await this.service.search(accessToken, appName, query, sort, limit, after, subreddit);
            return { data: response, description: this.description };
        } catch (error) {
            logger.error('Error in Reddit Search');
            throw error;
        }
    }
}

class redditSubmitPostTool extends redditBaseTools {
    constructor() {
        super({
            name: "Submit Reddit Post",
            description: "Submit Reddit Post",
            schema: z.object({
                subreddit: z.string(),
                title: z.string(),
                kind: z.enum(['self', 'link']).default('self'),
                text: z.string(),
                nsfw: z.boolean(),
                spoiler: z.boolean(),
                url: z.string(),
                mediaurl: z.string()
            })
        });
    }

    async call ({subreddit, title, kind = 'self', text ,nsfw = false, spoiler = false}) {
        try {
            logger.info('Reddit Post Tool Fired Successfully');
            const accessToken = await this.redis.get('reddit_access_token');
            if (!accessToken) {
                throw new Error('Access Token not found in Redis');
            }
            const appName = config.get("reddit.appName");
            const response = await this.service.post(accessToken, appName, subreddit, title, kind, text, nsfw, spoiler);
            return { data: response, description: this.description };
        } catch (error) {
            logger.error('Error in Reddit Post');
            throw error;
        }
    }
}

class redditSubmitCommentTool extends redditBaseTools {
    constructor() {
        super({
            name: "Submit Reddit Comment",
            description: "Submit Reddit Comment",
            schema: z.object({
                postId: z.string(),
                text: z.string()
            })
        });
    }
    async call ({postId, text = ''}) {
        try {
            logger.info('Reddit Comment Tool Fired Successfully');
            const accessToken = await this.redis.get('reddit_access_token');
            if (!accessToken) {
                throw new Error('Access Token not found in Redis');
            }
            const appName = config.get("reddit.appName");
            const response = await this.service.comment(accessToken,appName, postId, text);
            return { data: response, description: this.description };
        } catch (error) {
            logger.error('Error in Reddit Comment');
            throw error;
        }
    }
}

class redditVoteTool extends redditBaseTools {
    constructor() {
        super({
            name: "Vote on Reddit Submission",
            description: "Vote on Reddit Submission",
            schema: z.object({
                postId: z.string(),
                direction: z.enum(['0', '1', '-1']).default('0') // 0 for upvote, 1 for downvote, -1 for unvote  // default is 0 for upvote
            })
        });
    }

    async call ({postId, direction = '0'}) {
        try {
            logger.info('Reddit Vote Tool Fired Successfully');
            const accessToken = await this.redis.get('reddit_access_token');
            if (!accessToken) {
                throw new Error('Access Token not found in Redis');
            }
            const appName = config.get("reddit.appName");
            const response = await this.service.vote(accessToken, appName, postId, direction);
            return { data: response, description: this.description };
        } catch (error) {
            logger.error('Error in Reddit Vote');
            throw error;
        }
    }
}

class redditGetCommentTool extends redditBaseTools {
    constructor() {
        super({
            name: "Get Reddit Comment",
            description: "Get Reddit Comment",
            schema: z.object({
                postId: z.string(),
                subreddit: z.string(),
                after: z.string(),
                limit: z.number(),
                sort: z.enum(['hot', 'new', 'controversial', 'top']).default('hot')
            })
        });
    }

    async call ({postId,subreddit, after = 0, limit = 10, sort = 'hot'}) {
        try {
            logger.info('Reddit Comment Tool Fired Successfully');
            const accessToken = await this.redis.get('reddit_access_token');
            if (!accessToken) {
                throw new Error('Access Token not found in Redis');
            }
            const appName = config.get("reddit.appName");
            const response = await this.service.getComments(accessToken, appName, postId, after, limit, subreddit, sort);
            return { data: response, description: this.description };
        } catch (error) {
            logger.error('Error in Reddit Comment');
            throw error;
        }
    }
}

class redditSubscribedSubredditTool extends redditBaseTools {
    constructor() {
        super({
            name: "Get Subscribed Subreddits",
            description: "Get Subscribed subreddit",
            schema: z.object({
                limit: z.number() // default is 10
            })
        });
    }

    async call ({limit = 10}) {
        try {
            logger.info('Reddit Subscribed Subreddits Tool Fired Successfully');
            const accessToken = await this.redis.get('reddit_access_token');
            if (!accessToken) {
                throw new Error('Access Token not found in Redis');
            }
            const appName = config.get("reddit.appName");
            const response = await this.service.getSubscribedSubreddits(accessToken, appName, limit);
            return { data: response, description: this.description };
        } catch (error) {
            logger.error('Error in Reddit Subscribed Subreddits');
            throw error;
        }
    }
}

class detectIntentFromLLMTool extends redditBaseTools {
    constructor() {
        super({
            name: "Detect Intent from LLM",
            description: "Detect Intent from LLM",
            schema: z.object({
                prompt: z.string()
            })
        });
    }

    async call ({prompt, chatModel}) {
        try {
            logger.info('Detect Intent from LLM Tool Fired Successfully');
            const response = await this.service.getLLMResult(prompt, chatModel);
            return { data: response, description: this.description };
        } catch (error) {
            logger.error('Error in Detect Intent from LLM');
            throw error;
        }
    }
};

class formatResponseTool extends redditBaseTools {
    constructor() {
        super({
            name: "Format Reddit Response",
            description: "Format Reddit Response",
            schema: z.object({
                response: z.object()
            })
        });
    }

    async call (state) {
        try {
            logger.info('Format Reddit Response Tool Fired Successfully');
            const { toolOutput, intent, description, chatModel } = state;
            const formattedResponse = await this.service.formatResponse(toolOutput, intent, description, chatModel);
            return formattedResponse;
        } catch (error) {
            logger.error('Error in Format Reddit Response');
            throw error;
        }
    }
}

class generateContentTool extends redditBaseTools {
    constructor() {
        super({
            name: "Get content for Posting",
            description: "Generate Passage on user input",
            schema: z.object({
                prompt: z.string()
            })
        });
    }

    async call (state) {
        try {
            logger.info('Get content for Posting Tool Fired Successfully');
            const { toolParams, chatModel } = state;
            const content = await this.service.generateContent(toolParams.prompt, chatModel);
            return content;
        } catch (error) {
            logger.error('Error in Get content for Posting');
            throw error;
        }
    }
}

module.exports = {
    authCodeTool,
    accessTokenTool,
    validateAccessTokenTool,
    userInfoTool,
    userKarmaTool,
    userTrophiesTool,
    subredditPostsTool,
    userPostsTool,
    userCommentsTool,
    redditSearchTool,
    redditSubmitPostTool,
    redditSubmitCommentTool,
    redditVoteTool,
    redditGetCommentTool,
    redditSubscribedSubredditTool,
    detectIntentFromLLMTool,
    formatResponseTool,
    generateContentTool
}