const express = require('express');
const session = require('express-session');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const path = require('path');
const { getPool } = require('./db');
const MySQLStore = require('express-mysql-session')(session);
const fs = require('fs');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Disable caching for all static files to ensure updates are loaded
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});

app.use(express.static(path.join(__dirname)));

//Session configuration
const sessionStore = new MySQLStore({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'HTH_Server1',
    database: process.env.MYSQL_DB || 'hospital_estate',
    port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT, 10) : 3306,
    clearExpired: true,
    checkExpirationInterval: 900000,
    expiration: 86400000
});

app.use(session({
    key: 'hth_estate_session',
    secret: 'your-secret-key-change-in-production',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    rolling: true, // Reset expiration on every request
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
        httpOnly: true,
        secure: false, // Set to true in production with HTTPS
        sameSite: 'lax'
    }
}));

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.status(401).json({ error: 'Authentication required' });
    }
};

const requireSuperAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'super_admin') {
        next();
    } else {
        res.status(403).json({ error: 'Super admin access required' });
    }
};

// Helper function: Convert value to string or null
function toNullableString(val) {
    if (val === undefined || val === null || val === '') return null;
    return String(val).trim();
}

function toIntOrDefault(val, defaultVal) {
    const num = parseInt(val, 10);
    return isNaN(num) ? defaultVal : num;
}

function friendlySqlError(err) {
    if (err.code === 'ER_DUP_ENTRY') {
        return 'A record with this identifier already exists.';
    }
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        return 'Referenced record does not exist.';
    }
    return err.message;
}

// ====== ROUTES ======

// Login route
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }
    
    try {
        const pool = await getPool();
        const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        
        console.log('Login attempt for user:', username);
        console.log('User found:', rows.length > 0);
        
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const user = rows[0];
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        
        console.log('Password valid:', isValidPassword);
        
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Store user in session
        req.session.user = {
            id: user.id,
            username: user.username,
            role: user.role,
            full_name: user.full_name,
            email: user.email
        };
        
        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                full_name: user.full_name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Logged out' });
});

// Check authentication status
app.get('/api/auth/me', (req, res) => {
    if (req.session && req.session.user) {
        res.json({ 
            authenticated: true,
            user: req.session.user 
        });
    } else {
        res.status(401).json({ 
            authenticated: false,
            message: 'Not authenticated' 
        });
    }
});

// Get current user
app.get('/api/current-user', requireAuth, (req, res) => {
    res.json({ user: req.session.user });
});

