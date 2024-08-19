import User from "../model/userModel.js";
import VerifyUser from "../model/verifyUserModel.js";

 

export const verifyUserCheck = async (email) => {
  const result = await User.findOne({ email: email });
  return result;
};

export const add = async (data) => {
  const result = await VerifyUser.create(data);
  return result;
};

export const verifyUserToken = async (token) => {
  const result = await VerifyUser.findOne({ token: token });
  return result;
}

export const removeVerifyUser = async (token) => {
  const result = await VerifyUser.deleteOne({ token: token });
  return result;
}