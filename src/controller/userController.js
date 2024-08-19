import _ from "lodash";
import AppSuccess from "../utils/response-handlers/app-success.js";
import { BADREQUEST, SUCCESS } from "../utils/constants/statusCode.js";
import AppError from "../utils/response-handlers/app-error.js";
import { validateCreateUser } from "./../utils/validator/validateUser.js";
import {
  add,
  getAll,
  getOne,
  getOneWP,
  loginCheck,
  getOneByEmail,
  registerCheck,
  remove,
  update,
  getProfile,
} from "../service/userService.js";

import { getOne as getItem } from "../service/itemService.js";

import sendToken from "../utils/response-handlers/sendToken.js";
import User from "../model/userModel.js";
import crypto from "crypto";
import validateUpdatePassAndEmail from "../utils/validator/validateupdatePassAndEmail.js";
import sendEmail from "../utils/mail/sendEmail.js";
import validateResetPassword from "../utils/validator/validateResetPassword.js";

export const CreateUser = async (req, res, next) => {
  let alreadyExists = await registerCheck(req.body.email);

  if (alreadyExists) {
    return next(new AppError("User already exists", BADREQUEST));
  }

  const { error } = validateCreateUser.validate(req.body);

  if (error) {
    return next(new AppError(error.message, BADREQUEST));
  }

  let userData = req.body;
  const user = await add(userData);

  if (user) {
    return sendToken(res, user, "User created successfully", SUCCESS);
  } else {
    return next(new AppError("Something went wrong", BADREQUEST));
  }
};

export const loginUser = async (req, res, next) => {
  const { email, pswd } = req.body;

  if (_.isEmpty(email) || _.isEmpty(pswd)) {
    return next(new AppError("Email and Password are required", BADREQUEST));
  }

  const user = await loginCheck(email);

  if (!user) {
    return next(new AppError("Email or password is incorrect", BADREQUEST));
  }

  if (!(await user.isValidPassword(pswd))) {
    return next(new AppError("Invalid Email or Password", BADREQUEST));
  }

  sendToken(res, user, "User logged in successfully", SUCCESS);
};

export const updateUser = async (req, res, next) => {
  const { id } = req.params;
  if (_.isEmpty(id)) {
    return next(new AppError("User id is required", BADREQUEST));
  }

  const userId = await update(id, req.body);

  const user = await getOne(userId?._id);
  // const
  if (user) {
    return next(new AppSuccess(user, "User Updated successfully", SUCCESS));
  } else {
    return next(new AppError("Something went wrong", BADREQUEST));
  }
};

export const getUsers = async (req, res, next) => {
  const users = await getAll();
  if (users) {
    return next(new AppSuccess(users, "Users successfully Send", SUCCESS));
  } else {
    return next(new AppError("Something went wrong", BADREQUEST));
  }
};

export const getUser = async (req, res, next) => {
  const { id } = req.params;
  if (_.isEmpty(id)) {
    return next(new AppError("User id is required", BADREQUEST));
  }
  const user = await getOne(id);

  if (user) {
    return next(new AppSuccess(user, "User successfully Send", SUCCESS));
  } else {
    return next(new AppError("Something went wrong", BADREQUEST));
  }
};
export const myProfile = async (req, res, next) => {
  try {
    if (req.user) {
      return res
        .status(200)
        .send(new AppSuccess(req.user, "User successfully sent here", 200));
    } else {
      return next(new AppError("User not found", 404));
    }
  } catch (error) {
    return next(new AppError("An error occurred while fetching the user", 500));
  }
};

export const logoutUser = async (req, res, next) => {
  const options = {
    expires: new Date(Date.now()),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Use secure cookies in production
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax", // Adjust SameSite attribute based on environment
  };

  res.cookie("vjpuser", null, options);

  res.status(200).json({
    success: true,
    user: false,
  });
};
export const deleteUser = async (req, res, next) => {
  const { id } = req.params;
  if (_.isEmpty(id)) {
    return next(new AppError("User id is required", BADREQUEST));
  }
  const user = await remove(id);

  if (user) {
    return next(new AppSuccess(user, "User Deleted successfully", SUCCESS));
  } else {
    return next(new AppError("Something went wrong", BADREQUEST));
  }
};

function generateToken(email) {
  const token = jwt.sign({ email }, process.env.SIGNUP_SECRET_TOKEN, {
    expiresIn: "1h",
  });
  return token;
}

