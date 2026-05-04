/**
 * User Controller: Handles user resource requests.
 * Typically, controller functions match the service layer.
 * Assumes Express request/response arguments.
 */

const {
  getAllUsers,
  getUserById,
  updateUserPassword,
  deleteUserById
} = require('../services/user.service');

/**
 * Get all users (optionally filtered by role).
 * Query param: ?role=user|org|admin
 */
async function fetchAllUsers(req, res) {
  try {
    const { role } = req.query;
    const users = await getAllUsers(role);

    // Omit passwords
    const usersSafe = users.map(({ password, ...rest }) => rest);

    res.json({ users: usersSafe });
  } catch (err) {
    console.error('Fetch users failed:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Get single user by ID.
 * Route param: /:id
 */
async function fetchUserById(req, res) {
  try {
    const { id } = req.params;
    const user = await getUserById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const { password, ...userSafe } = user;
    res.json({ user: userSafe });
  } catch (err) {
    console.error('Fetch user by id failed:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Update user password
 * Route param: /:id/password
 * Body: { newPassword: string }
 * You must hash the password before calling this function (not here).
 */
async function updatePassword(req, res) {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    if (!newPassword) {
      return res.status(400).json({ message: 'New password required.' });
    }
    // In a real app, only allow if permitted (self or admin), hash password beforehand
    const updated = await updateUserPassword(id, newPassword);
    if (!updated) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const { password, ...userSafe } = updated;
    res.json({ message: 'Password updated.', user: userSafe });
  } catch (err) {
    console.error('Update password failed:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Delete user by ID
 * Route param: /:id
 */
async function removeUser(req, res) {
  try {
    const { id } = req.params;
    const deleted = await deleteUserById(id);
    if (!deleted) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const { password, ...userSafe } = deleted;
    res.json({ message: 'User deleted.', user: userSafe });
  } catch (err) {
    console.error('Delete user failed:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  fetchAllUsers,
  fetchUserById,
  updatePassword,
  removeUser,
};