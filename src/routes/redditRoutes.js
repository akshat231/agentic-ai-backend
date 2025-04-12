const express = require("express");
const multer = require("multer");
const upload = multer();
const router = express.Router();
const config = require("config");
const logger = require("../utils/logger");
const ApiResponse = require("../utils/apiResponse");
const redis = require("../utils/redisDB");
const redditController = require("../controllers/redditController");
const initializeChatModel = require("../chatModel");
require("dotenv").config();
// Route to initiate Reddit OAuth by opening the browser

// Route to handle the OAuth callback from Reddit
router.get("/callback", (req, res, next) => {
  try {
    logger.info("Reddit callback received", { query: req.query });
    const { code, state, error } = req.query;

    // Check for OAuth errors
    if (error) {
      logger.error(`Reddit OAuth error:", ${error}`);
      return res
        .status(400)
        .json(ApiResponse.error(`OAuth error: ${error}`, 400));
    }

    // Validate the authorization code and state
    if (!code || state !== config.get("reddit.state")) {
      logger.warn("Invalid authorization attempt", {
        state,
        expectedState: config.get("reddit.state"),
      });
      return res
        .status(400)
        .json(
          ApiResponse.error("Invalid authorization code or state mismatch", 400)
        );
    }

    // Success: Authorization code received
    logger.info(`Reddit authorization code received: ${code}`);
    redis.set("user_permission", true);
    redis.expire("user_permission", 300);
    redis.set("reddit_auth_code", code);
    redis.expire("reddit_auth_code", 300);
    logger.info("Reddit authorization code stored in Redis");
    return res
      .status(200)
      .json(
        ApiResponse.success("Reddit authorization code received", { code })
      );
  } catch (error) {
    redis.set("user_permission", false);
    redis.expire("user_permission", 300);
    logger.error(`Error in Reddit callback", ${error.message}`);
    return res
      .status(500)
      .json(ApiResponse.error("Internal server error", 500));
  }
});

router.get("/access-token", async (req, res, next) => {
  try {
    const response = await redditController.fetchAccessToken();
    logger.info(`Reddit access token received: ${response.access_token}`);
    redis.set("reddit_access_token", response.access_token);
    redis.expire("reddit_access_token", 3600); // Expire in 1 hour
    return res
      .status(200)
      .json(ApiResponse.success("Reddit access token received", response));
  } catch (error) {
    logger.error(`Error in Reddit access token", ${error.message} `);
    return res
      .status(500)
      .json(ApiResponse.error("Internal server error", 500));
  }
});

router.get("/validate-access-token", async (req, res, next) => {
  try {
    const accessToken = await redis.get("reddit_access_token");
    if (!accessToken) {
      return res.status(401).json(ApiResponse.error("Unauthorized", 401));
    }
    const response = await redditController.validateAccessToken(accessToken);
    logger.info("setting Reddit Username in redis");
    redis.set("reddit_username", response.username);
    redis.expire("reddit_username", 3600); //expire in 1 hour
    return res
      .status(200)
      .json(ApiResponse.success("Access token validated", response));
  } catch (error) {
    logger.error(`Error in validate-access-token", ${error.message} `);
    return res
      .status(500)
      .json(ApiResponse.error("Internal server error", 500));
  }
});

router.get("/get-user-info", async (req, res, next) => {
  try {
    const accessToken = await redis.get("reddit_access_token");
    if (!accessToken) {
      logger.error("Access token not found");
      return res.status(401).json(ApiResponse.error("Unauthorized", 401));
    }
    const response = await redditController.getUserInfo(accessToken);
    return res
      .status(200)
      .json(ApiResponse.success("User info fetched", response));
  } catch (error) {
    logger.error(`Error in get-user-info", ${error.message} `);
    return res.status(500);
  }
});

router.get("/get-user-karma", async (req, res, next) => {
  try {
    const accessToken = await redis.get("reddit_access_token");
    if (!accessToken) {
      logger.error("Access token not found");
      return res.status(401).json(ApiResponse.error("Unauthorized", 401));
    }
    const response = await redditController.getUserKarma(accessToken);
    return res
      .status(200)
      .json(ApiResponse.success("User karma fetched", response));
  } catch (error) {
    logger.error(`Error in get-user-karma", ${error.message} `);
    return res
      .status(500)
      .json(ApiResponse.error("Internal server error", 500));
  }
});

router.get("/get-user-trophies", async (req, res, next) => {
  try {
    const accessToken = await redis.get("reddit_access_token");
    if (!accessToken) {
      logger.error("Access token not found");
      return res.status(401).json(ApiResponse.error("Unauthorized", 401));
    }
    const response = await redditController.getUserTrophies(accessToken);
    return res
      .status(200)
      .json(ApiResponse.success("User trophies fetched", response));
  } catch (error) {
    logger.error(`Error in get-user-trophies", ${error.message} `);
    return res
      .status(500)
      .json(ApiResponse.error("Internal server error", 500));
  }
});

