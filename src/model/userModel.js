import mongoose from "mongoose";

import jwt from "jsonwebtoken";

import crypto from "crypto";
import bcrypt from "bcryptjs";
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  pswd: {
    type: String,
    required: true,
    select: false,
  },
  gstNum: {
    type: String,
    required: true,
  },
  fName: {
    type: String,
    required: true,
  },
  lName: {
    type: String,
    required: true,
  },
  cmpny: {
    type: String,
  },
  strtAddrss: {
    type: String,
  },
  cntry: {
    type: String,
  },
  state: {
    type: String,
  },
  city: {
    type: String,
  },
  zipCode: {
    type: String,
  },
  phNum: {
    type: String,
  },
  paymentMethod: {
    type: String,
  },
  wishList: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
    },
  ],
  resetPasswordToken: String,
  resetPasswordTokenExpire: Date,

  
  createdAt: {
    type: Date,
    default: () => {
      const date = new Date();
      // Get the timezone offset for Indian Standard Time (IST) in milliseconds
      const timeZoneOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
      // Apply the offset to the current date
      const indianDate = new Date(date.getTime() + timeZoneOffset);
      return indianDate;
    }
  }
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("pswd")) {
    return next();
  }
  this.pswd = await bcrypt.hash(this.pswd, 10);
  next();
});

userSchema.methods.getJwtToken = async function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_TIME,
  });
};

userSchema.methods.isValidPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.pswd);
};

userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.resetPasswordTokenExpire = Date.now() + 60 * 60 * 1000;
  return resetToken;
};

const User = mongoose.model("User", userSchema);
export default User;
