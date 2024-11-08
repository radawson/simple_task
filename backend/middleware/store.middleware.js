// Middleware to set the `store` type based on the path
function setStoreType(req, res, next) {
  if (req.path.includes('/accounts')) {
    req.store = 'accounts';
  } else if (req.path.includes('/roster')) {
    req.store = 'roster';
  } else {
    return res.status(400).json({ message: 'Invalid store type in path.' });
  }
  next();
}

module.exports = setStoreType;