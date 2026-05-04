const express = require('express');
const {
  getAllUsers,
  getUserById,
  deleteUserById,
  updateUserPassword
} = require('../services/user.service');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Get all users, optionally filtered by role (?role=org or ?role=user)
// Protected route: needs authentication
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { role } = req.query;
    const users = await getAllUsers(role);
    // Optionally omit passwords from each user
    const usersSafe = users.map(u => {
      const { password, ...rest } = u;
      return rest;
    });

    // Send back token and info from the database
    res.json({ token: req.token, users: usersSafe });
  } catch (err) {
    console.error('Fetch users failed:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user by ID -- Protected route
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await getUserById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    // Omit password in the response
    const { password, ...userSafe } = user;

    res.json({ token: req.token, user: userSafe });
  } catch (err) {
    console.error('Fetch user by id failed:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete user by ID -- Protected route
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await deleteUserById(id);
    if (!deleted) {
      return res.status(404).json({ message: 'User not found.' });
    }
    // Omit password from deleted user info
    const { password, ...userSafe } = deleted;
    res.json({ token: req.token, message: 'User deleted.', user: userSafe });
  } catch (err) {
    console.error('Delete user failed:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update user password -- Protected route
router.put('/:id/password', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    if (!newPassword) {
      return res.status(400).json({ message: 'New password required.' });
    }
    // In a real app, you should hash the password here and verify permissions
    // For demonstration, assume it's already hashed if needed
    const updated = await updateUserPassword(id, newPassword);
    if (!updated) {
      return res.status(404).json({ message: 'User not found.' });
    }
    // Omit password from response
    const { password, ...userSafe } = updated;
    res.json({ token: req.token, message: 'Password updated.', user: userSafe });
  } catch (err) {
    console.error('Update password failed:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;