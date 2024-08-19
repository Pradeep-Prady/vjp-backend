import Order from "./../model/orderModel.js";
export const add = async (data) => {
  const result = await Order.create(data);
  return result;
};

// Admin
export const getAll = async () => {
  const result = await Order.find({})
    .populate({
      path: "user",
      model: "User",
    })
    .populate({
      path: "product.item",
      model: "Item",
    });
  return result;
};

export const getAdminOne = async (id) => {
  const result = await Order.findOne({ _id: id })
    .populate({
      path: "user",
      model: "User",
      select: "fName lName email cmpny cntry strtAddrss city state zipCode phNum",
    })
    .populate({
      path: "product.item",
      model: "Item",
      select: "itemTitle ",
    });
  return result;
};

export const getOne = async (id) => {
  const result = await Order.findOne({ _id: id });
  return result;
};

export const update = async (id, data) => {
  const result = await Order.updateOne({ _id: id }, data, {
    new: true,
    runValidators: true,
  });
  return result;
};

export const remove = async (id) => {
  const result = await Order.deleteOne({ _id: id });
  return result;
};

export const getMyAllOrders = async (id) => {
  const result = await Order.find({ user: id })
    // .populate({
    //   path: "user",
    //   model: "User",
    // })
    .populate({
      path: "product.item",
      model: "Item",
    });
  return result;
};
