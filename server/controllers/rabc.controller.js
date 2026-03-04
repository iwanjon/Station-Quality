import pool from '../config/database.js';

// ==========================================
// PERMISSIONS
// ==========================================

export const getAllPermissions = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM permissions ORDER BY permission_name ASC');
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching permissions:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const createPermission = async (req, res) => {
    try {
        const { permission_name, description } = req.body;

        if (!permission_name) {
            return res.status(400).json({ success: false, message: 'permission_name is required' });
        }

        const [result] = await pool.query(
            'INSERT INTO permissions (permission_name, description) VALUES (?, ?)',
            [permission_name, description || null]
        );

        res.status(201).json({ 
            success: true, 
            message: 'Permission created successfully',
            data: { permission_id: result.insertId, permission_name, description }
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'Permission name already exists' });
        }
        console.error('Error creating permission:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ==========================================
// ROLES
// ==========================================

export const getAllRoles = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM roles ORDER BY role_name ASC');
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching roles:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const createRole = async (req, res) => {
    try {
        const { role_name, description } = req.body;

        if (!role_name) {
            return res.status(400).json({ success: false, message: 'role_name is required' });
        }

        const [result] = await pool.query(
            'INSERT INTO roles (role_name, description) VALUES (?, ?)',
            [role_name, description || null]
        );

        res.status(201).json({ 
            success: true, 
            message: 'Role created successfully',
            data: { role_id: result.insertId, role_name, description }
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'Role name already exists' });
        }
        console.error('Error creating role:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ==========================================
// LINKING ROLE + PERMISSION
// ==========================================

export const assignPermissionToRole = async (req, res) => {
    try {
        const { role_id, permission_id } = req.body;

        if (!role_id || !permission_id) {
            return res.status(400).json({ success: false, message: 'role_id and permission_id are required' });
        }

        // INSERT IGNORE prevents a crash if this exact role+permission link already exists
        await pool.query(
            'INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
            [role_id, permission_id]
        );

        res.json({ 
            success: true, 
            message: 'Permission successfully assigned to role' 
        });
    } catch (error) {
        // If a user sends a role_id or permission_id that doesn't exist, MySQL throws a foreign key error
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(404).json({ success: false, message: 'Role or Permission ID does not exist' });
        }
        console.error('Error assigning permission:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};












// ==========================================
// UPDATE & DELETE PERMISSIONS
// ==========================================

export const updatePermission = async (req, res) => {
    try {
        const { id } = req.params;
        const { permission_name, description } = req.body;

        if (!permission_name) {
            return res.status(400).json({ success: false, message: 'permission_name is required' });
        }

        const [result] = await pool.query(
            'UPDATE permissions SET permission_name = ?, description = ? WHERE permission_id = ?',
            [permission_name, description || null, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Permission not found' });
        }

        res.json({ success: true, message: 'Permission updated successfully' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'Permission name already exists' });
        }
        console.error('Error updating permission:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const deletePermission = async (req, res) => {
    try {
        const { id } = req.params;
        // Thanks to ON DELETE CASCADE, this automatically removes the links in role_permissions too!
        const [result] = await pool.query('DELETE FROM permissions WHERE permission_id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Permission not found' });
        }

        res.json({ success: true, message: 'Permission deleted successfully' });
    } catch (error) {
        console.error('Error deleting permission:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ==========================================
// UPDATE & DELETE ROLES
// ==========================================

export const updateRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role_name, description } = req.body;

        if (!role_name) {
            return res.status(400).json({ success: false, message: 'role_name is required' });
        }

        const [result] = await pool.query(
            'UPDATE roles SET role_name = ?, description = ? WHERE role_id = ?',
            [role_name, description || null, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Role not found' });
        }

        res.json({ success: true, message: 'Role updated successfully' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'Role name already exists' });
        }
        console.error('Error updating role:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const deleteRole = async (req, res) => {
    try {
        const { id } = req.params;
        // Keep in mind: Deleting a role might affect users assigned to it!
        // (If your users table has a strict foreign key to role_id, this might throw an error 
        //  unless you reassign those users to a different role first).
        const [result] = await pool.query('DELETE FROM roles WHERE role_id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Role not found' });
        }

        res.json({ success: true, message: 'Role deleted successfully' });
    } catch (error) {
        // Handle constraint error if users are still using this role
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ 
                success: false, 
                message: 'Cannot delete role because it is assigned to existing users. Reassign users first.' 
            });
        }
        console.error('Error deleting role:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ==========================================
// UNLINK ROLE + PERMISSION (DELETE specific permission from a role)
// ==========================================

export const removePermissionFromRole = async (req, res) => {
    try {
        const { role_id, permission_id } = req.body;

        if (!role_id || !permission_id) {
            return res.status(400).json({ success: false, message: 'role_id and permission_id are required' });
        }

        const [result] = await pool.query(
            'DELETE FROM role_permissions WHERE role_id = ? AND permission_id = ?',
            [role_id, permission_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'That permission is not assigned to that role' });
        }

        res.json({ success: true, message: 'Permission removed from role successfully' });
    } catch (error) {
        console.error('Error removing permission from role:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};