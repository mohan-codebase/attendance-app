const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admission' },
  date: { type: Date, default: Date.now },
  status: String,
});

const Attendance = mongoose.model("Attendance", attendanceSchema);

module.exports = Attendance;