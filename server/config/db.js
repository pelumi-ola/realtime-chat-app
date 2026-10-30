import { connect } from "mongoose";

const connectDB = async () => {
  try {
    const connection = await connect(process.env.MONGODB_URI, {
      dbName: "chatapp",
    });

    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    process.exist(1);
  }
};

export default connectDB;
