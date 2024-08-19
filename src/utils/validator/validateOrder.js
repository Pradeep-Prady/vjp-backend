import Joi from "joi";

export const validateCreateOrder = Joi.object().keys({
  total: Joi.number().required(),
  user: Joi.string().required(),
  product: Joi.array().required(),
  paymentMethod: Joi.string().required(),
  deliveryType: Joi.object().required(),
});

export const validateUpdateOrder = Joi.object().keys({
  status: Joi.string().required(),
});