// Get profile
app.get('/api/profile', requireAuth, async (req, res) => {
    try {
        const pool = await getPool();
        const [rows] = await pool.query('SELECT id, username, role, full_name, email, created_at FROM users WHERE id = ?', [req.session.user.id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(rows[0]);
    } catch (err) {
            res.status(500).json({ error: err.message });
        }
});

// Dashboard Stats
app.get('/api/dashboard/stats', requireAuth, async (req, res) => {
    try {
        const pool = await getPool();
        
        const [housingCount] = await pool.query('SELECT COUNT(*) as count FROM housing_units');
        const [roomCount] = await pool.query('SELECT COUNT(*) as count FROM rooms');
        const [itemCount] = await pool.query('SELECT COUNT(*) as count FROM inventory_items');
        const [employeeCount] = await pool.query('SELECT COUNT(*) as count FROM employees');
        
        res.json({
            totalHousing: housingCount[0].count,
            totalRooms: roomCount[0].count,
            totalItems: itemCount[0].count,
            totalEmployees: employeeCount[0].count
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Housing Units
// Housing Types
app.get('/api/housing-types', requireAuth, async (req, res) => {
    try {
        const pool = await getPool();
        const [rows] = await pool.query('SELECT * FROM housing_types ORDER BY name');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/housing-units', requireAuth, async (req, res) => {
    try {
        const pool = await getPool();
        const [rows] = await pool.query('SELECT * FROM housing_units ORDER BY name');
        res.json(rows);
    } catch (err) {
            res.status(500).json({ error: err.message });
    }
});

app.post('/api/housing-units', requireSuperAdmin, async (req, res) => {
    const name = toNullableString(req.body.name);
    const location = toNullableString(req.body.location);
    const total_rooms = toIntOrDefault(req.body.total_rooms, 0);
    const description = toNullableString(req.body.description);
    try {
        const pool = await getPool();
        const [result] = await pool.query(
            'INSERT INTO housing_units (name, location, total_rooms, description) VALUES (?, ?, ?, ?)',
            [name, location, total_rooms, description]
        );
        res.json({ id: result.insertId, message: 'Housing unit added' });
    } catch (err) {
        res.status(500).json({ error: friendlySqlError(err) });
    }
});

app.put('/api/housing-units/:id', requireSuperAdmin, async (req, res) => {
    const name = toNullableString(req.body.name);
    const location = toNullableString(req.body.location);
    const total_rooms = toIntOrDefault(req.body.total_rooms, 0);
    const description = toNullableString(req.body.description);
    const id = req.params.id;
    try {
        const pool = await getPool();
        await pool.query(
            'UPDATE housing_units SET name=?, location=?, total_rooms=?, description=? WHERE id=?',
            [name, location, total_rooms, description, id]
        );
        res.json({ message: 'Housing unit updated' });
    } catch (err) {
        res.status(500).json({ error: friendlySqlError(err) });
    }
});

app.delete('/api/housing-units/:id', requireSuperAdmin, async (req, res) => {
    const id = req.params.id;
    try {
        const pool = await getPool();
        await pool.query('DELETE FROM housing_units WHERE id=?', [id]);
        res.json({ message: 'Housing unit deleted' });
    } catch (err) {
        res.status(500).json({ error: friendlySqlError(err) });
    }
});

// Rooms
app.get('/api/rooms', requireAuth, async (req, res) => {
    try {
        const pool = await getPool();
    const housingUnitId = req.query.housing_unit_id;
    let query = `
            SELECT r.*, hu.name as housing_unit_name 
        FROM rooms r 
            LEFT JOIN housing_units hu ON r.housing_unit_id = hu.id
        `;
        let params = [];
        if (housingUnitId) {
            query += ' WHERE r.housing_unit_id = ?';
            params.push(housingUnitId);
        }
        query += ' ORDER BY hu.name, r.room_number';
        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (err) {
                res.status(500).json({ error: err.message });
    }
});

app.post('/api/rooms', requireSuperAdmin, async (req, res) => {
    const housing_unit_id = toNullableString(req.body.housing_unit_id);
    const room_number = toNullableString(req.body.room_number);
    const room_type = toNullableString(req.body.room_type);
    const capacity = toIntOrDefault(req.body.capacity, 1);
    const status = toNullableString(req.body.status) || 'available';
    const description = toNullableString(req.body.description);
    try {
        const pool = await getPool();
        const [result] = await pool.query(`
            INSERT INTO rooms (housing_unit_id, room_number, room_type, capacity, status, description)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [housing_unit_id, room_number, room_type, capacity, status, description]
        );
        res.json({ id: result.insertId, message: 'Room added' });
    } catch (err) {
        console.error('Insert room failed:', err, req.body);
        res.status(500).json({ error: friendlySqlError(err) });
    }
});

app.put('/api/rooms/:id', requireSuperAdmin, async (req, res) => {
    const room_number = toNullableString(req.body.room_number);
    const room_type = toNullableString(req.body.room_type);
    const capacity = toIntOrDefault(req.body.capacity, 1);
    const status = toNullableString(req.body.status) || 'available';
    const description = toNullableString(req.body.description);
    const id = req.params.id;
    try {
        const pool = await getPool();
        await pool.query(`UPDATE rooms 
                    SET room_number=?, room_type=?, capacity=?, status=?, description=?
                    WHERE id=?`, [room_number, room_type, capacity, status, description, id]);
        res.json({ message: 'Room updated successfully' });
    } catch (err) {
        console.error('Update room failed:', err, req.body);
        res.status(500).json({ error: friendlySqlError(err) });
    }
});

app.delete('/api/rooms/:id', requireSuperAdmin, async (req, res) => {
    const id = req.params.id;
    try {
        const pool = await getPool();
        await pool.query('DELETE FROM rooms WHERE id=?', [id]);
        res.json({ message: 'Room deleted successfully' });
    }
    catch (err) {
        res.status(500).json({ error: friendlySqlError(err) });
    }
});

// Inventory
app.get('/api/inventory', requireAuth, async (req, res) => {
    try {
        const pool = await getPool();
        const [rows] = await pool.query(`
            SELECT i.*, r.room_number, r.room_type, hu.name as housing_unit_name 
            FROM inventory_items i
            LEFT JOIN rooms r ON i.room_id = r.id
            LEFT JOIN housing_units hu ON r.housing_unit_id = hu.id
            ORDER BY hu.name, r.room_number, i.category, i.name
        `);
            res.json(rows);
    } catch (err) {
                res.status(500).json({ error: err.message });
    }
});

app.post('/api/inventory', requireSuperAdmin, async (req, res) => {
    const room_id = toNullableString(req.body.room_id);
    const name = toNullableString(req.body.name);
    const category = toNullableString(req.body.category);
    const quantity = toIntOrDefault(req.body.quantity, 1);
    const condition = toNullableString(req.body.condition) || 'good';
    const description = toNullableString(req.body.description);
    try {
        const pool = await getPool();
        const [result] = await pool.query(
            'INSERT INTO inventory_items (room_id, name, category, quantity, `condition`, description) VALUES (?, ?, ?, ?, ?, ?)',
            [room_id, name, category, quantity, condition, description]
        );
        res.json({ id: result.insertId, message: 'Inventory item added' });
    } catch (err) {
        res.status(500).json({ error: friendlySqlError(err) });
    }
});

app.put('/api/inventory/:id', requireSuperAdmin, async (req, res) => {
    const name = toNullableString(req.body.name);
    const category = toNullableString(req.body.category);
    const quantity = toIntOrDefault(req.body.quantity, 1);
    const condition = toNullableString(req.body.condition) || 'good';
    const description = toNullableString(req.body.description);
    const id = req.params.id;
    try {
        const pool = await getPool();
        await pool.query(
            'UPDATE inventory_items SET name=?, category=?, quantity=?, `condition`=?, description=? WHERE id=?',
            [name, category, quantity, condition, description, id]
        );
        res.json({ message: 'Inventory item updated' });
    } catch (err) {
        res.status(500).json({ error: friendlySqlError(err) });
    }
});

app.delete('/api/inventory/:id', requireSuperAdmin, async (req, res) => {
    const id = req.params.id;
    try {
        const pool = await getPool();
        await pool.query('DELETE FROM inventory_items WHERE id=?', [id]);
        res.json({ message: 'Inventory item deleted' });
    } catch (err) {
        res.status(500).json({ error: friendlySqlError(err) });
    }
});

// Employees
app.get('/api/employees', requireAuth, async (req, res) => {
    try {
        const pool = await getPool();
        const [rows] = await pool.query(`
        SELECT e.*, r.room_number, r.room_type, hu.name as housing_unit_name
        FROM employees e 
        LEFT JOIN rooms r ON e.assigned_room_id = r.id 
        LEFT JOIN housing_units hu ON r.housing_unit_id = hu.id
            ORDER BY e.name
        `);
        res.json(rows);
    } catch (err) {
            res.status(500).json({ error: err.message });
    }
});

app.post('/api/employees', requireSuperAdmin, async (req, res) => {
    const employee_id = toNullableString(req.body.employee_id);
    const name = toNullableString(req.body.name);
    const department = toNullableString(req.body.department);
    const position = toNullableString(req.body.position);
    const email = toNullableString(req.body.email);
    const phone = toNullableString(req.body.phone);
    const assigned_room_id = toNullableString(req.body.assigned_room_id);
    const status = toNullableString(req.body.status) || 'active';

    try {
        const pool = await getPool();
        
        // Check if room is already assigned to another employee
        if (assigned_room_id) {
            const [existingAssignment] = await pool.query(
                'SELECT e.name, e.employee_id FROM employees e WHERE e.assigned_room_id = ? AND e.status = "active"',
                [assigned_room_id]
            );
            
            if (existingAssignment.length > 0) {
                return res.status(400).json({ 
                    error: `Room is already assigned to ${existingAssignment[0].name} (${existingAssignment[0].employee_id})` 
                });
            }
        }

        const [result] = await pool.query(
            'INSERT INTO employees (employee_id, name, department, position, email, phone, assigned_room_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [employee_id, name, department, position, email, phone, assigned_room_id, status]
        );
        res.json({ id: result.insertId, message: 'Employee added' });
    } catch (err) {
        res.status(500).json({ error: friendlySqlError(err) });
    }
});

app.put('/api/employees/:id', requireSuperAdmin, async (req, res) => {
    const employee_id = toNullableString(req.body.employee_id);
    const name = toNullableString(req.body.name);
    const department = toNullableString(req.body.department);
    const position = toNullableString(req.body.position);
    const email = toNullableString(req.body.email);
    const phone = toNullableString(req.body.phone);
    const assigned_room_id = toNullableString(req.body.assigned_room_id);
    const status = toNullableString(req.body.status) || 'active';
    const id = req.params.id;

    try {
        const pool = await getPool();
        
        // Check if room is already assigned to another employee (excluding current employee)
        if (assigned_room_id) {
            const [existingAssignment] = await pool.query(
                'SELECT e.name, e.employee_id FROM employees e WHERE e.assigned_room_id = ? AND e.id != ? AND e.status = "active"',
                [assigned_room_id, id]
            );
            
            if (existingAssignment.length > 0) {
                return res.status(400).json({ 
                    error: `Room is already assigned to ${existingAssignment[0].name} (${existingAssignment[0].employee_id})` 
                });
            }
        }

        await pool.query(
            'UPDATE employees SET employee_id=?, name=?, department=?, position=?, email=?, phone=?, assigned_room_id=?, status=? WHERE id=?',
            [employee_id, name, department, position, email, phone, assigned_room_id, status, id]
        );
        res.json({ message: 'Employee updated' });
    } catch (err) {
        res.status(500).json({ error: friendlySqlError(err) });
    }
});

app.delete('/api/employees/:id', requireSuperAdmin, async (req, res) => {
    const id = req.params.id;
    try {
        const pool = await getPool();
        await pool.query('DELETE FROM employees WHERE id=?', [id]);
        res.json({ message: 'Employee deleted' });
    } catch (err) {
        res.status(500).json({ error: friendlySqlError(err) });
    }
});

// User Management Routes (Super Admin only)
app.get('/api/users', requireSuperAdmin, async (req, res) => {
    try {
        const pool = await getPool();
        const [rows] = await pool.query('SELECT id, username, role, full_name, email, is_active, created_at FROM users ORDER BY created_at');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/users', requireSuperAdmin, async (req, res) => {
    const { username, password, role, full_name, email } = req.body;
    
    if (!username || !password || !role) {
        return res.status(400).json({ error: 'Username, password, and role are required' });
    }
    
    try {
        const pool = await getPool();
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const [result] = await pool.query(
            'INSERT INTO users (username, password_hash, role, full_name, email) VALUES (?, ?, ?, ?, ?)',
            [username, hashedPassword, role, full_name || username, email]
        );
        
        res.json({ id: result.insertId, message: 'User created successfully' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'Username already exists' });
        } else {
            res.status(500).json({ error: err.message });
        }
    }
});

app.put('/api/users/:id', requireSuperAdmin, async (req, res) => {
    const { role, full_name, email } = req.body;
    const id = req.params.id;
    
    try {
        const pool = await getPool();
        await pool.query(
            'UPDATE users SET role = ?, full_name = ?, email = ? WHERE id = ?',
            [role, full_name, email, id]
        );
        res.json({ message: 'User updated successfully' });
    } catch (err) {
        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
            res.status(404).json({ error: 'User not found' });
        } else {
            res.status(500).json({ error: friendlySqlError(err) });
        }
    }
});

app.delete('/api/users/:id', requireSuperAdmin, async (req, res) => {
    const userId = req.params.id;
    
    try {
        const pool = await getPool();
        
        // Prevent deleting the current user
        if (userId === req.session.user.id) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }
        
        await pool.query('DELETE FROM users WHERE id = ?', [userId]);
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Damage Reports
app.post('/api/damage-reports', requireAuth, async (req, res) => {
    console.log('Damage report request received:', req.body);
    
    const {
            item_id,
            damage_type,
            severity,
            description,
            reported_by,
            damage_date,
        estimated_repair_cost,
            repair_notes
    } = req.body;

    // Validate required fields
    if (!item_id || !damage_type || !severity || !description || !reported_by || !damage_date) {
        return res.status(400).json({ 
            error: 'Missing required fields',
            required: ['item_id', 'damage_type', 'severity', 'description', 'reported_by', 'damage_date']
        });
    }

    try {
        const pool = await getPool();
        
        // Start transaction
        await pool.query('START TRANSACTION');
        
        try {
            // Insert damage report
            const [result] = await pool.query(`
                INSERT INTO damage_reports 
                (item_id, damage_type, severity, description, reported_by, damage_status, damage_date, reported_date, estimated_repair_cost, repair_notes)
                VALUES (?, ?, ?, ?, ?, 'pending', ?, CURDATE(), ?, ?)
            `, [item_id, damage_type, severity, description, reported_by, damage_date, estimated_repair_cost || null, repair_notes || null]);

            console.log('Damage report inserted with ID:', result.insertId);

            // Update inventory item condition to 'damaged'
            await pool.query(`
                UPDATE inventory_items 
                SET \`condition\` = 'damaged'
                WHERE id = ?
            `, [item_id]);

            console.log('Inventory item condition updated to damaged');

            // Commit transaction
            await pool.query('COMMIT');
            
            res.json({ 
                id: result.insertId, 
                message: 'Damage report submitted successfully' 
            });
        } catch (error) {
            // Rollback on error
            await pool.query('ROLLBACK');
            throw error;
        }
    } catch (err) {
        console.error('Error creating damage report:', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/damage-reports', requireAuth, async (req, res) => {
    console.log('Damage reports endpoint called');
    console.log('Session user:', req.session.user);
    try {
        const pool = await getPool();
        console.log('Executing damage reports query...');
        const [rows] = await pool.query(`
            SELECT 
                dr.*,
                i.name as item_name,
                i.category,
                i.condition as item_condition,
                r.room_number,
                r.room_type,
                hu.name as housing_unit_name
            FROM damage_reports dr
            LEFT JOIN inventory_items i ON dr.item_id = i.id
            LEFT JOIN rooms r ON i.room_id = r.id
            LEFT JOIN housing_units hu ON r.housing_unit_id = hu.id
            ORDER BY dr.reported_date DESC
        `);
        console.log(`Found ${rows.length} damage reports`);
        res.json(rows);
    } catch (err) {
        console.error('Error in damage reports endpoint:', err);
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/damage-reports/:id/status', requireSuperAdmin, async (req, res) => {
    const { status, resolution_notes } = req.body;
    const id = req.params.id;

    if (!status) {
        return res.status(400).json({ error: 'Status is required' });
    }

    try {
        const pool = await getPool();
        
        // Start transaction
        await pool.query('START TRANSACTION');
        
        try {
            // Get the damage report to find the associated item
            const [damageReports] = await pool.query(
                'SELECT item_id FROM damage_reports WHERE id = ?',
                [id]
            );

            if (damageReports.length === 0) {
                await pool.query('ROLLBACK');
                return res.status(404).json({ error: 'Damage report not found' });
            }

            const itemId = damageReports[0].item_id;

            // Update damage report status
            await pool.query(
                'UPDATE damage_reports SET damage_status = ?, resolution_notes = ?, resolved_date = CASE WHEN ? = "resolved" THEN NOW() ELSE NULL END WHERE id = ?',
                [status, resolution_notes || null, status, id]
            );

            // Update inventory item condition based on status
            let newCondition = 'damaged';
            if (status === 'in_progress') {
                newCondition = 'repairing';
            } else if (status === 'resolved') {
                newCondition = 'good';
            }

            await pool.query(
                'UPDATE inventory_items SET `condition` = ? WHERE id = ?',
                [newCondition, itemId]
            );
            
            // Commit transaction
            await pool.query('COMMIT');
            
            res.json({ message: 'Damage report status updated successfully' });
        } catch (error) {
            // Rollback on error
            await pool.query('ROLLBACK');
            throw error;
        }
    } catch (err) {
        console.error('Error updating damage report status:', err);
        res.status(500).json({ error: err.message });
    }
});

// Change Password (for current user)
app.put('/api/change-password', requireAuth, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current password and new password are required' });
    }
    
    try {
        const pool = await getPool();
            const [rows] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [req.session.user.id]);
        
            if (rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            const isValidPassword = await bcrypt.compare(currentPassword, rows[0].password_hash);
        
            if (!isValidPassword) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashedNewPassword, req.session.user.id]);
        
        res.json({ message: 'Password changed successfully' });
    } catch (err) {
        console.error('Error changing password:', err);
        res.status(500).json({ error: err.message });
    }
});

// Super admin reset any user's password
app.put('/api/admin/reset-password', requireSuperAdmin, async (req, res) => {
    const { username, newPassword } = req.body;
    
    if (!username || !newPassword) {
        return res.status(400).json({ error: 'Username and new password are required' });
    }
    
    try {
        const pool = await getPool();
        
        // Start transaction
        await pool.query('START TRANSACTION');
        
        try {
            // Check if user exists
            const [userRows] = await pool.query('SELECT id, username, role FROM users WHERE username = ?', [username]);
            if (userRows.length === 0) {
                await pool.query('ROLLBACK');
                return res.status(404).json({ error: 'User not found' });
            }
            
            // Hash new password
            const hashedNewPassword = await bcrypt.hash(newPassword, 10);
            
            // Update password
            await pool.query('UPDATE users SET password_hash = ? WHERE username = ?', [hashedNewPassword, username]);
            
            // Commit transaction
            await pool.query('COMMIT');
            
            console.log(`Password reset for user ${userRows[0].username} by super admin ${req.session.user.username}`);
            res.json({ message: 'Password reset successfully', username: userRows[0].username });
        } catch (error) {
            await pool.query('ROLLBACK');
            throw error;
        }
    } catch (err) {
        console.error('Password reset failed:', err);
        res.status(500).json({ error: err.message });
    }
});

// Delete user endpoint for super admins only
app.delete('/api/admin/delete-user/:userId', requireSuperAdmin, async (req, res) => {
    const { userId } = req.params;
    
    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }
    
    try {
        const pool = await getPool();
        
        // Start transaction
        await pool.query('START TRANSACTION');
        
        try {
            // Check if target user exists
            const [userRows] = await pool.query('SELECT id, username, role FROM users WHERE id = ? OR username = ?', [userId, userId]);
            if (userRows.length === 0) {
                await pool.query('ROLLBACK');
                return res.status(404).json({ error: 'User not found' });
            }
            
            const targetUser = userRows[0];
            
            // Prevent deleting own account
            if (targetUser.id === req.session.user.id || targetUser.username === req.session.user.username) {
                await pool.query('ROLLBACK');
                return res.status(400).json({ error: 'Cannot delete your own account' });
            }
            
            // Prevent deleting the last super admin
            if (targetUser.role === 'super_admin') {
                const [superAdminRows] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = "super_admin"');
                if (superAdminRows[0].count <= 1) {
                    await pool.query('ROLLBACK');
                    return res.status(400).json({ error: 'Cannot delete the last super admin account' });
                }
            }
            
            // Delete the user
            await pool.query('DELETE FROM users WHERE id = ?', [targetUser.id]);
            
            // Commit transaction
            await pool.query('COMMIT');
            
            console.log(`User ${targetUser.username} deleted by super admin ${req.session.user.username}`);
            res.json({ message: 'User deleted successfully', username: targetUser.username });
        } catch (error) {
            await pool.query('ROLLBACK');
            throw error;
        }
    } catch (err) {
        console.error('User deletion failed:', err);
        res.status(500).json({ error: err.message });
    }
});

// Session check endpoint
app.get('/api/session-check', (req, res) => {
    if (req.session.user) {
        res.json({ 
            authenticated: true, 
            user: req.session.user 
        });
    } else {
        res.json({ authenticated: false });
    }
});

// Generate PDF Report Route
app.get('/api/generate-report', requireAuth, async (req, res) => {
    let browser = null;
    try {
        console.log('Starting PDF generation...');
        const pool = await getPool();
        const reportType = req.query.type || 'full'; // 'full' or 'damage'
        const housingUnitId = req.query.housing_unit_id || '';
        
        // Build WHERE clause for housing unit filter
        const housingFilter = housingUnitId ? 'WHERE hu.id = ?' : '';
        const housingFilterWithAnd = housingUnitId ? 'AND hu.id = ?' : '';
        const filterParams = housingUnitId ? [housingUnitId] : [];
        
        console.log(`Generating ${reportType} report for housing unit: ${housingUnitId || 'ALL'}`);
        
        let roomsData = [];
        let inventoryData = [];
        let damageData = [];
        let housingUnitName = 'All Housing Units';

        // Fetch only the data needed for the specific report type
        if (reportType === 'full' || reportType === 'rooms') {
            // Get rooms with occupant info
            console.log('Fetching rooms data...');
            const roomsQuery = `
                SELECT 
                    r.*,
                    hu.name as housing_unit_name,
                    hu.address,
                    e.name as occupant_name,
                    e.employee_id as occupant_id,
                    e.department as occupant_department,
                    e.position as occupant_position,
                    e.email as occupant_email,
                    e.phone as occupant_phone
                FROM rooms r
                LEFT JOIN housing_units hu ON r.housing_unit_id = hu.id
                LEFT JOIN employees e ON r.id = e.assigned_room_id AND e.status = 'active'
                ${housingFilter}
                ORDER BY hu.name, r.room_number
            `;
            [roomsData] = await pool.query(roomsQuery, filterParams);
            console.log(`Fetched ${roomsData.length} rooms`);
            if (roomsData.length > 0) {
                housingUnitName = roomsData[0].housing_unit_name || 'All Housing Units';
            }
        }

        if (reportType === 'full' || reportType === 'inventory') {
            // Get inventory data
            console.log('Fetching inventory data...');
            const inventoryQuery = `
                SELECT 
                    i.*,
                    r.room_number,
                    r.room_type,
                    hu.name as housing_unit_name
                FROM inventory_items i
                LEFT JOIN rooms r ON i.room_id = r.id
                LEFT JOIN housing_units hu ON r.housing_unit_id = hu.id
                ${housingFilter}
                ORDER BY hu.name, r.room_number, i.category, i.name
            `;
            [inventoryData] = await pool.query(inventoryQuery, filterParams);
            console.log(`Fetched ${inventoryData.length} inventory items`);
            if (inventoryData.length > 0 && housingUnitName === 'All Housing Units') {
                housingUnitName = inventoryData[0].housing_unit_name || 'All Housing Units';
            }
        }

        if (reportType === 'full' || reportType === 'damage') {
            // Get damage reports data
            console.log('Fetching damage reports...');
            const damageQuery = `
                SELECT 
                    dr.*,
                    i.name as item_name,
                    i.category,
                    r.room_number,
                    r.room_type,
                    hu.name as housing_unit_name
                FROM damage_reports dr
                LEFT JOIN inventory_items i ON dr.item_id = i.id
                LEFT JOIN rooms r ON i.room_id = r.id
                LEFT JOIN housing_units hu ON r.housing_unit_id = hu.id
                ${housingFilter}
                ORDER BY dr.reported_date DESC
            `;
            [damageData] = await pool.query(damageQuery, filterParams);
            console.log(`Fetched ${damageData.length} damage reports`);
            if (damageData.length > 0 && housingUnitName === 'All Housing Units') {
                housingUnitName = damageData[0].housing_unit_name || 'All Housing Units';
            }
        }

        // Generate HTML based on report type
        console.log('Generating HTML...');
        let html;
        if (reportType === 'damage') {
            // Generate styled damage report only
            html = generateDamageReportHTML(damageData, housingUnitName);
        } else if (reportType === 'rooms') {
            // Generate rooms-only report
            html = generateReportHTML(roomsData, [], [], housingUnitName);
        } else if (reportType === 'inventory') {
            // Generate inventory-only report
            html = generateReportHTML([], inventoryData, [], housingUnitName);
        } else {
            // Generate full report
            html = generateReportHTML(roomsData, inventoryData, damageData, housingUnitName);
        }
        console.log('HTML generated successfully, length:', html.length);

        // Launch Puppeteer
        console.log('Launching Puppeteer...');
            browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        console.log('Puppeteer launched');
        
        const page = await browser.newPage();
        console.log('Setting page content...');
        await page.setContent(html, { waitUntil: 'networkidle0' });
        console.log('Page content set');
        
        // Generate PDF
        console.log('Generating PDF...');
        const pdf = await page.pdf({
            format: 'A4',
            landscape: true,
            printBackground: true,
            margin: {
                top: '0.5cm',
                right: '0.5cm',
                bottom: '0.5cm',
                left: '0.5cm'
            }
        });
        console.log('PDF generated, size:', pdf.length, 'bytes');
        
            await browser.close();
        browser = null;
        console.log('Browser closed');
            
        // Send PDF
        res.contentType('application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=estate-report-${new Date().toISOString().split('T')[0]}.pdf`);
        res.send(pdf);
        console.log('PDF sent successfully');
    } catch (err) {
        console.error('=== ERROR GENERATING REPORT ===');
        console.error('Error type:', err.name);
        console.error('Error message:', err.message);
        console.error('Error stack:', err.stack);
        
            if (browser) {
            try {
                await browser.close();
                console.log('Browser closed after error');
        } catch (closeErr) {
                console.error('Error closing browser:', closeErr.message);
            }
        }
        
        res.status(500).json({ 
            error: 'Failed to generate report',
            details: err.message,
            type: err.name
        });
    }
});

// Helper function to generate HTML report in clean table format
function generateReportHTML(roomsData, inventoryData, damageData, housingUnitName = 'All Housing Units') {
    const currentDate = new Date().toLocaleDateString();
    const currentDateTime = new Date().toLocaleString();
    
    // Read and convert logo to base64
    let logoBase64 = '';
    try {
        const logoPath = path.join(__dirname, 'Asset', 'HTH logo.jpeg');
        const logoBuffer = fs.readFileSync(logoPath);
        logoBase64 = `data:image/jpeg;base64,${logoBuffer.toString('base64')}`;
    } catch (err) {
        console.error('Error reading logo:', err);
    }
    
    // Calculate statistics
    const stats = {
        totalRooms: roomsData.length,
        occupiedRooms: roomsData.filter(r => r.occupant_name).length,
        vacantRooms: roomsData.filter(r => !r.occupant_name).length,
        totalItems: inventoryData.length,
        goodItems: inventoryData.filter(i => i.condition === 'good').length,
        damagedItems: inventoryData.filter(i => i.condition === 'damaged' || i.condition === 'poor').length,
        totalDamageReports: damageData.length,
        pendingReports: damageData.filter(d => d.damage_status === 'pending').length
    };

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>HTH Estate Management Report</title>
        <style>
            @page {
                margin: 1cm;
                size: A4 portrait;
            }
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: Arial, Helvetica, sans-serif;
                font-size: 11px;
                color: #000;
                line-height: 1.4;
            }
            .logo-container {
                text-align: center;
                margin-bottom: 15px;
            }
            .logo-img {
                width: 80px;
                height: 80px;
                object-fit: contain;
            }
            .report-title {
                text-align: center;
                margin-bottom: 20px;
            }
            .report-title h1 {
                font-size: 20px;
                margin-bottom: 5px;
                text-transform: uppercase;
            }
            .report-title h2 {
                font-size: 14px;
                color: #555;
                font-weight: normal;
            }
            .report-meta {
                margin-bottom: 15px;
                font-size: 10px;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
            }
            th, td {
                border: 1px solid #333;
                padding: 8px;
                text-align: left;
            }
            th {
                background-color: #e0e0e0;
                font-weight: bold;
                text-align: center;
            }
            .section-title {
                background-color: #d0d0d0;
                font-weight: bold;
                padding: 10px;
                margin-top: 15px;
                margin-bottom: 10px;
                border: 1px solid #333;
                text-transform: uppercase;
                font-size: 12px;
            }
            .center {
                text-align: center;
            }
            .right {
                text-align: right;
            }
            .stats-table td {
                font-weight: bold;
            }
            .footer {
                text-align: center;
                margin-top: 20px;
                font-size: 9px;
                color: #666;
                border-top: 1px solid #ccc;
                padding-top: 10px;
            }
        </style>
    </head>
    <body>
        <!-- Logo -->
        ${logoBase64 ? `
        <div class="logo-container">
            <img src="${logoBase64}" class="logo-img" alt="HTH Logo" />
        </div>
        ` : ''}
        
        <!-- Report Title -->
        <div class="report-title">
            <h1>HTH Estate Management</h1>
            <h2>Comprehensive Estate Report</h2>
            ${housingUnitName !== 'All Housing Units' ? `<h3 style="color: #666; font-size: 12px; margin-top: 5px;">Housing Unit: ${housingUnitName}</h3>` : ''}
        </div>

        <!-- Report Metadata -->
        <div class="report-meta">
            <strong>Report Date:</strong> ${currentDate} | <strong>Generated:</strong> ${currentDateTime} | <strong>Scope:</strong> ${housingUnitName}
                    </div>

        <!-- Summary Statistics -->
        <div class="section-title">Executive Summary</div>
        <table class="stats-table">
            <tr>
                <th>Total Rooms</th>
                <th>Occupied</th>
                <th>Vacant</th>
                <th>Total Items</th>
                <th>Good Condition</th>
                <th>Damaged</th>
            </tr>
            <tr class="center">
                <td>${stats.totalRooms}</td>
                <td>${stats.occupiedRooms}</td>
                <td>${stats.vacantRooms}</td>
                <td>${stats.totalItems}</td>
                <td>${stats.goodItems}</td>
                <td>${stats.damagedItems}</td>
            </tr>
        </table>
        
        <!-- Rooms Table -->
        <div class="section-title">Room Occupancy Details</div>
        <table>
            <tr>
                <th>No.</th>
                <th>Housing Unit</th>
                <th>Room Number</th>
                <th>Room Type</th>
                <th>Status</th>
                <th>Occupant Name</th>
                <th>Employee ID</th>
                <th>Department</th>
            </tr>
            ${roomsData.map((room, index) => `
            <tr>
                <td class="center">${index + 1}</td>
                <td>${room.housing_unit_name || 'N/A'}</td>
                <td class="center">${room.room_number || 'N/A'}</td>
                <td>${room.room_type || 'N/A'}</td>
                <td class="center">${room.occupant_name ? 'Occupied' : 'Vacant'}</td>
                <td>${room.occupant_name || '-'}</td>
                <td class="center">${room.occupant_id || '-'}</td>
                <td>${room.occupant_department || '-'}</td>
            </tr>
            `).join('')}
        </table>
        
        <!-- Inventory Table -->
        <div class="section-title">Inventory Items</div>
        <table>
            <tr>
                <th>No.</th>
                <th>Housing Unit</th>
                <th>Room</th>
                                    <th>Item Name</th>
                                    <th>Category</th>
                                    <th>Quantity</th>
                                    <th>Condition</th>
                                </tr>
            ${inventoryData.map((item, index) => `
                                <tr>
                <td class="center">${index + 1}</td>
                <td>${item.housing_unit_name || 'N/A'}</td>
                <td class="center">${item.room_number || 'N/A'}</td>
                <td>${item.name}</td>
                                    <td>${item.category}</td>
                <td class="center">${item.quantity}</td>
                <td class="center" style="text-transform: capitalize;">${item.condition}</td>
                                </tr>
                                `).join('')}
                        </table>
        
        ${damageData.length > 0 ? `
        <!-- Damage Reports Table -->
        <div class="section-title">Damage Reports</div>
        <table>
            <tr>
                <th>No.</th>
                <th>Item Name</th>
                <th>Room</th>
                                    <th>Damage Type</th>
                                    <th>Severity</th>
                <th>Description</th>
                                    <th>Reported By</th>
                <th>Date Reported</th>
                <th>Status</th>
                                </tr>
            ${damageData.map((report, index) => `
            <tr>
                <td class="center">${index + 1}</td>
                <td>${report.item_name || 'N/A'}</td>
                <td class="center">${report.room_number || 'N/A'}</td>
                <td style="text-transform: capitalize;">${report.damage_type || 'N/A'}</td>
                <td class="center" style="text-transform: capitalize; font-weight: bold; color: ${report.severity === 'severe' ? '#dc2626' : report.severity === 'moderate' ? '#f59e0b' : '#16a34a'};">${report.severity || 'N/A'}</td>
                <td style="max-width: 200px; word-wrap: break-word;">${report.description || 'No description provided'}</td>
                <td>${report.reported_by || 'N/A'}</td>
                <td class="center">${report.reported_date ? new Date(report.reported_date).toLocaleDateString() : (report.damage_date ? new Date(report.damage_date).toLocaleDateString() : 'N/A')}</td>
                <td class="center" style="text-transform: capitalize; font-weight: bold; color: ${report.damage_status === 'resolved' ? '#16a34a' : report.damage_status === 'in_progress' ? '#f59e0b' : '#6b7280'};">${report.damage_status || 'pending'}</td>
                                </tr>
                                `).join('')}
                        </table>
        ` : ''}
        
        <!-- Footer -->
        <div class="footer">
            Generated on ${currentDateTime} | HTH Estate Management System<br/>
            This is a computer-generated report and does not require a signature
        </div>
    </body>
    </html>
    `;
}

// Generate Styled Damage Report HTML (Medical Report Style)
function generateDamageReportHTML(damageData, housingUnitName = 'All Housing Units') {
    const currentDate = new Date().toLocaleDateString();
    const currentDateTime = new Date().toLocaleString();
    
    // Read and convert logo to base64
    let logoBase64 = '';
    try {
        const logoPath = path.join(__dirname, 'Asset', 'HTH logo.jpeg');
        const logoBuffer = fs.readFileSync(logoPath);
        logoBase64 = `data:image/jpeg;base64,${logoBuffer.toString('base64')}`;
    } catch (err) {
        console.error('Error reading logo:', err);
    }

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>HTH Damage Report</title>
        <style>
            @page {
                margin: 1.5cm;
                size: A4 portrait;
            }
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: Arial, Helvetica, sans-serif;
                font-size: 11pt;
                color: #2c3e50;
                line-height: 1.6;
                padding: 20px;
            }
            .logo-container {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo-img {
                max-width: 120px;
                height: auto;
            }
            .report-header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 3px solid #3498db;
                padding-bottom: 15px;
            }
            .report-title {
                font-size: 20pt;
                font-weight: bold;
                color: #2c3e50;
                margin-bottom: 5px;
            }
            .report-subtitle {
                font-size: 11pt;
                color: #7f8c8d;
            }
            .damage-item {
                background: #fff;
                border: 1px solid #ddd;
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 25px;
                page-break-inside: avoid;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .item-header {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                gap: 15px;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 2px solid #ecf0f1;
            }
            .field-group {
                margin-bottom: 15px;
            }
            .field-label {
                font-weight: bold;
                color: #34495e;
                font-size: 10pt;
                margin-bottom: 5px;
                display: block;
            }
            .field-value {
                background: #f8f9fa;
                padding: 8px 12px;
                border-radius: 4px;
                color: #2c3e50;
                display: block;
                min-height: 30px;
            }
            .section-title {
                font-size: 12pt;
                font-weight: bold;
                color: #2c3e50;
                margin: 20px 0 12px 0;
                padding-bottom: 8px;
                border-bottom: 2px solid #3498db;
            }
            .description-box {
                background: #f8f9fa;
                padding: 15px;
                border-left: 4px solid #3498db;
                margin: 10px 0;
                min-height: 60px;
                line-height: 1.8;
            }
            .notes-box {
                background: #fff9e6;
                padding: 15px;
                border-left: 4px solid #f39c12;
                margin: 10px 0;
                min-height: 60px;
                line-height: 1.8;
            }
            .severity-badge {
                display: inline-block;
                padding: 5px 12px;
                border-radius: 4px;
                font-weight: bold;
                font-size: 10pt;
                text-transform: capitalize;
            }
            .severity-severe { background: #fee; color: #c00; }
            .severity-moderate { background: #fff3cd; color: #856404; }
            .severity-minor { background: #d4edda; color: #155724; }
            .status-badge {
                display: inline-block;
                padding: 5px 12px;
                border-radius: 4px;
                font-weight: bold;
                font-size: 10pt;
                text-transform: capitalize;
            }
            .status-pending { background: #e9ecef; color: #495057; }
            .status-in_progress { background: #fff3cd; color: #856404; }
            .status-resolved { background: #d4edda; color: #155724; }
            .footer {
                text-align: center;
                font-size: 9pt;
                color: #7f8c8d;
                margin-top: 40px;
                padding-top: 15px;
                border-top: 1px solid #ddd;
            }
        </style>
    </head>
    <body>
        ${logoBase64 ? `
        <div class="logo-container">
            <img src="${logoBase64}" alt="HTH Logo" class="logo-img">
        </div>
        ` : ''}
        
        <div class="report-header">
            <div class="report-title">Damage Reports</div>
            <div class="report-subtitle">${housingUnitName} | Generated: ${currentDate}</div>
        </div>

        ${damageData.length === 0 ? `
        <div style="text-align: center; padding: 40px; color: #7f8c8d;">
            <p style="font-size: 14pt;">No damage reports found</p>
        </div>
        ` : damageData.map((report, index) => `
        <div class="damage-item">
            <div class="item-header">
                <div class="field-group">
                    <span class="field-label">Item Name:</span>
                    <span class="field-value">${report.item_name || 'N/A'}</span>
                </div>
                <div class="field-group">
                    <span class="field-label">Room:</span>
                    <span class="field-value">${report.housing_unit_name || 'N/A'} - Room ${report.room_number || 'N/A'}</span>
                </div>
                <div class="field-group">
                    <span class="field-label">Report No:</span>
                    <span class="field-value">#${String(index + 1).padStart(3, '0')}</span>
                </div>
            </div>

            <div class="item-header">
                <div class="field-group">
                    <span class="field-label">Damage Type:</span>
                    <span class="field-value" style="text-transform: capitalize;">${report.damage_type || 'N/A'}</span>
                </div>
                <div class="field-group">
                    <span class="field-label">Severity:</span>
                    <span class="field-value">
                        <span class="severity-badge severity-${report.severity || 'minor'}">
                            ${report.severity || 'N/A'}
                        </span>
                    </span>
                </div>
                <div class="field-group">
                    <span class="field-label">Status:</span>
                    <span class="field-value">
                        <span class="status-badge status-${(report.damage_status || 'pending').replace(' ', '_')}">
                            ${(report.damage_status || 'pending').replace('_', ' ')}
                        </span>
                    </span>
                </div>
            </div>

            <div class="section-title">Description:</div>
            <div class="description-box">
                ${report.description || 'No description provided.'}
            </div>

            <div class="item-header" style="margin-top: 20px;">
                <div class="field-group">
                    <span class="field-label">Reported By:</span>
                    <span class="field-value">${report.reported_by || 'N/A'}</span>
                </div>
                <div class="field-group">
                    <span class="field-label">Date Reported:</span>
                    <span class="field-value">${report.reported_date ? new Date(report.reported_date).toLocaleDateString() : (report.damage_date ? new Date(report.damage_date).toLocaleDateString() : 'N/A')}</span>
                </div>
                <div class="field-group">
                    <span class="field-label">Estimated Cost:</span>
                    <span class="field-value">${report.estimated_repair_cost ? '$' + parseFloat(report.estimated_repair_cost).toFixed(2) : 'Not estimated'}</span>
                </div>
            </div>

            ${report.repair_notes || report.resolution_notes ? `
            <div class="section-title">Repair Notes:</div>
            <div class="notes-box">
                ${report.repair_notes || report.resolution_notes || 'No repair notes.'}
            </div>
            ` : ''}
        </div>
        `).join('')}

        <div class="footer">
            Generated on ${currentDateTime} | HTH Estate Management System<br/>
            This is a computer-generated report and does not require a signature
        </div>
    </body>
    </html>
    `;
}

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

