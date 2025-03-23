const {z} = require('zod');

const intentSchema = z.object({
    intent: z.string(),
    parameters: z.object({
    }),
})

module.exports = intentSchema;