import crypto from 'crypto';

/**
 * Middleware to generate SCRAM-SHA-1 keys for Prosody's authentication.
 * This middleware computes the `stored_key`, `server_key`, `salt`, and `iteration_count`
 * based on the provided password.
 *
 * @param {number} iterationCount - The number of iterations for PBKDF2.
 */
const generateScramKeys = (iterationCount = 10000) => {
  return (req, res, next) => {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: 'Missing required field: password' });
    }

    try {
      // Step 1: Generate a random salt and format it with dashes
      const rawSalt = crypto.randomBytes(16).toString('hex');
      const salt = formatSalt(rawSalt);  // Use custom formatting for the salt value

      // Step 2: Derive the SaltedPassword using PBKDF2
      crypto.pbkdf2(password, salt, iterationCount, 20, 'sha1', (err, saltedPassword) => {
        if (err) {
          return res.status(500).json({ message: 'Failed to generate salted password', error: err });
        }

        // Step 3: Generate the Client Key (Stored Key)
        const clientKey = crypto.createHmac('sha1', saltedPassword).update('Client Key').digest();

        // Step 4: Hash the Client Key to get the Stored Key
        const storedKey = crypto.createHash('sha1').update(clientKey).digest('hex');

        // Step 5: Generate the Server Key
        const serverKey = crypto.createHmac('sha1', saltedPassword).update('Server Key').digest('hex');

        // Attach derived keys to the request context
        req.derivedKeys = {
          stored_key: storedKey,
          server_key: serverKey,
          salt: salt,
          iteration_count: iterationCount,
        };

        next();  // Proceed to the next middleware or route handler
      });
    } catch (error) {
      console.error('Error generating SCRAM-SHA-1 keys:', error);
      return res.status(500).json({ message: 'Error generating SCRAM-SHA-1 keys', error });
    }
  };
};

/**
 * Format the salt to include dashes for readability.
 * For example: Convert "ef6de59374ef4bf4b32f7caf6edfa233" into "ef6de593-74ef-4bf4-b32f-7caf6edfa233".
 *
 * @param {string} rawSalt - The raw salt value generated by crypto.
 * @returns {string} - The formatted salt value with dashes.
 */
const formatSalt = (rawSalt) => {
  return rawSalt.replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');
};

export default generateScramKeys;