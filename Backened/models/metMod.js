import mongoose, { Schema } from "mongoose";

const metSchema = new Schema({
  user_id: {
    type: String,
  },
  meeting_code: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
    required: true,
  },
});

const Meeting = mongoose.model("Meeting", metSchema);

export { Meeting };