router.get("/get-subreddit-posts", async (req, res, next) => {
  try {
    const accessToken = await redis.get("reddit_access_token");
    if (!accessToken) {
      logger.error("Access token not found");
      return res.status(401).json(ApiResponse.error("Unauthorized", 401));
    }
    const { subreddit, sort, limit, after } = req.query;
    const response = await redditController.getSubredditPosts(
      accessToken,
      subreddit,
      sort,
      limit,
      after
    );
    return res
      .status(200)
      .json(ApiResponse.success("Hot posts fetched", response));
  } catch (error) {
    logger.error(`Error in get-hot-posts", ${error.message} `);
    return res.status(500);
  }
});

router.get("/get-user-posts", async (req, res, next) => {
  try {
    logger.info("Obtaining data from redis");
    const accessToken = await redis.get("reddit_access_token");
    const username = await redis.get("reddit_username");
    if (!accessToken || !username) {
      logger.error("Access token or username not found");
      return res.status(401).json(ApiResponse.error("Unauthorized", 401));
    }
    const response = await redditController.getUserPosts(accessToken, username);
    return res
      .status(200)
      .json(ApiResponse.success("User posts fetched", response));
  } catch (error) {
    logger.error(`Error in get-user-posts", ${error.message} `);
    return res
      .status(500)
      .json(ApiResponse.error("Internal server error", 500));
  }
});

router.get("/get-user-comments", async (req, res, next) => {
  try {
    logger.info("Obtaining data from redis");
    const accessToken = await redis.get("reddit_access_token");
    const username = await redis.get("reddit_username");
    if (!accessToken || !username) {
      logger.error("Access token or username not found");
      return res.status(401).json(ApiResponse.error("Unauthorized", 401));
    }
    const response = await redditController.getUserComments(
      accessToken,
      username
    );
    return res
      .status(200)
      .json(ApiResponse.success("User comments fetched", response));
  } catch (error) {
    logger.error(`Error in get-user-comments", ${error.message}`);
    return res
      .status(500)
      .json(ApiResponse.error("internal server error", 500));
  }
});

router.get("/search", async (req, res, next) => {
  try {
    const accessToken = await redis.get("reddit_access_token");
    if (!accessToken) {
      logger.error("Access token not found");
      return res.status(401).json(ApiResponse.error("Unauthorized", 401));
    }
    const { query, sort, limit, after, subreddit } = req.query;
    const response = await redditController.search(
      accessToken,
      query,
      sort,
      limit,
      after,
      subreddit
    );
    return res
      .status(200)
      .json(ApiResponse.success("Search results fetched", response));
  } catch (error) {
    logger.error(`Error in search", ${error.message}`);
    return res
      .status(500)
      .json(ApiResponse.error("Internal server error", 500));
  }
});

router.post("/post", upload.single("mediaurl"), async (req, res, next) => {
  try {
    const accessToken = await redis.get("reddit_access_token");
    if (!accessToken) {
      logger.error("Access token not found");
      return res.status(401).json(ApiResponse.error("Unauthorized", 401));
    }
    const { subreddit, title, kind, text, url, nsfw, spoiler } = req.body;
    const mediaurl = req.file; // This is correct for multer single upload
    const response = await redditController.post(
      accessToken,
      subreddit,
      title,
      kind,
      text,
      url,
      mediaurl,
      nsfw,
      spoiler
    );
    return res.status(200).json(ApiResponse.success("Post created", response));
  } catch (error) {
    logger.error(`Error in post: ${error.message}`);
    return res
      .status(500)
      .json(ApiResponse.error("Internal server error", 500));
  }
});

router.post("/comment", async (req, res, next) => {
  try {
    const accessToken = await redis.get("reddit_access_token");
    if (!accessToken) {
      logger.error("Access token not found");
      return res.status(401).json(ApiResponse.error("Unauthorized", 401));
    }
    const { thing_id, text } = req.body;
    const response = await redditController.comment(
      accessToken,
      thing_id,
      text
    );
    return res
      .status(200)
      .json(ApiResponse.success("Comment created", response));
  } catch (error) {
    logger.error(`Error in comment: ${error.message}`);
    return res
      .status(500)
      .json(ApiResponse.error("Internal server error", 500));
  }
});

