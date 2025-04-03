const axios = require("axios");
const qs = require("qs");
const logger = require("../utils/logger");
const redditPrompt = require("../prompt");
const redditSchema = require("../outputSchema");
const langfuseHandler = require("../utils/langfuse");
const { PromptTemplate } = require("@langchain/core/prompts");

const fetchAccessToken = async (authCode, redirectUri, clientId) => {
  try {
    logger.info("access-token::service");
    const clientIdBase64 = Buffer.from(`${clientId}:`).toString("base64");
    logger.info(`clientIdBase64: ${clientIdBase64}`);
    let data = qs.stringify({
      grant_type: "authorization_code",
      code: authCode,
      redirect_uri: redirectUri,
    });
    let configuration = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://www.reddit.com/api/v1/access_token",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${clientIdBase64}`,
      },
      data: data,
    };
    const response = await axios.request(configuration);
    logger.info("response fetched successfully");
    return response.data;
  } catch (error) {
    throw error;
  }
};

const validateAccessToken = async (accessToken, appName) => {
  try {
    logger.info("validate-access-token::service");
    let config = {
      method: "get",
      maxBodyLength: Infinity,
      url: "https://oauth.reddit.com/api/v1/me",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": `${appName}/0.1`,
      },
    };
    const response = await axios.request(config);
    logger.info("response fetched successfully");
    if (response.status === 200) {
      const responseData = response.data;
      return {
        username: responseData.name,
        user_id: responseData.id,
        is_employee: responseData.is_employee,
        total_karma: responseData.total_karma,
        link_karma: responseData.link_karma,
        comment_karma: responseData.comment_karma,
        awarder_karma: responseData.awarder_karma,
        awardee_karma: responseData.awardee_karma,
        created_utc: new Date(responseData.created_utc * 1000).toLocaleString(),
        has_verified_email: responseData.has_verified_email,
        is_mod: responseData.is_mod,
        profile_icon: responseData.icon_img,
        subreddit: {
          name: responseData.subreddit.display_name,
          subscribers: responseData.subreddit.subscribers,
          url: `https://www.reddit.com${responseData.subreddit.url}`,
          is_moderator: responseData.subreddit.user_is_moderator,
        },
      };
    } else {
      throw new Error("Invalid access token");
    }
  } catch (error) {
    throw error;
  }
};

