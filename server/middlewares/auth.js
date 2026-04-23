import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_fallback_key';


// Middleware 1: Check if the user is logged in at all
export const requireAuth = async (req, res, next) => {
    // --- UPDATED: Read token from cookies instead of headers ---
    const token = req.cookies?.token; 

    if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; 
        
        next(); 
    } catch (error) {
        // If token expires, it will fail verification here
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
};


// // Middleware 1: Check if the user is logged in at all
// export const requireAuth = async (req, res, next) => {
//     const authHeader = req.headers.authorization;

//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//         return res.status(401).json({ success: false, message: 'No token provided' });
//     }

//     const token = authHeader.split(' ')[1];
//     let result;

//     try {
//         const decoded = jwt.verify(token, JWT_SECRET);
//         req.user = decoded; // Attach the { userId, roleId } to the request
//         // console.log(req.user)

//         // if (req.user.roleId !== 1) {
//         // [result] = await pool.query(`
//         //         SELECT 
//         //             s.stasiun_id, 
//         //             s.kode_stasiun
//         //         FROM 
//         //             users u
//         //         JOIN 
//         //             stasiun s ON u.upt_id = s.upt_id
//         //         WHERE 
//         //             u.user_id = ?;
//         //     `, [req.user.userId]);
//         // } else {
//         //     [result] = await pool.query(`
//         //         SELECT 
//         //             s.stasiun_id, 
//         //             s.kode_stasiun
//         //         FROM 
//         //             stasiun s
//         //         `);
//         // }


        

//             // req.user.stasiun_id = sta_id;
//             // req.user.kode_stasiun = sta_code;


//             // req.user.stasiun_id = result.map(item => item.stasiun_id);
//             // req.user.kode_stasiun = result.map(item => item.kode_stasiun);

//             // console.log(req.user)
        
//         next(); // Move to the next function
//     } catch (error) {
//         return res.status(401).json({ success: false, message: 'Invalid or expired token' });
//     }
// };

// // Middleware 2: Check if the user has a specific permission
// export const requirePermission = (requiredPermission) => {
//     return async (req, res, next) => {
//         try {
//             const roleId = req.user.roleId;

//             // Query the pivot table to see if this role is allowed to do this action
//             const [rows] = await pool.query(`
//                 SELECT p.permission_name 
//                 FROM role_permissions rp
//                 INNER JOIN permissions p ON rp.permission_id = p.permission_id
//                 WHERE rp.role_id = ? AND p.permission_name = ?
//             `, [roleId, requiredPermission]);

//             if (rows.length === 0) {
//                 return res.status(403).json({ success: false, message: 'Forbidden: Insufficient permissions' });
//             }

//             next(); // User has permission, allow the request to continue
//         } catch (error) {
//             console.error('Permission Check Error:', error);
//             res.status(500).json({ success: false, message: 'Internal server error' });
//         }
//     };
// };

// import jwt from 'jsonwebtoken';
// import pool from '../lib/db.js';

// ... (keep your requireAuth middleware here) ...

// /**
//  * @param {string|string[]} requiredPermissions - The permission(s) needed
//  * @param {boolean} requireAll - TRUE = User needs ALL permissions (AND). FALSE = User needs AT LEAST ONE (OR).
//  */
// export const requirePermissions = (requiredPermissions, requireAll = true) => {
//     return async (req, res, next) => {
//         try {
//             const roleId = req.user.roleId;

//             // 1. Normalize input: If they pass a single string, wrap it in an array
//             const permsArray = Array.isArray(requiredPermissions) 
//                 ? requiredPermissions 
//                 : [requiredPermissions];

//             if (permsArray.length === 0) return next();

//             // 2. Safely create dynamic placeholders like: "?, ?, ?"
//             const placeholders = permsArray.map(() => '?').join(', ');

//             // 3. Query the DB to see which of the requested permissions this role actually has
//             // We use the IN() clause to check multiple values in one query
//             const [rows] = await pool.query(`
//                 SELECT p.permission_name 
//                 FROM role_permissions rp
//                 INNER JOIN permissions p ON rp.permission_id = p.permission_id
//                 WHERE rp.role_id = ? AND p.permission_name IN (${placeholders})
//             `, [roleId, ...permsArray]); // Spread operator safely passes the variables

