/**
 * Authentication Controller
 * Handles registration and login logic for users (normal & org)
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createUser, getUserByEmail } = require('../services/user.service');

const JWT_SECRET = process.env.JWT_SECRET || 'devsecretkey';

// ─── Input Validation Helper ─────────────────────────────────────────────────
function validateRegisterInput({ full_name, email, password, role, org_name, org_contact }) {
  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    return 'Valid email is required.';
  }
  if (!password || password.length < 6) {
    return 'Password must be at least 6 characters.';
  }
  if (role === 'org') {
    if (!org_name || !org_name.trim()) return 'Organization name is required.';
    if (!org_contact || !org_contact.trim()) return 'Organization contact name is required.';
  } else {
    if (!full_name || !full_name.trim()) return 'Full name is required.';
  }
  return null;
}

function validateLoginInput({ email, password }) {
  if (!email || !password) return 'Email and password are required.';
  return null;
}

// ─── Register ─────────────────────────────────────────────────────────────────
/**
 * POST /api/auth/register
 * Body: { full_name, email, password, role, org_name?, org_contact? }
 * 
 * - role 'org': org account created with status 'pending', requires admin approval
 * - role 'user': account created immediately, active
 */
async function register(req, res) {
  try {
    const { full_name, email, password, role, org_name, org_contact } = req.body;

    // Sanitize role — only allow 'user' or 'org'
    const safeRole = role === 'org' ? 'org' : 'user';

    // Validate inputs
    const validationError = validateRegisterInput({ full_name, email, password, role: safeRole, org_name, org_contact });
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check for duplicate email
    const existingUser = await getUserByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(409).json({ message: 'This email is already registered.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Build user object
    const userToCreate = {
      full_name: safeRole === 'org' ? (org_contact || '').trim() : full_name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: safeRole,
      // Org accounts start as 'pending'; user accounts start as 'active'
      status: safeRole === 'org' ? 'pending' : 'active',
      org_name: safeRole === 'org' ? (org_name || '').trim() : null,
      org_contact: safeRole === 'org' ? (org_contact || '').trim() : null,
    };

    const newUser = await createUser(userToCreate);

    // Never return password
    const { password: _pw, ...safeUser } = newUser;

    return res.status(201).json({ user: safeUser });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

// ─── Login ────────────────────────────────────────────────────────────────────
/**
 * POST /api/auth/login
 * Body: { email, password }
 *
 * Returns JWT token + safe user object.
 * Blocks 'pending' org accounts from logging in.
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Validate
    const validationError = validateLoginInput({ email, password });
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find user
    const user = await getUserByEmail(normalizedEmail);
    if (!user) {
      // Use same message for user-not-found and wrong-password to prevent enumeration
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    // Block pending org accounts
    if (user.role === 'org' && user.status === 'pending') {
      return res.status(403).json({
        message: 'Your organization account is pending approval. You will be notified once approved.',
        code: 'ORG_PENDING',
      });
    }

    // Block any explicitly disabled/rejected accounts
    if (user.status === 'rejected' || user.status === 'disabled') {
      return res.status(403).json({
        message: 'This account has been disabled. Please contact support.',
        code: 'ACCOUNT_DISABLED',
      });
    }

    // Sign JWT
    const payload = {
      id: user.id,
      role: user.role,
      email: user.email,
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });

    // Return safe user (no password)
    const { password: _pw, ...safeUser } = user;

    return res.json({ token, user: safeUser });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

module.exports = { register, login };