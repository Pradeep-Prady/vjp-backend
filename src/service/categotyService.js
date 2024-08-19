import Category from "../model/categoryModel.js";
import mongoose from "mongoose";

const { ObjectId } = mongoose.Types;

export const add = async (data) => {
  const result = await Category.create(data);
  return result;
};

export const getAll = async () => {
  const result = await Category.find({});
  // .populate("items");
  return result;
};

export const getOne = async (id) => {
  const result = await Category.findOne({ category: id })
  return result;
};

export const getCategoryById = async (id) => {
  const result = await Category.findById(id);
  return result;
};

export const update = async (id, data) => {
  if (!ObjectId.isValid(id)) {
    throw new Error("Invalid ID format");
  }
  const result = await Category.updateOne({ _id: id }, data, {
    new: true,
    runValidators: true,
  });
  return result;
};

export const createSub = async (categoryID, name) => {
  if (!ObjectId.isValid(categoryID)) {
    throw new Error("Invalid ID format");
  }
  const category = await Category.findOne({ _id: categoryID });

  if (!category) {
    throw new Error("Category not found");
  }

  category.subCategorys.push({ name: name });
  const result = await category.save();
  return result.subCategorys.find((item) => item.name === name);
};

export const updateSub = async (categoryID, subCategoryID, name) => {
  if (!ObjectId.isValid(categoryID) || !ObjectId.isValid(subCategoryID)) {
    throw new Error("Invalid ID format");
  }
  const category = await Category.findOne({ _id: categoryID });

  category?.subCategorys?.forEach((item) => {
    if (item?._id.toString() === subCategoryID) {
      item.name = name;
    }
  });

  const result = await category.save();
  return result.subCategorys.find(
    (item) => item?._id.toString() === subCategoryID
  );
};

export const removeSub = async (categoryID, subCategoryID) => {
  if (!ObjectId.isValid(categoryID) || !ObjectId.isValid(subCategoryID)) {
    throw new Error("Invalid ID format");
  }
  const category = await Category.findOne({ _id: categoryID });

  if (category) {
    category.subCategorys = category.subCategorys.filter(
      (item) => item._id.toString() !== subCategoryID
    );
    await category.save();
    return category.subCategorys;
  } else {
    return null;
  }
};

export const remove = async (id) => {
  if (!ObjectId.isValid(id)) {
    throw new Error("Invalid ID format");
  }
  const result = await Category.deleteOne({ _id: id });
  return result;
};
