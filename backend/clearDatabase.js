const mongoose = require('mongoose');
const Admission = require('./models/Admission');
const User = require('./models/User');
const Attendance = require('./models/Attendance');

const clearDatabase = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/Mohan-App', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    await Admission.deleteMany({});
    await User.deleteMany({});
    await Attendance.deleteMany({});

    console.log('Database cleared successfully');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error clearing database:', error);
    mongoose.connection.close();
  }
};

clearDatabase();