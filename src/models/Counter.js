import mongoose from "mongoose";

const schema = new mongoose.Schema({
  _id: String,
  value: { type: Number, default: 0, min: 0, validate: { validator: Number.isInteger, message: "counter value must be a whole number" } },
});
export default mongoose.model("Counter", schema);