const getUserInfo = async (accessToken, appName) => {
  try {
    logger.info("get-user-info::service");
    let config = {
      method: "get",
      maxBodyLength: Infinity,
      url: "https://oauth.reddit.com/api/v1/me",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": `${appName}/0.1`,
      },
    };
    const response = await axios.request(config);
    const responseData = response.data;
    return {
      username: responseData.name,
      user_id: responseData.id,
      is_employee: responseData.is_employee,
      total_karma: responseData.total_karma,
      link_karma: responseData.link_karma,
      comment_karma: responseData.comment_karma,
      awarder_karma: responseData.awarder_karma,
      awardee_karma: responseData.awardee_karma,
      created_utc: new Date(responseData.created_utc * 1000).toLocaleString(),
      has_verified_email: responseData.has_verified_email,
      is_mod: responseData.is_mod,
      profile_icon: responseData.icon_img,
      subreddit: {
        name: responseData.subreddit.display_name,
        subscribers: responseData.subreddit.subscribers,
        url: `https://www.reddit.com${responseData.subreddit.url}`,
        is_moderator: responseData.subreddit.user_is_moderator,
      },
    };
    logger.info("response fetched successfully");
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getUserKarma = async (accessToken, appName) => {
  try {
    logger.info("get-user-karma::service");
    let config = {
      method: "get",
      maxBodyLength: Infinity,
      url: "https://oauth.reddit.com/api/v1/me/karma",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": `${appName}/0.1`,
      },
    };
    const response = await axios.request(config);
    logger.info("response fetched successfully");
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getUserTrophies = async (accessToken, appName) => {
  try {
    logger.info("get-user-trophies::service");
    let config = {
      method: "get",
      maxBodyLength: Infinity,
      url: "https://oauth.reddit.com/api/v1/me/trophies",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": `${appName}/0.1`,
      },
    };
    const response = await axios.request(config);
    logger.info("response fetched successfully");
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getSubredditPosts = async (
  accessToken,
  appName,
  subreddit,
  sort,
  limit,
  after
) => {
  try {
    logger.info("get-hot-posts::service");
    let config = {
      method: "get",
      maxBodyLength: Infinity,
      url: `https://oauth.reddit.com/r/${subreddit}/${sort}?limit=${limit}&after=${after}`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": `${appName}/0.1`,
      },
    };
    const response = await axios.request(config);
    const responseData = response.data.data.children;
    const formattedResponse = responseData.map((post) => ({
      title: post.data.title,
      author: post.data.author,
      subreddit: post.data.subreddit_name_prefixed,
      url: post.data.url,
      thumbnail: post.data.thumbnail,
      num_comments: post.data.num_comments,
      score: post.data.score,
      created_utc: post.data.created_utc,
      permalink: post.data.permalink,
      selftext: post.data.selftext,
      is_self: post.data.is_self,
      is_video: post.data.is_video,
      is_gallery: post.data.is_gallery,
      thing_id: `${post.kind}_${post.data.id}`,
    }));
    logger.info("response fetched successfully");
    return formattedResponse;
  } catch (error) {
    throw error;
  }
};

const getUserPosts = async (accessToken, appName, username) => {
  try {
    logger.info("get-user-posts::service");
    let config = {
      method: "get",
      maxBodyLength: Infinity,
      url: `https://oauth.reddit.com/user/${username}/submitted`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": `${appName}/0.1`,
      },
    };
    const response = await axios.request(config);
    const responseData = response.data.data.children;
    const formattedResponse = responseData.map((post) => {
      return {
        title: post.data.title,
        author: post.data.author,
        subreddit: post.data.subreddit_name_prefixed,
        postId: post.data.name,
        permalink: `https://www.reddit.com${post.data.permalink}`,
        createdUtc: post.created_utc,
        stats: {
          upvotes: post.data.ups,
          downvotes: post.data.downs,
          upvoteRatio: post.data.upvote_ratio * 100 + "%",
          score: post.data.score,
          comments: post.data.num_comments,
          crossposts: post.data.num_crossposts,
          subscribers: post.data.subreddit_subscribers.toLocaleString(),
        },
        flair: {
          text: post.data.link_flair_text || "None",
          backgroundColor: post.data.link_flair_background_color || "None",
          type: post.data.link_flair_type || "None",
        },
        content: {
          type: post.data.post_hint || "text",
          url: post.data.url,
          thumbnail: post.data.thumbnail,
        },
        settings: {
          spoiler: post.data.spoiler,
          nsfw: post.data.over_18,
          locked: post.data.locked,
          stickied: post.data.stickied,
          archived: post.data.archived,
          contestMode: post.data.contest_mode,
          liveComments: post.data.allow_live_comments,
        },
      };
    });
    return formattedResponse;
  } catch (error) {
    throw error;
  }
};

const getUserComments = async (accessToken, appName, username) => {
  try {
    logger.info("get-user-comments::service");
    let config = {
      method: "get",
      maxBodyLength: Infinity,
      url: `https://oauth.reddit.com/user/${username}/comments`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": `${appName}/0.1`,
      },
    };
    const response = await axios.request(config);
    const responseData = response.data.data.children;
    const formattedResponse = responseData.map((comment) => {
      return {
        commentId: comment.data.name,
        author: {
          username: comment.data.author,
          fullname: comment.data.author_fullname,
          flair: {
            text: comment.data.author_flair_text || "None",
            type: comment.data.author_flair_type || "None",
            color: comment.data.author_flair_text_color || "default",
          },
          isSubmitter: comment.data.is_submitter,
          premium: comment.data.author_premium,
        },
        subreddit: {
          name: comment.data.subreddit_name_prefixed,
          type: comment.data.subreddit_type,
          id: comment.data.subreddit_id,
        },
        parentPost: {
          title: comment.data.link_title,
          author: comment.data.link_author,
          link: comment.data.link_permalink,
          postId: comment.data.link_id,
        },
        commentDetails: {
          body: comment.data.body,
          score: comment.data.score,
          upvotes: comment.data.ups,
          downvotes: comment.data.downs,
          permalink: `https://www.reddit.com${comment.data.permalink}`,
          createdUtc: new Date(
            comment.data.created_utc * 1000
          ).toLocaleString(),
          edited: comment.data.edited ? "Yes" : "No",
          controversiality: comment.data.controversiality,
          numComments: comment.data.num_comments,
        },
        status: {
          locked: comment.data.locked,
          archived: comment.data.archived,
          stickied: comment.data.stickied,
          spoiler: comment.data.over_18,
        },
        moderation: {
          approvedBy: comment.data.approved_by || "None",
          bannedBy: comment.data.banned_by || "None",
          removalReason: comment.data.removal_reason || "None",
          modReports: comment.data.mod_reports.length,
          userReports: comment.data.user_reports.length,
        },
      };
    });
    return formattedResponse;
  } catch (error) {
    throw error;
  }
};

