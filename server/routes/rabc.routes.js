import express from 'express';
// import { requireAuth, requirePermissions } from '../middleware/auth.js';
import { 
    getAllPermissions, createPermission, updatePermission, deletePermission,
    getAllRoles, createRole, updateRole, deleteRole,
    assignPermissionToRole, removePermissionFromRole
} from '../controllers/rabc.controller.js';

const router = express.Router();

// // ALL routes here require login and the 'manage_rbac' permission
// router.use(requireAuth);
// router.use(requirePermissions('manage_rbac'));

// --- PERMISSIONS ---
router.get('/permissions', getAllPermissions);
router.post('/permissions', createPermission);
router.put('/permissions/:id', updatePermission);
router.delete('/permissions/:id', deletePermission);

// --- ROLES ---
router.get('/roles', getAllRoles);
router.post('/roles', createRole);
router.put('/roles/:id', updateRole);
router.delete('/roles/:id', deleteRole);

// --- ROLE PERMISSIONS (Linking / Unlinking) ---
router.post('/roles/permissions', assignPermissionToRole);
router.delete('/roles/permissions', removePermissionFromRole); // We use body for this DELETE request to match the POST

export default router;