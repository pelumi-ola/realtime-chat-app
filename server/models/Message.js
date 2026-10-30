import { Schema, model } from "mongoose";

const messageSchema = new Schema(
  {
    room: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },

    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    content: {
      type: String,
      trim: true,
      required: true,
      maxlength: 5000,
    },
  },

  {
    timestamps: true,
  },
);

export default model("Message", messageSchema);
