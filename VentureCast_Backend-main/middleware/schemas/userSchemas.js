const Joi = require('joi');

const updateUserSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional(),
  email: Joi.string().email().optional(),
  phoneNumber: Joi.string().pattern(/^\+[1-9]\d{1,14}$/).optional()
    .messages({ 'string.pattern.base': 'Phone number must be in E.164 format (e.g. +12125551234)' }),
  dateOfBirth: Joi.date().iso().optional(),
  address: Joi.object({
    street: Joi.string().max(200).optional(),
    city: Joi.string().max(100).optional(),
    state: Joi.string().max(100).optional(),
    zipCode: Joi.string().max(20).optional(),
    country: Joi.string().max(100).optional(),
  }).optional(),
});

module.exports = {
  updateUserSchema,
};
