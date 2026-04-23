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
        
        if(!isValidPassword(password)){
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

// export const login = async (req, res) => {
//     try {
//         const { identifier, password } = req.body;

//         if (!identifier || !password) {
//             return res.status(400).json({ success: false, message: 'username/email and password are required' });
//         }

//         // 1. Find the user by email or username
//         const [users] = await pool.query('SELECT * FROM users WHERE (email = ? OR username = ?) AND is_active = 1', [identifier, identifier]);
//         const user = users[0];

//         if (!user) {
//             return res.status(401).json({ success: false, message: 'Invalid credentials' });
//         }

//         // 2. Compare the typed password with the hashed password in the DB
//         const isMatch = await bcrypt.compare(password, user.password_hash);
//         if (!isMatch) {
//             return res.status(401).json({ success: false, message: 'Invalid credentials' });
//         }

//         // 3. Generate a JWT Token
//         // We pack the user_id and role_id inside the token so we don't have to query the DB on every single request
//         const token = jwt.sign(
//             { userId: user.user_id, roleId: user.role_id }, 
//             JWT_SECRET, 
//             { expiresIn: '8h' }
//         );

//         // 4. Send token to the client (NEVER send the password_hash back!)
//         res.json({
//             success: true,
//             message: 'Login successful',
//             token: token,
//             user: {
//                 id: user.user_id,
//                 username: user.username,
//                 email: user.email,
//                 role_id: user.role_id
//             }
//         });
//     } catch (error) {
//         console.error('Login Error:', error);
//         res.status(500).json({ success: false, message: 'Internal server error' });
//     }
// };

// export const logout = async (req, res) => {
//     try {
//         // Since JWT tokens are sent to the client and not stored in cookies by default here, 
//         // the actual token destruction happens on the client side. 
//         // We provide this endpoint to complete the auth flow and allow for future backend-side invalidation strategies if needed.
//         res.status(200).json({ 
//             success: true, 
//             message: 'Logout successful' 
//         });
//     } catch (error) {
//         console.error('Logout Error:', error);
//         res.status(500).json({ success: false, message: 'Internal server error' });
//     }
// };



export const login = async (req, res) => {
    try {
        const { identifier, password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({ success: false, message: 'username/email and password are required' });
        }

        const [users] = await pool.query('SELECT * FROM users WHERE (email = ? OR username = ?) AND is_active = 1', [identifier, identifier]);
        const user = users[0];

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user.user_id, roleId: user.role_id }, 
            JWT_SECRET, 
            { expiresIn: '8h' }
        );

        // --- NEW: Set the HTTP-Only Cookie ---
        res.cookie('token', token, {
            httpOnly: true, // Prevents JavaScript from reading the cookie (XSS protection)
            secure: process.env.NODE_ENV === 'production', // true if using HTTPS in production
            sameSite: 'strict', // CSRF protection
            maxAge: 8 * 60 * 60 * 1000 // 8 hours in milliseconds (matches JWT expiration)
        });

        // --- UPDATED: Removed token from the response body ---
        res.json({
            success: true,
            message: 'Login successful',
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

export const logout = async (req, res) => {
    try {
        // --- NEW: Clear the cookie on the server ---
        res.clearCookie('token', {
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production'
        });
        
        res.status(200).json({ 
            success: true, 
            message: 'Logout successful' 
        });
    } catch (error) {
        console.error('Logout Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};


// import bcrypt from 'bcrypt';
// Assuming isValidEmail, isValidPassword, and pool are imported above

export const registerBulk = async (req, res) => {
    try {
        const usersList = req.body; 

        // Ensure the input is an array
        if (!Array.isArray(usersList) || usersList.length === 0) {
            return res.status(400).json({ success: false, message: 'Input must be a non-empty array of user objects' });
        }

        const emailsToCheck = [];
        const usernamesToCheck = [];

        // 1. Validation Loop
        for (const [index, user] of usersList.entries()) {
            const { username, email, password, upt_id } = user;

            // Enforce required fields (including upt_id)
            if (!username || !email || !password || !upt_id) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Row ${index + 1}: All fields (username, email, password, upt_id) are required` 
                });
            }

            if (!isValidEmail(email)) {
                return res.status(400).json({ success: false, message: `Row ${index + 1}: invalid email format` });
            }
            
            if (!isValidPassword(password)) {
                return res.status(400).json({ success: false, message: `Row ${index + 1}: password minimum 4 chars` });
            }

            emailsToCheck.push(email);
            usernamesToCheck.push(username);
        }

        // Prevent duplicates within the payload array itself
        if (new Set(emailsToCheck).size !== emailsToCheck.length || new Set(usernamesToCheck).size !== usernamesToCheck.length) {
            return res.status(400).json({ success: false, message: 'Duplicate email or username found within the provided data list' });
        }

        // 2. Check if any user already exists in DB in a single query
        const [existingUsers] = await pool.query(
            'SELECT email, username FROM users WHERE email IN (?) OR username IN (?)', 
            [emailsToCheck, usernamesToCheck]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({ 
                success: false, 
                message: 'One or more emails or usernames are already in use in the database',
                conflicts: existingUsers // Shows the frontend exactly which ones failed
            });
        }

        // 3. Hash passwords and map data to a 2D array for bulk insertion
        const saltRounds = 10;
        const defaultRoleId = 2;
        
        // MySQL expects an array of arrays for bulk insert: [[val1, val2...], [val1, val2...]]
        const valuesForInsert = await Promise.all(usersList.map(async (user) => {
            const passwordHash = await bcrypt.hash(user.password, saltRounds);
            return [
                user.username, 
                user.email, 
                passwordHash, 
                defaultRoleId, 
                user.upt_id  // Added upt_id here
            ];
        }));

        // 4. Bulk Insert all new users safely
        // Note the double question mark logic: '?' for the whole block, and valuesForInsert is an array of arrays
        const [result] = await pool.query(`
            INSERT INTO users (username, email, password_hash, role_id, upt_id) 
            VALUES ?
        `, [valuesForInsert]);

        res.status(201).json({
            success: true,
            message: `${result.affectedRows} users registered successfully`,
        });

    } catch (error) {
        console.error('Bulk Registration Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};