//             // Extract just the names into a simple array, e.g., ['read_station', 'export_data']
//             const foundPermissions = rows.map(row => row.permission_name);

//             // 4. Evaluate based on the 'requireAll' flag
//             if (requireAll) {
//                 // AND LOGIC: User must have every single permission requested
//                 const hasAll = permsArray.every(perm => foundPermissions.includes(perm));
//                 if (!hasAll) {
//                     return res.status(403).json({ 
//                         success: false, 
//                         message: 'Forbidden: You are missing required permissions.' 
//                     });
//                 }
//             } else {
//                 // OR LOGIC: User only needs at least one of the requested permissions
//                 if (foundPermissions.length === 0) {
//                     return res.status(403).json({ 
//                         success: false, 
//                         message: 'Forbidden: You do not have any of the required permissions.' 
//                     });
//                 }
//             }

//             // 5. If they pass the checks, let them through!
//             next();

//         } catch (error) {
//             console.error('Permission Check Error:', error);
//             res.status(500).json({ success: false, message: 'Internal server error' });
//         }
//     };
// };





/**
 * @param {string|string[]} requiredPermissions - The permission(s) needed
 * @param {boolean} requireAll - TRUE = User needs ALL permissions (AND). FALSE = User needs AT LEAST ONE (OR).
 */
export const requirePermissions = (requiredPermissions, requireAll = true) => {
    return async (req, res, next) => {
        try {
            const roleId = req.user.roleId;
            // Assuming your auth middleware also attaches the role name (e.g., 'admin')
            // If it's stored differently (like req.user.role), adjust this variable!
            // const roleName = req.user.roleName || req.user.role; 

            // --- 1. THE ADMIN BYPASS ---
            // If the user is an admin, instantly grant access and skip the DB query!
            // (You can also check `if (roleId === 1)` if Admin is always ID 1 in your DB)


            const [roles] = await pool.query(`
                SELECT 
                    u.role_id, 
                    u.role_name, 
                    u.description
                FROM roles u 
                 WHERE u.role_id = ?
            `, [roleId]);

            const role = roles[0];
            console.log(role);
            if (role.role_name === 'admin' || role.role_name === 'superadmin' || role.role_name === 'administrator') {
                return next();
            }

            // 2. Normalize input: If they pass a single string, wrap it in an array
            const permsArray = Array.isArray(requiredPermissions) 
                ? requiredPermissions 
                : [requiredPermissions];

            if (permsArray.length === 0) return next();

            // 3. Safely create dynamic placeholders like: "?, ?, ?"
            const placeholders = permsArray.map(() => '?').join(', ');

            // 4. Query the DB to see which of the requested permissions this role actually has
            const [rows] = await pool.query(`
                SELECT p.permission_name 
                FROM role_permissions rp
                INNER JOIN permissions p ON rp.permission_id = p.permission_id
                WHERE rp.role_id = ? AND p.permission_name IN (${placeholders})
            `, [roleId, ...permsArray]); 

            // Extract just the names into a simple array, e.g., ['station:read', 'station:import']
            const foundPermissions = rows.map(row => row.permission_name);

            // 5. Evaluate based on the 'requireAll' flag
            if (requireAll) {
                // AND LOGIC: User must have every single permission requested
                const hasAll = permsArray.every(perm => foundPermissions.includes(perm));
                if (!hasAll) {
                    console.error('Permission Check Error:', "all permissions required");
                    return res.status(403).json({ 
                        success: false, 
                        message: 'Forbidden: You are missing required permissions.' 
                    });
                }
            } else {
                // OR LOGIC: User only needs at least one of the requested permissions
                if (foundPermissions.length === 0) {
                    console.error('Permission Check Error:', "no permission found");
                    return res.status(403).json({ 
                        success: false, 
                        message: 'Forbidden: You do not have any of the required permissions.' 
                    });
                }
            }

            // 6. If they pass the checks, let them through!
            next();

        } catch (error) {
            console.error('Permission Check Error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    };
};