const search = async (
  accessToken,
  appName,
  query,
  sort,
  limit,
  after,
  subreddit
) => {
  try {
    logger.info("search::service");
    let url = subreddit
      ? `https://oauth.reddit.com/r/${subreddit}/search?q=${encodeURIComponent(
          query
        )}&sort=${sort}&limit=${limit}&after=${after} &restrict_sr=1`
      : `https://oauth.reddit.com/search?q=${encodeURIComponent(
          query
        )}&sort=${sort}&limit=${limit}&after=${after}`;
    logger.info(`Search URL: ${url}`);
    let config = {
      method: "get",
      maxBodyLength: Infinity,
      url,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": `${appName}/0.1`,
      },
    };
    const response = await axios.request(config);
    const responseData = response.data.data.children;
    const formattedResponse = responseData.map((post) => {
      return {
        title: post.data.title || "",
        subreddit: post.data.subreddit || "",
        author: post.data.author || "",
        score: post.data.score || 0,
        upvote_ratio: post.data.upvote_ratio || 0,
        num_comments: post.data.num_comments || 0,
        flair: post.data.link_flair_text || "",
        url: post.data.url || "",
        permalink: `https://reddit.com${post.data.permalink}` || "",
        created_utc: post.data.created_utc || 0,
        media: post.data.secure_media?.reddit_video
          ? {
              type: "video",
              duration: post.data.secure_media.reddit_video.duration || 0,
              video_url: post.data.secure_media.reddit_video.fallback_url || "",
            }
          : null,
        thumbnail: post.data.preview?.images?.[0]?.source
          ? {
              url: post.data.preview.images[0].source.url.replace(
                /&amp;/g,
                "&"
              ),
              width: post.data.thumbnail_width || 0,
              height: post.data.thumbnail_height || 0,
            }
          : null,
        thing_id: `${post.kind}_${post.data.id}`,
      };
    });
    return formattedResponse;
  } catch (error) {
    throw error;
  }
};

const uploadMedia = async (accessToken, appName, file) => {
  try {
    logger.info("upload-media::service");

    const data = {
      filepath: file.originalname, // Reddit expects the filename, not a path
      mimetype: file.mimetype, // Correct mimetype for the file
    };

    const config = {
      method: "post",
      url: "https://oauth.reddit.com/api/widget_image_upload_s3",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": `${appName}/0.1`,
        "Content-Type": "application/json",
      },
      data: data,
    };

    const response = await axios(config);
    return response.data.args; // Contains upload URL and fields
  } catch (error) {
    logger.error("asdsad", error);
    throw error;
  }
};

