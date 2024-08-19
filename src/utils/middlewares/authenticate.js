import jwt from "jsonwebtoken";
import { getOne } from "./../../service/userService.js";
import { BADREQUEST } from "./../constants/statusCode.js";
import AppError from "./../response-handlers/app-error.js";

export const isAuthenticatedUser = async (req, res, next) => {
  const { vjpuser } = req.cookies;

  if (!vjpuser) {
    return next(new AppError("Login first to access this resource", 400));
  }

  try {
    const decoded = jwt.verify(vjpuser, process.env.JWT_SECRET);

    if (!decoded.id) {
      return next(new AppError("Invalid token", 400));
    }

    const user = await getOne(decoded.id);
 
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    req.user = user;
    next();
  } catch (error) {
    return next(new AppError("Invalid or expired token", 400));
  }
};

export const isAuthenticatedAdminUser = async (req, res, next) => {
  const { at } = req.cookies;

  if (!at) {
    return next(
      new AppError("Login first to access this resource", BADREQUEST)
    );
  }

  try {
    const decoded = jwt.verify(at, process.env.JWT_SECRET);
    req.decoded = decoded;
    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    return next(new AppError("Invalid or expired token", BADREQUEST));
  }
};
 