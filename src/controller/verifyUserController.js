import { add as addUser } from "../service/userService.js";
import {
  add,
  removeVerifyUser,
  verifyUserCheck,
  verifyUserToken,
} from "../service/verifyUserService.js";
import { BADREQUEST, SUCCESS } from "../utils/constants/statusCode.js";
import sendEmail from "../utils/mail/sendEmail.js";
import { verifyedSuccess } from "../utils/mail/verifyTemplates.js";
import AppError from "../utils/response-handlers/app-error.js";
import AppSuccess from "../utils/response-handlers/app-success.js";
import { validateVerifyUser } from "../utils/validator/validateVerifyUser.js";
import jwt from "jsonwebtoken";

function generateToken(email) {
  const token = jwt.sign({ email }, process.env.SIGNUP_SECRET_TOKEN, {
    expiresIn: "1h",
  });
  return token;
}

export const verifyUser = async (req, res, next) => {
  try {
    // Validate the request body
    const { error } = validateVerifyUser.validate(req.body);

    if (error) {
      return next(new AppError(error.message, BADREQUEST));
    }

    const { email } = req.body;

    const alreadyExists = await verifyUserCheck(email);

    if (alreadyExists) {
      return next(new AppError("User already exists", BADREQUEST));
    }

    // Generate a token for the user
    const token = generateToken(email);
    req.body.token = token;

    // Save the new user data
    const newUser = await add(req.body);

    // Construct the activation link
    const BASE_URL = `${req.protocol}://${req.get("host")}`;
    const activationLink = `${BASE_URL}/api/v1/verify/${token}`;

    await sendEmail({
      email: email,
      subject: "VJP Email Verification Request",
      template: "verifyRequest",
      context: {
        name: `${newUser?.fName} ${newUser?.lName}`,
        verificationLink: activationLink,
        BASE_URL: BASE_URL,
      },
    });

    return next(
      new AppSuccess(
        "verfication sent",
        "Email verification successfully sent",
        SUCCESS
      )
    );
  } catch (err) {
    return next(new AppError(err.message || "An error occurred", BADREQUEST));
  }
};

export const InsertUser = async (req, res, next) => {
  try {
    const response = await InsertUsertoUser(req.params.token, req, res, next);

    const BASE_URL = `${req.protocol}://${req.get("host")}`;

    await sendEmail({
      email: response.email,
      subject: "VJP Account Verification Success",
      template: "verifySuccess",
      context: {
        name: `${response?.fName} ${response?.lName}`,
        BASE_URL: BASE_URL,
      },
    });

    if (response) {
      const htmlContent = verifyedSuccess(
        BASE_URL,
        response.fName,
        response.lName
      );
      return res.status(200).send(htmlContent);
    }

    return next(new AppSuccess(response, "User successfully sent", 200));
  } catch (err) {
    return next(new AppError(err.message, BADREQUEST));
  }
};

const InsertUsertoUser = async (token, req, res, next) => {
  try {
    const verifyUser = await verifyUserToken(token);

    if (!verifyUser) {
      return next(new AppError("Token expired or invalid", BADREQUEST));
    }

    const user = await addUser({
      email: verifyUser.email,
      pswd: verifyUser.pswd,
      fName: verifyUser.fName,
      lName: verifyUser.lName,
      gstNum: verifyUser.gstNum,
      cmpny: verifyUser.cmpny,
      strtAddrss: verifyUser.strtAddrss,
      cntry: verifyUser.cntry,
      state: verifyUser.state,
      city: verifyUser.city,
      zipCode: verifyUser.zipCode,
      phNum: verifyUser.phNum,
    });

    await removeVerifyUser(token);

    return user;
  } catch (err) {
    return next(new AppError(err.message, BADREQUEST));
  }
};
