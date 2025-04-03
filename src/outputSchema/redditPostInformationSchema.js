const {z} = require('zod');

const redditPostInformationSchema = z.object({
    title: z.string(),
    content: z.string()
});

module.exports = redditPostInformationSchema;