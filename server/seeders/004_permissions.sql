INSERT INTO
    `permissions` (
        `permission_name`,
        `description`
    )
VALUES
    -- Authentication (Optional, usually public but good to have in DB)
    (
        'auth:register',
        'Allow users to register a new account'
    ),
    (
        'auth:login',
        'Allow users to authenticate and log in'
    ),

-- Station Management
(
    'station:read',
    'View station data, lists, and recent updates'
),
(
    'station:update',
    'Update existing station information'
),
(
    'station:import',
    'Import multiple stations via CSV file'
),
(
    'station_options:read',
    'View valid foreign key options for stations'
),
(
    'station_photo:upload',
    'Upload site photos for a specific station'
),
(
    'station_photo:delete',
    'Delete existing site photos of a station'
),

-- Station History
(
    'station_history:read',
    'View historical logs and data for stations'
),
(
    'station_history:update',
    'Update specific station history logs'
),
(
    'station_history_image:read',
    'View response images attached to station history'
),

-- Quality Control & Latency
(
    'availability:read',
    'View overall station availability data'
),
(
    'slmon:read',
    'View the last status data from SLMON'
),
(
    'latency:read',
    'View detailed latency metadata for specific stations'
),
(
    'latency_history:read',
    'View 7-day historical latency data'
),
(
    'qc_site:read',
    'View site quality control details and metrics'
),
(
    'qc_summary:read',
    'View daily and 7-day quality control summary reports'
),
(
    'qc_detail:read',
    'View detailed quality control data for specific dates'
),

-- Signal & PSD Images
(
    'image_psd:read',
    'Access and view generated PSD image streams'
),
(
    'image_signal:read',
    'Access and view generated Signal image streams'
),

-- Role & Permission Management (Super Admin Level)
(
    'permission:read',
    'View the complete list of system permissions'
),
(
    'permission:create',
    'Create new custom permissions in the system'
),
(
    'permission:update',
    'Modify existing system permissions'
),
(
    'permission:delete',
    'Remove permissions from the system'
),
(
    'role:read',
    'View the list of available user roles'
),
(
    'role:create',
    'Create new user roles'
),
(
    'role:update',
    'Modify existing user roles'
),
(
    'role:delete',
    'Delete existing user roles'
),
(
    'role_permission:assign',
    'Assign specific permissions to a role'
),
(
    'role_permission:revoke',
    'Revoke permissions from a role'
);