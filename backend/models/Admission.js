const mongoose = require('mongoose');

const admissionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobile: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  qualification: { type: String, required: true },
  parentName: { type: String, required: true },
  parentMobile: { type: String, required: true },
  address: { type: String, required: true },
  course: { type: String, required: true },
  modeOfLearning: { type: String, required: true },
  preferredSlot: { type: String, required: true },
  placement: { type: String, required: true },
  attendBy: { type: String, required: true },
  batch: { type: String, required: true },
  date: { type: Date, default: Date.now },
});

const Admission = mongoose.model("Admission", admissionSchema);

module.exports = Admission;