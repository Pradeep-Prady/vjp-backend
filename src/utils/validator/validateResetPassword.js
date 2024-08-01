import Joi from "joi";

export const validateResetPassword = Joi.object().keys({
  password: Joi.string()
    .min(8)
    .pattern(new RegExp("^(?=.*[0-9])(?=.*[!@#$%^&*])"))
    .required()
    .messages({
      "any.required": "New Password cannot be empty.",
      "string.empty": "New Password cannot be empty.",
      "string.min": "New Password must be at least 8 characters long.",
      "string.max": "New Password must be at most 16 characters long.",
      "string.pattern.base":
        "New Password must contain at least one special character and one number.",
    }),
  confirmPassword: Joi.string().required().messages({
    "any.required": "Confirm Password cannot be empty.",
    "string.empty": "Confirm Password cannot be empty.",
  }),
});

export default validateResetPassword;