router.post("/vote", async (req, res, next) => {
  try {
    const accessToken = await redis.get("reddit_access_token");
    if (!accessToken) {
      logger.error("Access token not found");
      return res.status(401).json(ApiResponse.error("Unauthorized", 401));
    }
    const { thing_id, dir } = req.body;
    const response = await redditController.vote(accessToken, thing_id, dir);
    return res.status(200).json(ApiResponse.success("Vote Done", response));
  } catch (error) {
    logger.error(`Error in vote: ${error.message}`);
    return res
      .status(500)
      .json(ApiResponse.error("Internal server error", 500));
  }
});

router.get("/get-comments", async (req, res, next) => {
  try {
    const accessToken = await redis.get("reddit_access_token");
    if (!accessToken) {
      logger.error("Access token not found");
      return res.status(401).json(ApiResponse.error("Unauthorized", 401));
    }
    const { post_id, after, limit, subreddit, sort } = req.query;
    const response = await redditController.getComments(
      accessToken,
      post_id,
      after,
      limit,
      subreddit,
      sort
    );
    return res
      .status(200)
      .json(ApiResponse.success("Comments fetched", response));
  } catch (error) {
    logger.error(`Error in getting comments: ${error.message}`);
    return res
      .status(500)
      .json(ApiResponse.error("Internal server error", 500));
  }
});

router.get("/get-subscribed-subreddits", async (req, res, next) => {
  try {
    const accessToken = await redis.get("reddit_access_token");
    if (!accessToken) {
      logger.error("Access token not found");
      return res.status(401).json(ApiResponse.error("Unauthorized", 401));
    }
    const { limit } = req.query;
    const response = await redditController.getSubscribedSubreddits(
      accessToken,
      limit
    );
    return res
      .status(200)
      .json(ApiResponse.success("Subscribed subreddits fetched", response));
  } catch (error) {
    logger.error(`Error in getting subscribed subreddits: ${error.message}`);
    return res
      .status(500)
      .json(ApiResponse.error("Internal server error", 500));
  }
});

router.post("/process-user-prompt", async (req, res) => {
  try {
    const response = await redditController.processUserPrompt(req.body);
    return res
      .status(200)
      .json(ApiResponse.success("User prompt processed", response));
  } catch (error) {
    logger.error(`Error in processing user prompt: ${error.message}`);
    return res
      .status(500)
      .json(ApiResponse.error("Internal server error", 500));
  }
});

router.post("/test-llm-result", async (req, res, next) => {
  try {
    const chatModel = await initializeChatModel();
    const response = await redditController.testLLMResult(req.body, chatModel);
    return res
      .status(200)
      .json(ApiResponse.success("LLM result fetched", response));
  } catch (error) {
    logger.error(`Error in getting LLM result: ${error.message}`);
    return res
      .status(500)
      .json(ApiResponse.error("Internal server error", 500));
  }
});

router.post("/get-llm-result", async (req, res, next) => {
  try {
    const chatModel = await initializeChatModel();
    const response = await redditController.getLLMResult(req.body, chatModel);
    return res
      .status(200)
      .json(ApiResponse.success("LLM result fetched", response));
  } catch (error) {
    logger.error(`Error in getting LLM result: ${error.message}`);
    return res
      .status(500)
      .json(ApiResponse.error("Internal server error", 500));
  }
});

router.post("/format-response", async (req, res, next) => {
  try {
    const chatModel = await initializeChatModel();
    const response = await redditController.formatResponse(req.body, chatModel);
    return res
      .status(200)
      .json(ApiResponse.success("Response formatted", response));
  } catch (error) {
    logger.error(`Error in formatting response: ${error.message}`);
    return res
      .status(500)
      .json(ApiResponse.error("Internal server error", 500));
  }
});

router.post("/generate-content", async (req, res, next) => {
  try {
    const chatModel = await initializeChatModel();
    const response = await redditController.generateContent(
      req.body,
      chatModel
    );
    return res
      .status(200)
      .json(ApiResponse.success("Post data fetched", response));
  } catch (error) {
    logger.error(`Error in getting post data: ${error.message}`);
    return res
      .status(500)
      .json(ApiResponse.error("Internal server error", 500));
  }
});

router.get("/check-tokens", async (req, res, next) => {
  try {
    const authCode = await redis.get("reddit_auth_code");
    const accessToken = await redis.get("reddit_access_token");
    const username = await redis.get("username");
    const response = {
      auth_code: !!authCode,
      access_token: !!accessToken,
      user_name: !!username,
    };
    return res
      .status(200)
      .json(ApiResponse.success("Tokens fetched successfully", response));
  } catch (error) {
    logger.error("Error in Validating Tokens");
    return res
      .status(500)
      .json(ApiResponse.error("Internal server error", 500));
  }
});

module.exports = router;
