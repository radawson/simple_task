const jwt = require('jsonwebtoken');
const config = require('../config');

// JWT verification middleware
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).json({ success: false, message: 'No token provided.' });
    }

    jwt.verify(token, config.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ success: false, message: 'Failed to authenticate token.' });
        }

        // If token is valid, save decoded payload to request for use in other routes
        req.user = decoded;
        next();
    });
};

module.exports = verifyToken;
