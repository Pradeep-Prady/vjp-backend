import Item from "./../model/itemsModel.js";
export const add = async (data) => {
  const result = await Item.create(data);
  return result;
};

export const getAll = async () => {
  const result = await Item.find();
  return result;
};

export const getOne = async (id) => {
  const result = await Item.findOne({ _id: id });
  return result;
};

export const update = async (id, data) => {
  const result = await Item.updateOne({ _id: id }, data);
  return result;
};

export const remove = async (id) => {
  const result = await Item.deleteOne({ _id: id });
  return result;
};

export const getLatest = async () => {
  const result = await Item.find().sort({ createdAt: -1 });
  return result;
};
