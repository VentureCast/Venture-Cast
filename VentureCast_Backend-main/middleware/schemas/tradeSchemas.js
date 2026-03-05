const Joi = require('joi');

const objectId = Joi.string().hex().length(24);

const buySchema = Joi.object({
  streamerId: objectId.required(),
  shareCount: Joi.number().integer().min(1).max(100000).required(),
  maxPrice: Joi.number().min(0.01).optional(),
});

const sellSchema = Joi.object({
  streamerId: objectId.required(),
  shareCount: Joi.number().integer().min(1).max(100000).required(),
  minPrice: Joi.number().min(0.01).optional(),
});

const tradeHistoryQuery = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(50),
  offset: Joi.number().integer().min(0).default(0),
});

const userIdParam = Joi.object({
  userId: objectId.required(),
});

const streamerIdParam = Joi.object({
  streamerId: objectId.required(),
});

module.exports = {
  buySchema,
  sellSchema,
  tradeHistoryQuery,
  userIdParam,
  streamerIdParam,
};
