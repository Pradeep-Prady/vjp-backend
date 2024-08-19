import mongoose from "mongoose";

const connectDatabase = (uri) => {
 
  try {
    mongoose
      .connect(uri)
      .then((data) => {
        console.log(`Mongodb connected with server: ${data.connection.host}`);
      })
      .catch((err) => {
        console.log('MongoDB Error',err);
      });
  } catch (err) {
    console.log('MongoDB Error',err);
  }
};

export default connectDatabase;
