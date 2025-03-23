// langgraph-boilerplate.js
const { StateGraph, START, END } = require("@langchain/langgraph");
const logger = require('../utils/logger');
const redditTools = require('../tools/redditTools');
const redis = require('../utils/redisDB');
const { object } = require("zod");

// 1. Define the State Structure
// This is the shared data structure that nodes will read from and update
const StateAnnotation = {
  prompt: String,
  intent: String,
  toolParams: Object,      // Parameters for the tool (e.g., subreddit name)
  toolOutput: Object,      // Output from tools
  finalResponse: String,   // Final response to the user
  chatModel: Object
};

const tools = {
  auth_code_node: new redditTools.authCodeTool(),
  access_token_tool: new redditTools.accessTokenTool(),
  validate_access_token_tool: new redditTools.validateAccessTokenTool(),
  user_info_tool: new redditTools.userInfoTool(),
  user_karma_tool: new redditTools.userKarmaTool(),
  user_trophies_tool: new redditTools.userTrophiesTool(),
  subreddit_posts_tool: new redditTools.subredditPostsTool(),
  user_posts_tool: new redditTools.userPostsTool(),
  user_comments_tool: new redditTools.userCommentsTool(),
  reddit_search_tool: new redditTools.redditSearchTool(),
  reddit_submit_post_tool: new redditTools.redditSubmitPostTool(),
  reddit_submit_comment_tool: new redditTools.redditSubmitCommentTool(),
  reddit_vote_tool: new redditTools.redditVoteTool(),
  reddit_get_comment_tool: new redditTools.redditGetCommentTool(),
  reddit_subscribed_subreddit_tool: new redditTools.redditSubscribedSubredditTool(),
  detect_intent_from_llm_tool: new redditTools.detectIntentFromLLMNode()
};
const accessTokenNode = async (state) => {
  try {
    logger.info('Access Token Node is fired');
    const response = await tools.access_token_tool.call();
    return { toolOutput: response };
  } catch (error) {
    logger.error(`Error firing access token tool: ${error.message}`);
    return { toolOutput: 'error' }
  }
};

const validateAccessTokenNode = async (state) => {
  try {
    logger.info('Validate Access Token Node is fired');
    const response = await tools.validate_access_token_tool.call();
    return { toolOutput: response };
  } catch (error) {
    logger.error(`Error firing validate access token tool: ${error.message}`);
    return { toolOutput: 'error' }
  }
};

const userInfoNode = async (state) => {
  try {
    logger.info('User Info Node is fired');
    const response = await tools.user_info_tool.call();
    return { toolOutput: response };
  } catch (error) {
    logger.error(`Error firing user info tool: ${error.message}`);
    return { toolOutput: 'error' }
  }
};

const userKarmaNode = async (state) => {
  try {
    logger.info('User Karma Node is fired');
    const response = await tools.user_karma_tool.call();
    return { toolOutput: response };
  } catch (error) {
    logger.error(`Error firing user karma tool: ${error.message}`);
    return { toolOutput: 'error' }
  }
};

const userTrophiesNode = async (state) => {
  try {
    logger.info('User Trophies Node is fired');
    const response = await tools.user_trophies_tool.call();
    return { toolOutput: response };
  } catch (error) {
    logger.error(`Error firing user trophies tool: ${error.message}`);
    return { toolOutput: 'error' }
  }
};

const subredditPostsNode = async (state) => {
  try {
    logger.info('Subreddit Posts Node is fired');
    const response = await tools.subreddit_posts_tool.call(state.toolParams);
    return { toolOutput: response };
  } catch (error) {
    logger.error(`Error firing subreddit posts tool: ${error.message}`);
    return { toolOutput: 'error' }
  }
};

const userPostsNode = async (state) => {
  try {
    logger.info('User Posts Node is fired');
    const response = await tools.user_posts_tool.call();
    return { toolOutput: response };
  } catch (error) {
    logger.error(`Error firing user posts tool: ${error.message}`);
    return { toolOutput: 'error' }
  }
};

const userCommentsNode = async (state) => {
  try {
    logger.info('User Comments Node is fired');
    const response = await tools.user_comments_tool.call();
    return { toolOutput: response };
  } catch (error) {
    logger.error(`Error firing user comments tool: ${error.message}`);
    return { toolOutput: 'error' }
  }
};

const redditSearchNode = async (state) => {
  try {
    logger.info('Reddit Search Node is fired');
    const response = await tools.reddit_search_tool.call(state.toolParams);
    return { toolOutput: response };
  } catch (error) {
    logger.error(`Error firing reddit search tool: ${error.message}`);
    return { toolOutput: 'error' }
  }
};

const redditSubmitPostNode = async (state) => {
  try {
    logger.info('Reddit Submit Post Node is fired');
    const response = await tools.reddit_submit_post_tool.call(state.toolParams);
    return { toolOutput: response };
  } catch (error) {
    logger.error(`Error firing reddit submit post tool: ${error.message}`);
    return { toolOutput: 'error' }
  }
};

const redditSubmitCommentNode = async (state) => {
  try {
    logger.info('Reddit Submit Comment Node is fired');
    const response = await tools.reddit_submit_comment_tool.call(state.toolParams);
    return { toolOutput: response };
  } catch (error) {
    logger.error(`Error firing reddit submit comment tool: ${error.message}`);
    return { toolOutput: 'error' }
  }
};

const redditVoteNode = async (state) => {
  try {
    logger.info('Reddit Vote Node is fired');
    const response = await tools.reddit_vote_tool.call(state.toolParams);
    return { toolOutput: response };
  } catch (error) {
    logger.error(`Error firing reddit vote tool: ${error.message}`);
    return { toolOutput: 'error' }
  }
};

