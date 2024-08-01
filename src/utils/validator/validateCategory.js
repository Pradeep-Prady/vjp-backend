import Joi from "joi";

export const validateCreateCategory = Joi.object().keys({
  title: Joi.string().required(),
  description: Joi.string().required(),
  category: Joi.string().optional(),
  subCategorys: Joi.array().optional(),
  isTopCategory: Joi.boolean().optional(),
  items: Joi.array().optional(),
});