export const updateEmailOrPassword = async (req, res, next) => {
  try {
    const user = await getOneWP(req.user._id);
    const { type } = req.body;

    if (!user) {
      return next(new AppError("User does not exist", BADREQUEST));
    }

    if (type === "EmailAndPassword") {
      const { email, pswd, newPassword, confirmPassword } = req.body;

      const alreadyExists = await registerCheck(email);
      if (alreadyExists) {
        return next(new AppError("User Email already exists", BADREQUEST));
      }

      //  generate token

      // const token = generateToken(email);
      // req.body.token = token;

      if (await user.isValidPassword(pswd)) {
        if (newPassword !== confirmPassword) {
          return next(
            new AppError(
              "New Password and confirm password do not match",
              BADREQUEST
            )
          );
        }

        user.email = email;
        user.pswd = newPassword;
      } else {
        return next(new AppError("Current Password is Invalid", BADREQUEST));
      }
    } else if (type === "email") {
      const { email } = req.body;

      const alreadyExists = await registerCheck(email);
      if (alreadyExists) {
        return next(new AppError("User Email already exists", BADREQUEST));
      }

      user.email = email;
    } else if (type === "password") {
      const { error } = validateUpdatePassAndEmail.validate(req.body);

      if (error) {
        return next(new AppError(error.message, BADREQUEST));
      }

      const { pswd, newPassword, confirmPassword } = req.body;

      if (await user.isValidPassword(pswd)) {
        if (newPassword !== confirmPassword) {
          return next(
            new AppError(
              "New Password and confirm password do not match",
              BADREQUEST
            )
          );
        }

        user.pswd = newPassword;
      } else {
        return next(new AppError("Current Password is Invalid", BADREQUEST));
      }
    } else {
      return next(new AppError("Invalid update type", BADREQUEST));
    }

    await user.save();

    const options = {
      expires: new Date(Date.now()),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax", // Adjust SameSite attribute based on environment
    };

    res.cookie("vjpuser", null, options);

    return next(
      new AppSuccess(
        {
          success: true,
          user: false,
        },
        "User updated successfully",
        SUCCESS
      )
    );
  } catch (err) {
    return next(new AppError(err.message, BADREQUEST));
  }
};

export const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  if (_.isEmpty(email)) {
    return next(new AppError("Email is required", BADREQUEST));
  }
  const user = await getOneByEmail(email);

  if (!user) {
    return next(new AppError("Email not found", BADREQUEST));
  }

  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  let BASE_URL = `${req.protocol}://${req.get("host")}`;

  const resetUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;

  await sendEmail({
    email: email,
    subject: "VJP Forgot Password Request",
    template: "forgotPassword",
    context: {
      name: `${user?.fName} ${user?.lName}`,
      resetLink: resetUrl,
      BASE_URL: BASE_URL,
    },
  });
  try {
    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email} Successfully`,
      resetUrl: resetUrl,
    });
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError(err.message, BADREQUEST));
  }

  // sendToken(res, resetUrl, "Password reset link sent to your email", SUCCESS);
};

export const resetPassword = async (req, res, next) => {
  if (_.isEmpty(req.params.token)) {
    return next(
      new AppError(
        "Password reset token is invalid or has been expired",
        BADREQUEST
      )
    );
  }

  const { error } = validateResetPassword.validate(req.body);

  if (error) {
    return next(new AppError(error.message, BADREQUEST));
  }

  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordTokenExpire: { $gt: Date.now() },
  }).select("+pswd");

  if (!user) {
    return next(
      new AppError(
        "Password reset token is invalid or has been expired",
        BADREQUEST
      )
    );
  }

  // isValidPassword

  if (await user.isValidPassword(req.body.password)) {
    return next(
      new AppError("Your New Password cannot be same as old", BADREQUEST)
    );
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(
      new AppError("Password and confirm password does not match", BADREQUEST)
    );
  }

  user.pswd = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordTokenExpire = undefined;
  await user.save({ validateBeforeSave: false });

  //  logout user

  const options = {
    expires: new Date(Date.now()),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Use secure cookies in production
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax", // Adjust SameSite attribute based on environment
  };

  res.cookie("vjpuser", null, options);

  await sendEmail({
    email: user.email,
    subject: "VJP Password Reset Successful",
    template: "resetSuccess",
    context: {
      name: `${user?.fName} ${user?.lName}`,
    },
  });
  // sendToken(res,  {
  //       success: true,
  //       user: false,
  //     }, "Password reset successfully", SUCCESS);
  return next(
    new AppSuccess(
      {
        success: true,
        user: false,
      },
      "User updated successfully",
      SUCCESS
    )
  );
};

export const wishListAddOrRemove = async (req, res, next) => {
  try {
    const user = await getOne(req.user._id);
    const { productId } = req.params;

    const product = await getItem(productId);

    if (!product) {
      return next(new AppError("Product not found", NOTFOUND));
    }

    let alreadyIn = false;

    for (let i = 0; i < user.wishList.length; i++) {
      if (user?.wishList[i]?._id == productId) {
        alreadyIn = true;
        break;
      }
    }

    if (alreadyIn) {
      user.wishList = user.wishList.filter((wish) => wish.id !== productId);
    } else {
      user.wishList.push(productId);
    }

    await user.save();
    return next(
      new AppSuccess(user, "Wish list updated successfully", SUCCESS)
    );
  } catch (err) {
    return next(new AppError(err.message, BADREQUEST));
  }
};

export const clearAllWishList = async (req, res, next) => {
  try {
    const user = await getOne(req.user._id);
    user.wishList = [];
    await user.save();
    return next(
      new AppSuccess(user, "Wish list cleared successfully", SUCCESS)
    );
  } catch (err) {
    return next(new AppError(err.message, BADREQUEST));
  }
};
