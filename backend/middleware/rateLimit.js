const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

// Which client a request belongs to.
//
// The app runs behind Render's proxy, so req.ip is the proxy's address — every
// visitor would share a single bucket and the first person to hit the limit
// would lock out everybody. Express's `trust proxy` would fix that globally,
// but it changes behaviour for the whole app, so the client address is read
// here instead.
//
// The LAST entry of X-Forwarded-For is used, not the first: each proxy appends
// the address it received the request from, so with exactly one proxy in front
// the last entry is the address Render saw. A client can prepend anything it
// likes to that header, and taking the first entry would let it hand itself a
// fresh bucket per request.
const clientKey = (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.trim()) {
        const hops = forwarded.split(',');
        const last = hops[hops.length - 1].trim();
        // Normalises IPv6 to a /64 so one client can't cycle through addresses
        // inside its own prefix.
        if (last) return ipKeyGenerator(last);
    }
    return ipKeyGenerator(req.ip);
};

const tooMany = { message: 'Too many requests. Please try again in a little while.' };

const shared = {
    standardHeaders: true,
    legacyHeaders: false,
    message: tooMany,
    // The custom keyGenerator above already handles the proxy, so silence the
    // library's warning about `trust proxy` being unset.
    validate: { xForwardedForHeader: false, trustProxy: false },
};

// Asking for a reset link, capped per address.
const forgotPasswordIpLimiter = rateLimit({
    ...shared,
    windowMs: 15 * 60 * 1000,
    limit: 5,
    keyGenerator: clientKey,
});

// ...and capped per account, so a mailbox cannot be flooded from many
// addresses. Keyed on whatever email was submitted, counted whether or not an
// account exists — otherwise a 429 would itself reveal which addresses are
// registered.
const forgotPasswordEmailLimiter = rateLimit({
    ...shared,
    windowMs: 60 * 60 * 1000,
    limit: 3,
    keyGenerator: (req) => {
        const email = (req.body?.email || '').trim().toLowerCase();
        return email ? `email:${email}` : clientKey(req);
    },
});

// Redeeming a link. A token is 32 random bytes, so this is not what stops it
// being guessed — it is here to keep someone from hammering the endpoint.
const resetPasswordLimiter = rateLimit({
    ...shared,
    windowMs: 15 * 60 * 1000,
    limit: 10,
    keyGenerator: clientKey,
});

module.exports = {
    forgotPasswordIpLimiter,
    forgotPasswordEmailLimiter,
    resetPasswordLimiter,
};
