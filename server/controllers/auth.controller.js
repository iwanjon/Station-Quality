import pool from '../config/database.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { isValidEmail, isValidPassword } from '../utils/validators.js';

// Make sure to put this in your .env file!
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_fallback_key';

export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        if (!isValidEmail(email)){
            return res.status(400).json({ success: false, message: 'invalid email format' });
        }
        
        if(!isValidPassword){
            return res.status(400).json({ success: false, message: 'password minimum 4 chars' });
        }

        // 1. Check if user already exists
        const [existingUsers] = await pool.query('SELECT * FROM users WHERE email = ? OR username = ?', [email, username]);
        if (existingUsers.length > 0) {
            return res.status(409).json({ success: false, message: 'Email or Username already in use' });
        }

        // 2. Hash the password (Cost factor of 10 is standard)
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // 3. Assign a default role (Assume role_id 2 is 'Viewer'. In reality, query your roles table to get the ID safely)
        const defaultRoleId = 2; 

        // 4. Insert the new user safely
        const [result] = await pool.query(`
            INSERT INTO users (username, email, password_hash, role_id) 
            VALUES (?, ?, ?, ?)
        `, [username, email, passwordHash, defaultRoleId]);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: { userId: result.insertId }
        });
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Find the user by email
        const [users] = await pool.query('SELECT * FROM users WHERE email = ? AND is_active = 1', [email]);
        const user = users[0];

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // 2. Compare the typed password with the hashed password in the DB
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // 3. Generate a JWT Token
        // We pack the user_id and role_id inside the token so we don't have to query the DB on every single request
        const token = jwt.sign(
            { userId: user.user_id, roleId: user.role_id }, 
            JWT_SECRET, 
            { expiresIn: '8h' }
        );

        // 4. Send token to the client (NEVER send the password_hash back!)
        res.json({
            success: true,
            message: 'Login successful',
            token: token,
            user: {
                id: user.user_id,
                username: user.username,
                email: user.email,
                role_id: user.role_id
            }
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};