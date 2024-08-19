import mongoose from "mongoose";

class ItemAPIFeatures {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
  }

  search() {
    if (this.queryStr.keyword) {
      if (this.queryStr.keyword) {
        // If the keyword is a valid ObjectId, search by ObjectId
        this.query = this.query.find({
          category: this.queryStr.keyword,
        });
      } else {
        throw new Error("Invalid ObjectId");
      }
    }
    return this;
  }

  paginate(resPerPage) {
    const currentPage = Number(this.queryStr.page) || 1;
    const skip = resPerPage * (currentPage - 1);
    this.query = this.query.limit(resPerPage).skip(skip);
    return this;
  }
}

export default ItemAPIFeatures;
