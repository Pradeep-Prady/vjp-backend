import User from "./../model/userModel.js";

export const registerCheck = async (email) => {
  const result = await User.findOne({ email: email });
  return result;
};

export const loginCheck = async (email) => {
  const result = await User.findOne({ email: email })
    .select("+pswd")
    .populate("wishList");
  return result;
};

export const add = async (data) => {
  const result = await User.create(data);
  return result;
};

export const getAll = async () => {
  const result = await User.find({});
  return result;
};

export const getOne = async (id) => {
  const result = await User.findById(id).populate("wishList");
  return result;
};

export const getProfile = async (email) => {
  const result = await User.findOne({ email: email }).populate("wishList");
  return result;
};
export const getOneByEmail = async (emailId) => {
  const result = await User.findOne({ email: emailId }).populate("wishList");
  return result;
};

export const getOneWP = async (id) => {
  const result = await User.findOne({ _id: id }).select("pswd");
  return result;
};

export const update = async (id, data) => {
  const result = await User.findByIdAndUpdate({ _id: id }, data, {
    new: true,
    runValidators: true,
  });
  return result;
};

export const remove = async (id) => {
  const result = await User.deleteOne({ _id: id });
  return result;
};