const redditGetCommentNode = async (state) => {
  try {
    logger.info('Reddit Get Comment Node is fired');
    const response = await tools.reddit_get_comment_tool.call(state.toolParams);
    return { toolOutput: response };
  } catch (error) {
    logger.error(`Error firing reddit get comment tool: ${error.message}`);
    return { toolOutput: 'error' }
  }
};


const redditSubscribedSubredditNode = async (state) => {
  try {
    logger.info('Reddit Subscribed Subreddit Node is fired');
    const response = await tools.reddit_subscribed_subreddit_tool.call(state.toolParams);
    return { toolOutput: response };
  } catch (error) {
    logger.error(`Error firing reddit subscribed subreddit tool: ${error.message}`);
    return { toolOutput: 'error' }
  }
};

const detectIntentFromLLMNode = async (state) => {
  try {
    logger.info('Detect Intent from LLM Node is fired');
    const response = await tools.detect_intent_from_llm_tool.call(state.toolParams);
    return { toolOutput: response };
  } catch (error) {
    logger.error(`Error firing detect intent from LLM tool: ${error.message}`);
    return { toolOutput: 'error' }
  }
}

const formatData = async(state) => {
  try {
    logger.info('Formatting Data Node is fired');
    const response = await tools.format_data_tool.call(state.toolParams);
    return { toolOutput: response };
  } catch (error) {
    logger.error(`Error firing formatting data tool: ${error.message}`);
    return { toolOutput: 'error' }
  }
};

// 3. Build the Graph
const graph = new StateGraph({ channels: StateAnnotation })


graph.addNode('user_info_node', userInfoNode);

graph.addNode('user_karma_node', userKarmaNode);

graph.addNode('user_trophies_node', userTrophiesNode);

graph.addNode('subreddit_posts_node', subredditPostsNode);

graph.addNode('user_posts_node', userPostsNode);

graph.addNode('user_comments_node', userCommentsNode);

graph.addNode('reddit_search_node', redditSearchNode);

graph.addNode('reddit_submit_post_node', redditSubmitPostNode);

graph.addNode('reddit_submit_comment_node', redditSubmitCommentNode);

graph.addNode('reddit_vote_node', redditVoteNode);

graph.addNode('reddit_get_comment_node', redditGetCommentNode);

graph.addNode('reddit_subscribed_subreddit_node', redditSubscribedSubredditNode);

graph.addNode('detect_intent_from_llm_node', detectIntentFromLLMNode);

graph.addNode('format_data_node', formatData);


// 4. Connect the Nodes
graph.addEdge(START, 'detect_intent_from_llm_node');

graph.addConditionalEdges('detect_intent_from_llm_node', (state) => {
  const { intent, toolOutput } = state;
  if (toolOutput === 'error') return END;
  switch (intent) {
    case 'user_info': return 'user_info_node';
    case 'user_karma': return 'user_karma_node';
    case 'user_trophies': return 'user_trophies_node';
    case 'subreddit_posts': return 'subreddit_posts_node';
    case 'user_posts': return 'user_posts_node';
    case 'user_comments': return 'user_comments_node';
    case 'reddit_search': return 'reddit_search_node';
    case 'submit_post': return 'reddit_submit_post_node';
    case 'submit_comment': return 'reddit_submit_comment_node';
    case 'vote': return 'reddit_vote_node';
    case 'get_comment': return 'reddit_get_comment_node';
    case 'subscribed_subreddits': return 'reddit_subscribed_subreddit_node';
    default: return END; // Unknown intent, end the graph
  }
});


graph.addEdge('user_info_node', 'format_data_node');
graph.addEdge('user_karma_node', 'format_data_node');
graph.addEdge('user_trophies_node', 'format_data_node');
graph.addEdge('subreddit_posts_node', 'format_data_node');
graph.addEdge('user_posts_node', 'format_data_node');
graph.addEdge('user_comments_node', 'format_data_node');
graph.addEdge('reddit_search_node', 'format_data_node');
graph.addEdge('reddit_submit_post_node', 'format_data_node');
graph.addEdge('reddit_submit_comment_node', 'format_data_node');
graph.addEdge('reddit_vote_node', 'format_data_node');
graph.addEdge('reddit_get_comment_node', 'format_data_node');
graph.addEdge('reddit_subscribed_subreddit_node', 'format_data_node');

graph.addEdge('format_data_node', END);


// 5. Compile the Graph
const app = graph.compile();

// 6. Run the Graph
async function runGraph(prompt, chatModel) {
  try {
    // Prefetching of auth code if not present in redis
    const authCode = await redis.get("reddit_auth_code");
    if (!authCode) {
      await tools.auth_code_node.call();
    }
    const accessToken = await redis.get('reddit_access_token');
    if (!accessToken) {
      await tools.access_token_tool.call();
    }
    const username = await redis.get('reddit_username');
    if (!username) {
      await tools.validate_access_token_tool.call();
    }
    // Map the prompt to the state structure expected by StateAnnotation
    const initialState = { prompt, chatModel };
    const result = await app.invoke(initialState);
    logger.info(`Final Output: ${JSON.stringify(result, null, 2)}`);
    return result;
  } catch (error) {
    logger.error(`Error running graph: ${error.message}`);
    // Optionally return an error state or rethrow based on your needs
    return { error: error.message, toolOutput: null, finalResponse: "An error occurred" };
  }
}

module.exports = runGraph;