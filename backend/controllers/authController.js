const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const { sendMail } = require('../utils/mailer');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Same token shape the password login issues, so the frontend treats both alike.
const issueToken = (user) =>
    jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const publicUser = (user) => ({
    name: user.name,
    email: user.email,
    instituteName: user.instituteName,
    avatar: user.avatar,
});

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

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({
            message: 'Login successful',
            token,
            user: { name: user.name, email: user.email, instituteName: user.instituteName }
        });
    } catch (err) {
        console.error('Error logging in:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Sign in / sign up with a Google ID token (Google Identity Services credential).
// The frontend never sees a Google access token — it forwards the ID token, and
// this verifies the signature and audience before trusting anything in it.
const googleAuth = async (req, res) => {
    const { credential } = req.body;

    if (!process.env.GOOGLE_CLIENT_ID) {
        return res.status(503).json({ message: 'Google sign-in is not configured on the server' });
    }
    if (!credential) {
        return res.status(400).json({ message: 'Missing Google credential' });
    }

    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture, email_verified: emailVerified } = payload;

        if (!emailVerified) {
            return res.status(401).json({ message: 'This Google account has no verified email' });
        }

        let user = await User.findOne({ $or: [{ googleId }, { email }] });

        if (!user) {
            user = await User.create({
                name: name || email.split('@')[0],
                email,
                googleId,
                avatar: picture,
                authProvider: 'google',
            });
        } else if (!user.googleId) {
            // An account already exists for this email. Google has verified the
            // address, so link the two rather than creating a duplicate.
            user.googleId = googleId;
            if (!user.avatar) user.avatar = picture;
            await user.save();
        }

        // Google gives us no institute or mobile number; the frontend uses this
        // to send first-time users to Settings to finish their profile.
        const profileComplete = Boolean(user.instituteName && user.mobileNumber);

        res.json({
            message: 'Login successful',
            token: issueToken(user),
            user: publicUser(user),
            profileComplete,
        });
    } catch (err) {
        console.error('Google sign-in failed:', err.message);
        res.status(401).json({ message: 'Could not verify Google sign-in' });
    }
};

// --- Password reset ---

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // one hour
const MIN_PASSWORD_LENGTH = 8;

// Only the hash is stored, so the raw token in the email is the sole key.
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const resetLink = (token) => {
    const base = (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '');
    return `${base}/reset-password/${token}`;
};

// Step 1: ask for a link.
const forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) return res.status(400).json({ message: 'Email is required' });

    // The same answer either way. Saying "no account with that email" would
    // turn this endpoint into a way to find out who has an account here.
    const generic = {
        message: 'If that address has an account, a reset link is on its way.',
    };

    try {
        const user = await User.findOne({ email });

        // Unknown address, or a Google account, which has no password to reset.
        // Both fall through to the same reply.
        if (!user || user.authProvider !== 'local') return res.json(generic);

        const token = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = hashToken(token);
        user.resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
        await user.save();

        const link = resetLink(token);

        await sendMail({
            to: user.email,
            subject: 'Reset your PresentSir password',
            text: [
                `Hi ${user.name},`,
                '',
                'Use the link below to choose a new password. It works once and expires in an hour.',
                '',
                link,
                '',
                "If you didn't ask for this, you can ignore this email — your password stays as it is.",
            ].join('\n'),
            html: `<p>Hi ${user.name},</p>
<p>Use the link below to choose a new password. It works once and expires in an hour.</p>
<p><a href="${link}">Reset your password</a></p>
<p style="color:#6c757d;font-size:13px">If you didn't ask for this, you can ignore this email — your password stays as it is.</p>`,
        });

        res.json(generic);
    } catch (err) {
        console.error('Error starting password reset:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Step 2: use the link.
const resetPassword = async (req, res) => {
    const { token, password } = req.body;

    if (!token || !password) {
        return res.status(400).json({ message: 'Token and new password are required' });
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
        return res
            .status(400)
            .json({ message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
    }

    try {
        const user = await User.findOne({
            resetPasswordToken: hashToken(token),
            resetPasswordExpires: { $gt: new Date() },
        });

        // Covers all of: never issued, already used, expired, tampered with.
        if (!user) {
            return res.status(400).json({ message: 'This reset link is invalid or has expired' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        // Clear it here so the link cannot be replayed.
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ message: 'Password updated. You can sign in now.' });
    } catch (err) {
        console.error('Error resetting password:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { registerUser, loginUser, googleAuth, forgotPassword, resetPassword };