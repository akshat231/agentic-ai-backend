const {z} = require('zod');

const formattedResponseSchema = z.object({
    response: z.string()
});

module.exports = formattedResponseSchema;