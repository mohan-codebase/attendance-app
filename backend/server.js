const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const axios = require("axios");
const userRoutes = require("./routes/userRoutes");
const requireAuth = require("./middleware/auth");
const User = require("./models/User");

const path = require("path");
const fs = require("fs");

const envFile =
  process.env.NODE_ENV === "production" &&
  fs.existsSync(path.resolve(__dirname, ".env.production"))
    ? ".env.production"
    : ".env";

dotenv.config({ path: path.resolve(__dirname, envFile) });

const app = express();
const PORT = process.env.PORT || 5001;

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    
    // Check if CORS_ORIGIN is set to wildcard or matches
    const configuredOrigin = process.env.CORS_ORIGIN;
    if (configuredOrigin === "*" || !configuredOrigin) {
      return callback(null, true);
    }
    
    // Split comma-separated origins if provided
    const allowedOrigins = configuredOrigin.split(",").map(o => o.trim());
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith(".vercel.app") ||
      origin.includes("localhost")
    ) {
      return callback(null, true);
    }

    return callback(null, true); // Permissive fallback for smooth deployments
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));
// Profile photos are sent inline as base64 data URIs, so the body can be a few
// hundred KB — well past express' 100kb default.
app.use(express.json({ limit: "5mb" }));

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Attendance API is online and running" });
});

// Public auth routes (register/login) must be mounted before the auth gate below
app.use("/api/users", userRoutes);

// Everything else under /api requires a valid token
app.use("/api", requireAuth);

// Every record below belongs to the account that created it. `owner` is set
// from the verified token, never from the request body, and every read, update
// and delete is filtered by it -- otherwise one institute could see, edit or
// delete another's students just by knowing an id.
const ownerField = {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  required: true,
  index: true,
};

// A client must not be able to reassign ownership or the id by putting them in
// an update body.
const stripReadOnly = ({ owner, _id, __v, ...rest }) => rest;

const notFound = (res) =>
  res.status(404).json({ message: "Not found, or not yours to change" });

mongoose.connect(process.env.MONGO_URI).then(() => console.log("MongoDB connected"))
  .catch(err => {
    console.error("MongoDB connection failed", err);
    process.exit(1);
  });

// Admission Schema and Model
const admissionSchema = new mongoose.Schema({
  owner: ownerField,
  name: { type: String, required: true },
  mobile: { type: String, required: true },
  email: { type: String, required: true },
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

// Uniqueness is per account, not global: two institutes may both enrol the
// same person, and a global index would also leak that some other institute
// already holds that email.
admissionSchema.index({ owner: 1, email: 1 }, { unique: true });
admissionSchema.index({ owner: 1, mobile: 1 }, { unique: true });

const Admission = mongoose.model("Admission", admissionSchema);

// Endpoint to check if email or mobile already exists
app.post("/api/admissions/check", async (req, res) => {
  const { email, mobile } = req.body;

  try {
    const existingStudent = await Admission.findOne({
      owner: req.userId,
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
    const newAdmission = new Admission({ ...stripReadOnly(req.body), owner: req.userId });
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
    const admissions = await Admission.find({ owner: req.userId });
    res.status(200).json(admissions);
  } catch (error) {
    console.error("Error fetching admissions:", error);
    res.status(500).json({ error: "Error fetching admissions" });
  }
});

// New endpoint to get grouped admissions data
app.get("/api/admissions/grouped", async (req, res) => {
  try {
    const admissions = await Admission.find({ owner: req.userId });
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
    const deleted = await Admission.findOneAndDelete({ _id: id, owner: req.userId });
    if (!deleted) return notFound(res);
    res.status(200).json({ message: "Admission deleted successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting admission" });
  }
});

app.put("/api/admissions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedAdmission = await Admission.findOneAndUpdate(
      { _id: id, owner: req.userId },
      stripReadOnly(req.body),
      { new: true }
    );
    if (!updatedAdmission) return notFound(res);
    res.status(200).json(updatedAdmission);
  } catch (error) {
    res.status(500).json({ error: "Error updating admission" });
  }
});

// Student schema and model
const studentSchema = new mongoose.Schema({
  owner: ownerField,
  name: String,
  // Add other fields as needed
});

const Student = mongoose.model("Student", studentSchema);

app.get("/api/students", async (req, res) => {
  try {
    const students = await Student.find({ owner: req.userId });
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ error: "Error fetching students" });
  }
});

