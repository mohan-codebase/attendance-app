const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Register a new user
const registerUser = async (req, res) => {
    const { name, instituteName, email, mobileNumber, password } = req.body;

    try {
        // Check if the user already exists
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        // Hash the password before saving
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create a new user with the hashed password
        const newUser = new User({ name, instituteName, email, mobileNumber, password: hashedPassword });
        await newUser.save();

        // Return user data except password
        res.status(201).json({ 
            message: 'User registered successfully',
            user: { name: newUser.name, email: newUser.email, instituteName: newUser.instituteName }
        });
    } catch (err) {
        console.error('Error registering user:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Login user and return a token
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid email or password' });

        // Compare password with the stored hashed password
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) return res.status(400).json({ message: 'Invalid email or password' });

        // For testing: Do not generate JWT, just return user info
        res.json({
            message: 'Login successful',
            user: { name: user.name, email: user.email, instituteName: user.instituteName }
        });
    } catch (err) {
        console.error('Error logging in:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { registerUser, loginUser };