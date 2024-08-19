import { getAll as getAllCategories } from "../service/categotyService.js";
import { getAll as getItems } from "../service/itemService.js";
import { getAll as getAllUsers, getOne } from "../service/userService.js";
import {
  BADREQUEST,
  SUCCESS,
  UNAUTHORIZED,
} from "../utils/constants/statusCode.js";
import AppError from "../utils/response-handlers/app-error.js";
import _ from "lodash";
import jwt from "jsonwebtoken";
import AppSuccess from "./../utils/response-handlers/app-success.js";
import { getAll } from "../service/orderService.js";
export const getDashboard = async (req, res, next) => {
  try {
    const categories = await getAllCategories();
    const items = await getItems();
    const users = await getAllUsers();
    const orders = await getAll();

    return next(
      new AppSuccess(
        {
          categoriesCount: categories.length,
          itemsCount: items.length,
          usersCount: users.length,
          ordersCount: orders.length, 
        },
        "Dashboard Data successfully Send",
        SUCCESS
      )
    );
  } catch (err) {
    return next(new AppError("Something went wrong", BADREQUEST));
  }
};

export const getDashboardDetails = async (req, res, next) => {
  try {
    const categories = await getAllCategories();

    return next(
      new AppSuccess(
        {
          categoriesCount: categories.length,
          categories: categories,
        },
        "Dashboard Data successfully Send",
        SUCCESS
      )
    );
  } catch (err) {
    return next(new AppError(res, "Something went wrong", BADREQUEST));
  }
};

// Auth

// export const loginAdmin = async (req, res, next) => {
//   const { username, password } = req.body;

//   if (_.isEmpty(username) || _.isEmpty(password)) {
//     return next(new AppError("Username and Password are required", BADREQUEST));
//   }

//   if (username === process.env.USERID && password === process.env.PASSWORD) {
//     const token = jwt.sign({ username }, process.env.JWT_SECRET, {
//       expiresIn: process.env.JWT_EXPIRES_TIME,
//     });

//     const options = {
//       expires: new Date(
//         Date.now() + process.env.COOKIE_EXPIRES_TIME * 24 * 60 * 60 * 1000
//       ),
//       httpOnly: true,
//     };

//     res.setHeader(
//       "Set-Cookie",
//       `at=${token}; maxAge=${options.expires}; httpOnly=true;`
//     );

//     // res.status(200).cookie("at", token, options).json({
//     //   success: true,
//     //   at: token,
//     //   user: true,
//     // });
//     res.status(200).json({
//       success: true,
//       at: token,
//       user: true,
//     });
//   } else {
//     return next(new AppError("Something went wrong", UNAUTHORIZED));
//   }
// };

export const loginAdmin = async (req, res, next) => {
  const { username, password } = req.body;

  if (_.isEmpty(username) || _.isEmpty(password)) {
    return next(new AppError("Username and Password are required", BADREQUEST));
  }

  if (username === process.env.USERID && password === process.env.PASSWORD) {
    const token = jwt.sign({ username }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_TIME,
    });

    const options = {
      expires: new Date(
        Date.now() + process.env.COOKIE_EXPIRES_TIME * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax", // Adjust SameSite attribute based on environment
    };

    res.cookie("at", token, options);

    res.status(200).json({
      success: true,
      admin: true,
    });
  } else {
    return next(new AppError("Something went wrong", UNAUTHORIZED));
  }
};

export const getAdminProfile = async (req, res, next) => {
  try {
    return next(
      new AppSuccess(
        {
          admin: true,
        },
        "Admin Available ",
        SUCCESS
      )
    );
  } catch (error) {
    return next(new AppError("Invalid or expired token", BADREQUEST));
  }
};

export const logoutAdmin = async (req, res, next) => {
  // res.cookie("at", null, {
  //   expires: new Date(Date.now()),
  //   httpOnly: true,
  // });

  const options = {
    expires: new Date(Date.now()),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Use secure cookies in production
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax", // Adjust SameSite attribute based on environment
  };

  res.cookie("at", null, options);

  res.status(200).json({
    success: true,
    admin: true,
  });

  return next(new AppSuccess({ admin: false }, "Logout successfully", SUCCESS));
};
