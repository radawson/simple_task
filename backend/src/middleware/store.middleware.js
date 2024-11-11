const setStoreType = (req, res, next) => {
  if (req.path.includes('/accounts')) {
    req.store = 'accounts';
  } else if (req.path.includes('/roster')) {
    req.store = 'roster';
  } else {
    return res.status(400).json({ message: 'Invalid store type in path.' });
  }
  next();
}

export default setStoreType;