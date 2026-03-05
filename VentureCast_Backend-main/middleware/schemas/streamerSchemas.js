const Joi = require('joi');

const listQuery = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(50),
  offset: Joi.number().integer().min(0).default(0),
  category: Joi.string().max(100).optional(),
});

const searchQuery = Joi.object({
  q: Joi.string().min(1).max(100).required(),
});

const streamerIdParam = Joi.object({
  id: Joi.string().hex().length(24).required(),
});

module.exports = {
  listQuery,
  searchQuery,
  streamerIdParam,
};
