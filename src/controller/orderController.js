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
import OrderCount from "../model/orderCountModel.js";

export const CreateOrder = async (req, res, next) => {
  const { error } = validateCreateOrder.validate(req.body);

  if (error) {
    return next(new AppError(error.message, BADREQUEST));
  }

  let orderData = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const currentYear = new Date().getFullYear();
    const orderCountDoc = await OrderCount.findOneAndUpdate(
      { year: currentYear },
      { $inc: { count: 1 } },
      { new: true, upsert: true, session }
    );

    const orderCount = orderCountDoc.count;
    orderData.orderID = `${currentYear}-${String(orderCount).padStart(4, '0')}`;

    // Ensure subCategory is present in each product
    for (const product of orderData.product) {
      const item = await Item.findById(product.item).session(session);
      if (!item) {
        throw new AppError(`Item with ID ${product.item} not found`, BADREQUEST);
      }
      if (!item.subCategory) {
        throw new AppError(`Item with ID ${product.item} is missing subCategory`, BADREQUEST);
      }
      product.subCategory = item.subCategory;
    }

    const order = new Order(orderData);
    await order.save({ session });

    for (const product of order.product) {
      const item = await Item.findById(product.item).session(session);
      if (item.stock < product.quantity) {
        throw new AppError(`Insufficient stock for item ${item.itemTitle}`, BADREQUEST);
      }
      item.stock -= product.quantity;
      await item.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    let BASE_URL = `${req.protocol}://${req.get("host")}`;
    const user = await getUser(order.user);

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
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    console.log(err);
    return next(new AppError(err.message, BADREQUEST));
  }
};

// export const CreateOrder = async (req, res, next) => {
//   const { error } = validateCreateOrder.validate(req.body);

//   if (error) {
//     return next(new AppError(error.message, BADREQUEST));
//   }

//   let orderData = req.body;

//   // orderData.

//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     // Create the order
//     const order = await add(orderData, { session });

//     // Update the stock for each item in the order
//     for (const product of order.product) {
//       const item = await Item.findById(product.item).session(session);

//       if (!item) {
//         throw new AppError(
//           `Item with ID ${product.item} not found`,
//           BADREQUEST
//         );
//       }

//       if (item.stock < product.quantity) {
//         throw new AppError(
//           `Insufficient stock for item ${item.itemTitle}`,
//           BADREQUEST
//         );
//       }

//       item.stock -= product.quantity;
//       await item.save({ session });
//     }

//     await session.commitTransaction();
//     session.endSession();

//     let BASE_URL = `${req.protocol}://${req.get("host")}`;

//     const user = await getUser(order.user);

//     if (order) {
//       await sendEmail({
//         email: user.email,
//         subject: "Order Confirmation",
//         template: "orderConfirmed",
//         context: {
//           name: `${user?.fName} ${user?.lName}`,
//           order: order,
//           BASE_URL: BASE_URL,
//           user: user,
//           count: order.product.length,
//         },
//       });

//       return next(new AppSuccess(order, "Order created successfully", SUCCESS));
//     } else {
//       return next(new AppError("Something went wrong", BADREQUEST));
//     }
//   } catch (err) {
//     await session.abortTransaction();
//     session.endSession();

//     console.log(err)
//     return next(new AppError(err.message, BADREQUEST));
//   }
// };

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