// Attendance schema and model
const attendanceSchema = new mongoose.Schema({
  owner: ownerField,
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admission' },
  date: { type: Date, default: Date.now },
  status: String,
});

const Attendance = mongoose.model("Attendance", attendanceSchema);

app.post("/api/attendance", async (req, res) => {
  try {
    // The student must be one of this account's, or attendance could be
    // written against another institute's roster.
    const student = await Admission.findOne({
      _id: req.body.studentId,
      owner: req.userId,
    });
    if (!student) return notFound(res);

    const newAttendance = new Attendance({
      ...stripReadOnly(req.body),
      owner: req.userId,
    });
    await newAttendance.save();
    res.status(201).json({ message: "Attendance marked successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Error marking attendance" });
  }
});

app.get("/api/attendance", async (req, res) => {
  try {
    const attendanceRecords = await Attendance.find({ owner: req.userId }).populate('studentId');
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
  owner: ownerField,
  title: String,
  date: Date,
  // Add any additional fields as needed
});

const Class = mongoose.model("Class", classSchema);

app.get("/api/classes/upcoming", async (req, res) => {
  try {
    const today = new Date();
    const upcomingClasses = await Class.find({
      owner: req.userId,
      date: { $gte: today },
    }).sort({ date: 1 });
    res.status(200).json(upcomingClasses);
  } catch (error) {
    res.status(500).json({ error: "Error fetching upcoming classes" });
  }
});

// Event Schema, Model, and Endpoints
const eventSchema = new mongoose.Schema({
  owner: ownerField,
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
    const newEvent = new Event({ ...stripReadOnly(req.body), owner: req.userId });
    await newEvent.save();
    // Return the newly added event
    res.status(201).json({ message: "Event added successfully!", event: newEvent });
  } catch (error) {
    res.status(500).json({ error: "Error adding event" });
  }
});

app.get("/api/events", async (req, res) => {
  try {
    const events = await Event.find({ owner: req.userId });
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ error: "Error fetching events" });
  }
});

app.put("/api/events/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedEvent = await Event.findOneAndUpdate(
      { _id: id, owner: req.userId },
      stripReadOnly(req.body),
      { new: true }
    );
    if (!updatedEvent) return notFound(res);
    res.status(200).json(updatedEvent);
  } catch (error) {
    res.status(500).json({ error: "Error updating event" });
  }
});

app.delete("/api/events/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Event.findOneAndDelete({ _id: id, owner: req.userId });
    if (!deleted) return notFound(res);
    res.status(200).json({ message: "Event deleted successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting event" });
  }
});

// User profile endpoints (Settings & Auth)
app.get('/api/user', async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching user details' });
  }
});

// Accepts a stored avatar value: an empty string (clear it), an http(s) URL
// (e.g. the one Google gives us), or an inline base64 image no larger than
// ~800 KB decoded. Anything else is rejected so we don't persist junk.
const MAX_AVATAR_BYTES = 800 * 1024;
const checkAvatar = (avatar) => {
  if (avatar === null || avatar === '') return { ok: true, value: '' };
  if (typeof avatar !== 'string') return { ok: false };
  if (/^https?:\/\//i.test(avatar)) return { ok: true, value: avatar };
  if (!/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(avatar)) return { ok: false };
  const b64 = avatar.slice(avatar.indexOf(',') + 1);
  const bytes = Math.floor((b64.length * 3) / 4);
  if (bytes > MAX_AVATAR_BYTES) return { ok: false, tooBig: true };
  return { ok: true, value: avatar };
};

app.put('/api/user', async (req, res) => {
  try {
    const { name, email, instituteName, mobileNumber, avatar } = req.body;
    const update = { name, email, instituteName, mobileNumber };

    if (avatar !== undefined) {
      const result = checkAvatar(avatar);
      if (!result.ok) {
        return res.status(400).json({
          error: result.tooBig
            ? 'That image is too large. Please choose a smaller one.'
            : 'That does not look like a valid image.',
        });
      }
      update.avatar = result.value;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      update,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json({ message: 'User updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Error updating user details' });
  }
});

// Global error handler middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Something went wrong. Please try again later." });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});