const post = async (
  accessToken,
  appName,
  subreddit,
  title,
  kind,
  text,
  url,
  mediaurl,
  nsfw,
  spoiler
) => {
  try {
    logger.info("post::service");
    const data = {
      sr: subreddit,
      title,
      kind,
      nsfw: nsfw === "true" || nsfw === true,
      spoiler: spoiler === "true" || spoiler === true,
    };

    if (kind === "self") {
      data.text = text;
    }
    // if (kind === 'link') {
    //     data.url = url;
    // }
    // if (kind === 'image') {
    //     if (!mediaurl || !mediaurl.buffer) {
    //         throw new Error('No image file provided');
    //     }

    //     logger.info(`Uploading image: ${mediaurl.originalname}, type: ${mediaurl.mimetype}`);

    //     // Get upload lease
    //     const leaseResponse = await axios.post(
    //         'https://oauth.reddit.com/api/media/asset.json',
    //         {
    //             filepath: mediaurl.originalname,
    //             mimetype: mediaurl.mimetype
    //         },
    //         {
    //             headers: {
    //                 'Authorization': `Bearer ${accessToken}`,
    //                 'User-Agent': `${appName}/0.1`
    //             }
    //         }
    //     ).catch(error => {
    //         logger.error('Lease request failed:', error.response?.data || error.message);
    //         throw error;
    //     });

    //     const lease = leaseResponse.data;
    //     logger.info('Lease received:', lease);

    //     const { action, fields } = lease.args;

    //     // Upload to S3
    //     const formData = new FormData();
    //     fields.forEach(field => {
    //         formData.append(field.name, field.value);
    //     });
    //     formData.append('file', mediaurl.buffer, {
    //         filename: mediaurl.originalname,
    //         contentType: mediaurl.mimetype
    //     });

    //     await axios.post(action, formData, {
    //         headers: {
    //             ...formData.getHeaders()
    //         }
    //     }).catch(error => {
    //         logger.error('S3 upload failed:', error.response?.data || error.message);
    //         throw error;
    //     });

    //     logger.info('Image uploaded successfully');
    //     data.kind = 'image';
    //     data.url = lease.asset.websocket_url; // Use the websocket URL for the post
    // }

    // Submit the post
    const config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://oauth.reddit.com/api/submit",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": `${appName}/0.1`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: new URLSearchParams(data).toString(),
    };

    const response = await axios.request(config).catch((error) => {
      logger.error(
        "Submit request failed:",
        error.response?.data || error.message
      );
      throw error;
    });

    logger.info("Post submitted successfully");
    return response.data;
  } catch (error) {
    logger.error(`Error in reddit service: ${error.message}`, {
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

const comment = async (accessToken, appName, postId, text) => {
  try {
    logger.info("comment::service");
    const data = {
      thing_id: postId,
      text,
    };
    const config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://oauth.reddit.com/api/comment",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": `${appName}/0.1`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: new URLSearchParams(data).toString(),
    };
    const response = await axios.request(config);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const vote = async (accessToken, appName, postId, voting) => {
  try {
    logger.info("vote::services");
    const data = {
      id: postId,
      dir: voting,
    };
    const config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://oauth.reddit.com/api/vote",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": `${appName}/0.1`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: new URLSearchParams(data).toString(),
    };
    const response = await axios.request(config);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getComments = async (
  accessToken,
  appName,
  postId,
  after,
  limit,
  subreddit,
  sort
) => {
  try {
    logger.info("getComments::service");
    const config = {
      method: "get",
      maxBodyLength: Infinity,
      url: `https://oauth.reddit.com/r/${subreddit}/comments/${postId}?sort=${sort}&limit=${limit}&after=${after}`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": `${appName}/0.1`,
      },
    };
    const response = await axios.request(config);
    const responseData = response.data.slice(1)[0].data.children;
    const formattedResponse = responseData.map((post) => {
      return {
        author: post.data.author,
        body: post.data.body,
        created_utc: post.data.created_utc,
        score: post.data.score,
        thing_id: post.data.id,
        permalink: `https://reddit.com${post.data.permalink}` || "",
      };
    });
    formattedResponse.pop();
    return formattedResponse;
  } catch (error) {
    throw error;
  }
};

const getSubscribedSubreddits = async (accessToken, appName, limit) => {
  try {
    logger.info("getSubscribedSubreddits::service");
    const config = {
      method: "get",
      maxBodyLength: Infinity,
      url: `https://oauth.reddit.com/subreddits/mine/subscriber?limit=${limit}`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": `${appName}/0.1`,
      },
    };
    const response = await axios.request(config);
    const responseData = response.data.data.children;
    const formattedResponse = responseData.map((subreddit) => {
      return {
        name: subreddit.data.display_name, // "IndiaNostalgia"
        thing_id: subreddit.data.name, // "t5_24rv69"
        title: subreddit.data.title, // "Nostalgic Corner For Indians"
        subscribers: subreddit.data.subscribers, // 504534
        description: subreddit.data.public_description, // "Nostalgic Community For Indians"
        created: new Date(subreddit.data.created_utc * 1000).toISOString(), // "2019-09-13T06:42:54.000Z"
        submission_type: subreddit.data.submission_type, // "any"
        restrict_posting: subreddit.data.restrict_posting, // true
        user_is_subscriber: subreddit.data.user_is_subscriber, // true
        link_flair_enabled: subreddit.data.link_flair_enabled, // true
      };
    });
    return formattedResponse;
  } catch (error) {
    throw error;
  }
};

const modelInvoke = async (
  prompt,
  chatModel,
  inputObject = {},
  outputSchema = false
) => {
  try {
    let schemaObject = {};
    if (outputSchema) {
      schemaObject = {
        with_structured_output: true,
        schema: outputSchema,
      };
    }
    const promptTemplate = new PromptTemplate({
      template: prompt,
      inputVariables: Object.keys(inputObject),
    });
    const fullPrompt = await promptTemplate.format(inputObject);
    logger.info("modelInvoke::service");
    const modelResponse = await chatModel.invoke(
      fullPrompt,
      {
        callbacks: [langfuseHandler],
      },
      schemaObject
    );
    return modelResponse;
  } catch (error) {
    throw error;
  }
};

const testLLMResult = async (prompt, chatModel) => {
  try {
    logger.info('testLLMResult::service');
    const modelResponse = await modelInvoke(prompt, chatModel);
    logger.info(`response from llm is: ${JSON.stringify(modelResponse.lc_kwargs.content)}`);
    return modelResponse.lc_kwargs.content;
  } catch (error) {
    throw error;
  }
};

const getLLMResult = async (prompt, chatModel) => {
  try {
    logger.info('getLLMResult::service');
    const inputObject = { PROMPT: prompt };
    const modelResponse = await modelInvoke(redditPrompt.redditToolDetectorPrompt, chatModel, inputObject, redditSchema.redditIntentSchema);
    logger.info(`response from llm is: ${JSON.stringify(modelResponse.lc_kwargs.content)}`);
    return JSON.parse(modelResponse.lc_kwargs.content);
  } catch (error) {
    throw error;
  }
};

const formatResponse = async (response, intent, toolDescription, chatModel) => {
  try {
    logger.info('formatResponse::service');
    const inputObject = {
      TOOL_NAME: intent,
      TOOL_DESCRIPTION: toolDescription,
      API_RESPONSE: response
    };
    const modelResponse = await modelInvoke(redditPrompt.redditToolResponseFormatterPrompt, chatModel, inputObject, redditSchema.redditFormattedResponseSchema);
    return modelResponse.lc_kwargs.content;
  } catch (error) {
    throw error;
  }
};


const generateContent = async (prompt, chatModel) => {
  try {
    logger.info('getPostData::service');
    const inputObject = {
      USER_INPUT: prompt,
    };
    const modelResponse = await modelInvoke(redditPrompt.redditPostInformationPrompt, chatModel, inputObject, redditSchema.redditPostInformationSchema);
    return JSON.parse(modelResponse.lc_kwargs.content);
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
  getLLMResult,
  formatResponse,
  testLLMResult,
  generateContent
};
