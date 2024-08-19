import Item from "./../model/itemsModel.js";
export const add = async (data) => {
  const result = await Item.create(data);
  return result;
};

export const getAll = async () => {
  const result = await Item.find();
  return result;
};

export const getAllTrending = async () => {
  const result = await Item.find({ isTrending: true }).limit(8);
  return result;
};

export const getOne = async (id) => {
  const result = await Item.findOne({ _id: id }).populate("category", "title");
  return result;
};

export const getRelatedItems = async (category) => {
  const result = await Item.find({ subCategory: category }).limit(4);
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
  const result = await Item.find({ isSale: true }).limit(12);
  return result;
};

// With Pagination

// export const getLatest = async (limit, skip) => {
//   const result = await Item.find()
//     .sort({ createdAt: -1 })
//     .limit(limit)
//     .skip(skip);
//   return result;
// };

export const getTodayDeal = async (limit, skip) => {
  const result = await Item.find({ isTrending: true })
    .sort({ _id: -1 })
    .limit(limit)
    .skip(skip);
  return result;
};
