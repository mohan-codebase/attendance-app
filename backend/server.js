const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const axios = require("axios");
const userRoutes = require("./routes/userRoutes");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("MongoDB connected"))
  .catch(err => {
    console.error("MongoDB connection failed", err);
    process.exit(1);
  });

// Admission Schema and Model
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

// Endpoint to check if email or mobile already exists
app.post("/api/admissions/check", async (req, res) => {
  const { email, mobile } = req.body;

  try {
    const existingStudent = await Admission.findOne({
      $or: [{ email }, { mobile }],
    });

    if (existingStudent) {
      return res.json({ exists: true });
    } else {
      return res.json({ exists: false });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error checking admission data" });
  }
});

// Endpoint to add a new admission
app.post("/api/admissions", async (req, res) => {
  try {
    const newAdmission = new Admission(req.body);
    await newAdmission.save();
    res.status(201).json({ message: "Admission submitted successfully!" });
  } catch (error) {
    console.error("Error submitting admission form:", error);
    res.status(500).json({ error: "Error submitting admission form" });
  }
});

// Endpoint to get all admissions
app.get("/api/admissions", async (req, res) => {
  try {
    const admissions = await Admission.find();
    res.status(200).json(admissions);
  } catch (error) {
    console.error("Error fetching admissions:", error);
    res.status(500).json({ error: "Error fetching admissions" });
  }
});

// New endpoint to get grouped admissions data
app.get("/api/admissions/grouped", async (req, res) => {
  try {
    const admissions = await Admission.find();
    const groupedAdmissions = admissions.reduce((acc, admission) => {
      const { course } = admission;
      if (!acc[course]) {
        acc[course] = 0;
      }
      acc[course] += 1;
      return acc;
    }, {});

    const result = Object.entries(groupedAdmissions).map(([course, count]) => ({
      course,
      count,
    }));

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: "Error fetching grouped admissions data" });
  }
});

// Courses deleting and updating
app.delete("/api/admissions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Admission.findByIdAndDelete(id);
    res.status(200).json({ message: "Admission deleted successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting admission" });
  }
});

app.put("/api/admissions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedAdmission = await Admission.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json(updatedAdmission);
  } catch (error) {
    res.status(500).json({ error: "Error updating admission" });
  }
});

// Student schema and model
const studentSchema = new mongoose.Schema({
  name: String,
  // Add other fields as needed
});

const Student = mongoose.model("Student", studentSchema);

app.get("/api/students", async (req, res) => {
  try {
    const students = await Student.find();
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ error: "Error fetching students" });
  }
});

// Attendance schema and model
const attendanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admission' },
  date: { type: Date, default: Date.now },
  status: String,
});

const Attendance = mongoose.model("Attendance", attendanceSchema);

app.post("/api/attendance", async (req, res) => {
  try {
    const newAttendance = new Attendance(req.body);
    await newAttendance.save();
    res.status(201).json({ message: "Attendance marked successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Error marking attendance" });
  }
});

app.get("/api/attendance", async (req, res) => {
  try {
    const attendanceRecords = await Attendance.find().populate('studentId');
    res.status(200).json(attendanceRecords);
  } catch (error) {
    res.status(500).json({ error: "Error fetching attendance records" });
  }
});

// New endpoint to get Indian festivals
app.get("/api/festivals", async (req, res) => {
  try {
    const response = await axios.get('https://date.nager.at/api/v3/PublicHolidays/2025/AT');
    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Error fetching festivals" });
  }
});

// Class Schema, Model, and Upcoming Classes Endpoint
const classSchema = new mongoose.Schema({
  title: String,
  date: Date,
  // Add any additional fields as needed
});

const Class = mongoose.model("Class", classSchema);

app.get("/api/classes/upcoming", async (req, res) => {
  try {
    const today = new Date();
    const upcomingClasses = await Class.find({ date: { $gte: today } }).sort({ date: 1 });
    res.status(200).json(upcomingClasses);
  } catch (error) {
    res.status(500).json({ error: "Error fetching upcoming classes" });
  }
});

// Event Schema, Model, and Endpoints
const eventSchema = new mongoose.Schema({
  title: String,
  start: Date,
  end: Date,
  slot: String,
  batch: String,
  course: String,
});

const Event = mongoose.model("Event", eventSchema);

app.post("/api/events", async (req, res) => {
  try {
    const newEvent = new Event(req.body);
    await newEvent.save();

    // Set a reminder one day before the event
    const reminderDate = new Date(newEvent.start);
    reminderDate.setDate(reminderDate.getDate() - 1);
    await axios.post('http://localhost:5000/api/reminders', {
      title: `Reminder: ${newEvent.title}`,
      start: reminderDate,
      end: reminderDate,
      allDay: true,
    });

    // Return the newly added event
    res.status(201).json({ message: "Event added successfully!", event: newEvent });
  } catch (error) {
    res.status(500).json({ error: "Error adding event" });
  }
});

app.get("/api/events", async (req, res) => {
  try {
    const events = await Event.find();
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ error: "Error fetching events" });
  }
});

app.put("/api/events/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedEvent = await Event.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json(updatedEvent);
  } catch (error) {
    res.status(500).json({ error: "Error updating event" });
  }
});

app.delete("/api/events/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Event.findByIdAndDelete(id);
    res.status(200).json({ message: "Event deleted successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting event" });
  }
});

// Settings 
app.get('/api/user', async (req, res) => {
  try {
    // Replace this with actual logic to fetch user details from the database
    const user = {
      name: 'John Doe',
      email: 'john.doe@example.com',
    };
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching user details' });
  }
});

// Use routes
app.use("/api/users", userRoutes);

// Global error handler middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Something went wrong. Please try again later." });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});