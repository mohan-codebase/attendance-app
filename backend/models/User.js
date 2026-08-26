const mongoose = require('mongoose');

// Fields a Google account cannot supply are required only for local signups.
const isLocalAccount = function () {
  return this.authProvider === 'local';
};

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  instituteName: {
    type: String,
    required: isLocalAccount,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  mobileNumber: {
    type: String,
    required: isLocalAccount,
    validate: {
      validator: function(v) {
        // Skip the check when the field is absent (Google accounts).
        return v == null || v === '' || /^\d{10}$/.test(v);
      },
      message: props => `${props.value} is not a valid 10-digit mobile number!`
    }
  },
  password: {
    type: String,
    required: isLocalAccount,
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local',
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true, // only indexes docs that have the field, so local users don't collide
  },
  avatar: {
    type: String,
  },
  // Password reset. The token stored here is a SHA-256 hash of the one that
  // goes out by email, so a leak of this collection cannot be used to reset
  // anybody's password. Both fields are cleared the moment a reset succeeds.
  resetPasswordToken: {
    type: String,
    index: true,
  },
  resetPasswordExpires: {
    type: Date,
  },
}, {
  timestamps: true,
});

const User = mongoose.model('User', userSchema);

module.exports = User;
