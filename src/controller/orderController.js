import _ from "lodash";
import AppSuccess from "../utils/response-handlers/app-success.js";
import { BADREQUEST, SUCCESS } from "../utils/constants/statusCode.js";
import AppError from "../utils/response-handlers/app-error.js";
import {
  validateCreateOrder,
  validateUpdateOrder,
} from "./../utils/validator/validateOrder.js";
import {
  add,
  getAdminOne,
  getAll,
  getMyAllOrders,
  getOne,
  update,
} from "../service/orderService.js";
import { getOne as getUser } from "../service/userService.js";
import Order from "../model/orderModel.js";
import APIFeatures from "../utils/api/apiFeatures.js";
import sendEmail from "../utils/mail/sendEmail.js";
import mongoose from "mongoose";
import Item from "../model/itemsModel.js";

// export const CreateOrder = async (req, res, next) => {
//   const { error } = validateCreateOrder.validate(req.body);

//   if (error) {
//     return next(new AppError(error.message, BADREQUEST));
//   }

//   let orderData = req.body;

//   const order = await add(orderData);
//   let BASE_URL = `${req.protocol}://${req.get("host")}`;

//   const user = await getUser(order.user);

//   if (order) {
//     await sendEmail({
//       email: user.email,
//       subject: "Order Confirmation",
//       template: "orderConfirmed",
//       context: {
//         name: `${user?.fName} ${user?.lName}`,
//         order: order,
//         BASE_URL: BASE_URL,
//         user: user,
//         count: order.product.length,
//       },
//     });

//     return next(new AppSuccess(order, "Order created successfully", SUCCESS));
//   } else {
//     return next(new AppError("Something went wrong", BADREQUEST));
//   }
// };

export const CreateOrder = async (req, res, next) => {
  const { error } = validateCreateOrder.validate(req.body);

  if (error) {
    return next(new AppError(error.message, BADREQUEST));
  }

  let orderData = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Create the order
    const order = await add(orderData, { session });

    // Update the stock for each item in the order
    for (const product of order.product) {
      const item = await Item.findById(product.item).session(session);

      if (!item) {
        throw new AppError(
          `Item with ID ${product.item} not found`,
          BADREQUEST
        );
      }

      if (item.stock < product.quantity) {
        throw new AppError(
          `Insufficient stock for item ${item.itemTitle}`,
          BADREQUEST
        );
      }

      item.stock -= product.quantity;
      await item.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    let BASE_URL = `${req.protocol}://${req.get("host")}`;

    const user = await getUser(order.user);

    if (order) {
      await sendEmail({
        email: user.email,
        subject: "Order Confirmation",
        template: "orderConfirmed",
        context: {
          name: `${user?.fName} ${user?.lName}`,
          order: order,
          BASE_URL: BASE_URL,
          user: user,
          count: order.product.length,
        },
      });

      return next(new AppSuccess(order, "Order created successfully", SUCCESS));
    } else {
      return next(new AppError("Something went wrong", BADREQUEST));
    }
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(new AppError(err.message, BADREQUEST));
  }
};

export const getOrder = async (req, res, next) => {
  const { id } = req.params;
  if (_.isEmpty(id)) {
    return next(new AppError("Order id is required", BADREQUEST));
  }
  const order = await getOne(id);

  if (order) {
    return next(new AppSuccess(order, "Order successfully Send", SUCCESS));
  } else {
    return next(new AppError("Something went wrong", BADREQUEST));
  }
};

export const getMyOrders = async (req, res, next) => {
  const { id } = req.user;

  if (_.isEmpty(id)) {
    return next(new AppError("User id is required", BADREQUEST));
  }

  const orders = await getMyAllOrders(id);
  if (orders) {
    return next(new AppSuccess(orders.reverse(), "orders data", SUCCESS));
  } else {
    return next(new AppError("Something went wrong", BADREQUEST));
  }
};

// Admin

export const getAdminOrder = async (req, res, next) => {
  const { id } = req.params;
  if (_.isEmpty(id)) {
    return next(new AppError("Order id is required", BADREQUEST));
  }
  const order = await getAdminOne(id);

  if (order) {
    return next(new AppSuccess(order, "Order successfully Send", SUCCESS));
  } else {
    return next(new AppError("Something went wrong", BADREQUEST));
  }
};

export const updateOrder = async (req, res, next) => {
  const { error } = validateUpdateOrder.validate(req.body);

  if (error) {
    return next(new AppError(error.message, BADREQUEST));
  }

  const { id } = req.params;
  if (_.isEmpty(id)) {
    return next(new AppError("Order id is required", BADREQUEST));
  }

  const order = await update(id, req.body);
  if (order) {
    return next(new AppSuccess(order, "Order Updated successfully", SUCCESS));
  } else {
    return next(new AppError("Something went wrong", BADREQUEST));
  }
};

export const getOrders = async (req, res, next) => {
  const resPerPage = 12;

  let buildQuery = (req) => {
    return new APIFeatures(
      Order.find().populate({
        path: "user",
        select: "email", // Only populate the email field of the user
      }),
      req.query
    )
      .search()
      .sortWithDate();
  };

  const filterdOrdersCount = await buildQuery(req).query.countDocuments();

  const totalOrdersCount = await Order.countDocuments({});

  let ordersCount = totalOrdersCount;

  if (filterdOrdersCount !== totalOrdersCount) {
    ordersCount = filterdOrdersCount;
  }

  const orders = await buildQuery(req).paginate(resPerPage).query;

  if (orders) {
    return next(
      new AppSuccess(
        { ordersCount: ordersCount, orders: orders },
        "Orders Data",
        SUCCESS
      )
    );
  } else {
    return next(new AppError("Something went wrong", BADREQUEST));
  }
};
