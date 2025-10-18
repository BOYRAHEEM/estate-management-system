const express = require('express');
const cors = require('cors');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { getPool } = require('./db');

// Helpers
function toNullableString(value) {
    if (value === undefined || value === null) return null;
    const s = String(value).trim();
    return s.length === 0 ? null : s;
}
function toIntOrDefault(value, def) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.trunc(n) : def;
}
function friendlySqlError(err) {
    if (!err || !err.number) return err?.message || 'Unknown error';
    // Unique constraint
    if (err.number === 2627 || err.number === 2601) return 'Duplicate value violates a unique constraint';
    // FK errors
    if (err.number === 547) return 'Related record not found (foreign key constraint)';
    return err.message;
}

const app = express();
const PORT = process.env.PORT || 3000;

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'hth-estate-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true if using HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Middleware
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());
app.use(express.static('.'));

// Database schema initialization (MySQL)
async function initSchema() {
    const pool = await getPool();
    // MySQL DDL (InnoDB, utf8mb4). Uses VARCHAR and DATETIME.
    const ddlStatements = [
        `CREATE TABLE IF NOT EXISTS housing_types (
            id VARCHAR(50) NOT NULL PRIMARY KEY,
            name VARCHAR(255) NOT NULL UNIQUE,
            description TEXT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
        `CREATE TABLE IF NOT EXISTS housing_units (
            id VARCHAR(50) NOT NULL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            type_id VARCHAR(50) NOT NULL,
            address VARCHAR(500) NOT NULL,
            capacity INT DEFAULT 1,
            status VARCHAR(50) DEFAULT 'available',
            description TEXT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT FK_housing_units_type FOREIGN KEY (type_id) REFERENCES housing_types (id) ON DELETE RESTRICT ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
        `CREATE TABLE IF NOT EXISTS rooms (
            id VARCHAR(50) NOT NULL PRIMARY KEY,
            housing_unit_id VARCHAR(50) NOT NULL,
            room_number VARCHAR(50) NOT NULL,
            room_type VARCHAR(50) NOT NULL,
            capacity INT DEFAULT 1,
            status VARCHAR(50) DEFAULT 'available',
            description TEXT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT FK_rooms_unit FOREIGN KEY (housing_unit_id) REFERENCES housing_units (id) ON DELETE CASCADE ON UPDATE CASCADE,
            INDEX idx_rooms_housing_unit_id (housing_unit_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
        `CREATE TABLE IF NOT EXISTS inventory_items (
            id VARCHAR(50) NOT NULL PRIMARY KEY,
            room_id VARCHAR(50) NOT NULL,
            name VARCHAR(255) NOT NULL,
            category VARCHAR(100) NOT NULL,
            quantity INT DEFAULT 1,
            ` + "`condition`" + ` VARCHAR(50) DEFAULT 'good',
            description TEXT NULL,
            purchase_date DATE NULL,
            warranty_expiry DATE NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT FK_inventory_room FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE CASCADE ON UPDATE CASCADE,
            INDEX idx_inventory_room_id (room_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
        `CREATE TABLE IF NOT EXISTS employees (
            id VARCHAR(50) NOT NULL PRIMARY KEY,
            employee_id VARCHAR(100) NOT NULL UNIQUE,
            name VARCHAR(255) NOT NULL,
            department VARCHAR(255) NOT NULL,
            position VARCHAR(255) NOT NULL,
            email VARCHAR(255) NULL,
            phone VARCHAR(50) NULL,
            assigned_room_id VARCHAR(50) NULL,
            status VARCHAR(50) DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT FK_employees_room FOREIGN KEY (assigned_room_id) REFERENCES rooms (id) ON DELETE SET NULL ON UPDATE CASCADE,
            INDEX idx_employees_assigned_room_id (assigned_room_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
        `CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(50) NOT NULL PRIMARY KEY,
            username VARCHAR(100) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            role ENUM('admin', 'super_admin') NOT NULL DEFAULT 'admin',
            full_name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NULL,
            is_active BOOLEAN DEFAULT TRUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_users_username (username),
            INDEX idx_users_role (role)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
    ];
    for (const stmt of ddlStatements) {
        await pool.query(stmt);
    }
    // Seed default housing types
    await pool.query("INSERT IGNORE INTO housing_types (id, name, description) VALUES ('hth-bangalore','HTH Bangalore','Hospital staff housing in Bangalore')");
    await pool.query("INSERT IGNORE INTO housing_types (id, name, description) VALUES ('rental-apartment','Rental Apartment','Rental apartments for hospital employees')");
    await pool.query("INSERT IGNORE INTO housing_types (id, name, description) VALUES ('housement-flat','Housement Flat','Housement flats for hospital staff')");
    
    // Seed default admin users
    const defaultPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    await pool.query(`INSERT IGNORE INTO users (id, username, password_hash, role, full_name, email) 
                      VALUES ('admin-user-id', 'admin', ?, 'admin', 'System Admin', 'admin@hth.com')`, [hashedPassword]);
    
    await pool.query(`INSERT IGNORE INTO users (id, username, password_hash, role, full_name, email) 
                      VALUES ('super-admin-user-id', 'superadmin', ?, 'super_admin', 'Super Admin', 'superadmin@hth.com')`, [hashedPassword]);
}

// Authentication middleware
function requireAuth(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    next();
}

function requireSuperAdmin(req, res, next) {
    if (!req.session.user || req.session.user.role !== 'super_admin') {
        return res.status(403).json({ error: 'Super Admin access required' });
    }
    next();
}

function requireAdminOrSuperAdmin(req, res, next) {
    if (!req.session.user || (req.session.user.role !== 'admin' && req.session.user.role !== 'super_admin')) {
        return res.status(403).json({ error: 'Admin or Super Admin access required' });
    }
    next();
}

// API Routes

// Authentication Routes
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    
    try {
        const pool = await getPool();
        const [rows] = await pool.query(
            'SELECT id, username, password_hash, role, full_name, email FROM users WHERE username = ? AND is_active = TRUE',
            [username]
        );
        
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const user = rows[0];
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        
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
    } catch (err) {
        console.error('Login failed:', err);
        res.status(500).json({ error: 'Login failed' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.json({ message: 'Logout successful' });
    });
});

app.get('/api/auth/me', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    
    res.json({ user: req.session.user });
});

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

app.post('/api/housing-types', requireSuperAdmin, async (req, res) => {
    const name = toNullableString(req.body.name);
    const description = toNullableString(req.body.description);
    const id = uuidv4();
    try {
        const pool = await getPool();
        await pool.query('INSERT INTO housing_types (id, name, description) VALUES (?, ?, ?)', [id, name, description]);
        res.json({ id, name, description });
    } catch (err) {
        console.error('Create housing-type failed:', err, req.body);
        res.status(500).json({ error: friendlySqlError(err) });
    }
});

// Housing Units
app.get('/api/housing-units', requireAuth, async (req, res) => {
    const query = `
        SELECT hu.*, ht.name as type_name 
        FROM housing_units hu 
        JOIN housing_types ht ON hu.type_id = ht.id 
        ORDER BY hu.name`;
    try {
        const pool = await getPool();
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (err) {
            res.status(500).json({ error: err.message });
    }
});

app.post('/api/housing-units', requireSuperAdmin, async (req, res) => {
    const name = toNullableString(req.body.name);
    const type_id = toNullableString(req.body.type_id);
    const address = toNullableString(req.body.address);
    const capacity = toIntOrDefault(req.body.capacity, 1);
    const status = toNullableString(req.body.status) || 'available';
    const description = toNullableString(req.body.description);
    const id = uuidv4();
    try {
        const pool = await getPool();
        await pool.query(`INSERT INTO housing_units (id, name, type_id, address, capacity, status, description) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)`, [id, name, type_id, address, capacity, status, description]);
        res.json({ id, name, type_id, address, capacity, status, description });
    } catch (err) {
        console.error('Create housing-unit failed:', err, req.body);
        res.status(500).json({ error: friendlySqlError(err) });
    }
});

app.put('/api/housing-units/:id', requireSuperAdmin, async (req, res) => {
    const name = toNullableString(req.body.name);
    const type_id = toNullableString(req.body.type_id);
    const address = toNullableString(req.body.address);
    const capacity = toIntOrDefault(req.body.capacity, 1);
    const status = toNullableString(req.body.status) || 'available';
    const description = toNullableString(req.body.description);
    const id = req.params.id;
    try {
        const pool = await getPool();
        await pool.query(`UPDATE housing_units 
                    SET name=?, type_id=?, address=?, capacity=?, status=?, description=?
                    WHERE id=?`, [name, type_id, address, capacity, status, description, id]);
        res.json({ message: 'Housing unit updated successfully' });
    } catch (err) {
        console.error('Update housing-unit failed:', err, req.body);
        res.status(500).json({ error: friendlySqlError(err) });
    }
});

app.delete('/api/housing-units/:id', requireSuperAdmin, async (req, res) => {
    const id = req.params.id;
    try {
        const pool = await getPool();
        await pool.query('DELETE FROM housing_units WHERE id = ?', [id]);
        res.json({ message: 'Housing unit deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Rooms
app.get('/api/rooms', requireAuth, async (req, res) => {
    const housingUnitId = req.query.housing_unit_id;
    let query = `
        SELECT r.*, hu.name as housing_unit_name, hu.address as housing_address
        FROM rooms r 
        JOIN housing_units hu ON r.housing_unit_id = hu.id`;
    try {
        const pool = await getPool();
        if (housingUnitId) {
            query += ' WHERE r.housing_unit_id = ?';
            const [rows] = await pool.query(query, [housingUnitId]);
            res.json(rows);
        } else {
            query += ' ORDER BY r.room_number';
            const [rows] = await pool.query(query);
            res.json(rows);
        }
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
    const id = uuidv4();
    try {
        const pool = await getPool();
        await pool.query(`INSERT INTO rooms (id, housing_unit_id, room_number, room_type, capacity, status, description)
                    VALUES (?, ?, ?, ?, ?, ?, ?)`, [id, housing_unit_id, room_number, room_type, capacity, status, description]);
        res.json({ id, housing_unit_id, room_number, room_type, capacity, status, description });
    } catch (err) {
        console.error('Create room failed:', err, req.body);
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
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Inventory Items
app.get('/api/inventory', requireAuth, async (req, res) => {
    const roomId = req.query.room_id;
    let query = `
        SELECT i.*, r.room_number, r.room_type, hu.name as housing_unit_name
        FROM inventory_items i 
        JOIN rooms r ON i.room_id = r.id 
        JOIN housing_units hu ON r.housing_unit_id = hu.id`;
    try {
        const pool = await getPool();
        if (roomId) {
            query += ' WHERE i.room_id = ?';
            const [rows] = await pool.query(query, [roomId]);
            res.json(rows);
        } else {
            query += ' ORDER BY i.name';
            const [rows] = await pool.query(query);
            res.json(rows);
        }
    } catch (err) {
                res.status(500).json({ error: err.message });
    }
});

app.post('/api/inventory', requireAdminOrSuperAdmin, async (req, res) => {
    const room_id = toNullableString(req.body.room_id);
    const name = toNullableString(req.body.name);
    const category = toNullableString(req.body.category);
    const quantity = toIntOrDefault(req.body.quantity, 1);
    const condition = toNullableString(req.body.condition) || 'good';
    const description = toNullableString(req.body.description);
    const purchase_date = toNullableString(req.body.purchase_date);
    const warranty_expiry = toNullableString(req.body.warranty_expiry);
    const id = uuidv4();
    try {
        const pool = await getPool();
        await pool.query(`INSERT INTO inventory_items (id, room_id, name, category, quantity, \`condition\`, description, purchase_date, warranty_expiry)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [id, room_id, name, category, quantity, condition, description, purchase_date, warranty_expiry]);
        res.json({ id, room_id, name, category, quantity, condition, description, purchase_date, warranty_expiry });
    } catch (err) {
        console.error('Create inventory failed:', err, req.body);
        res.status(500).json({ error: friendlySqlError(err) });
    }
});

app.put('/api/inventory/:id', requireSuperAdmin, async (req, res) => {
    const name = toNullableString(req.body.name);
    const category = toNullableString(req.body.category);
    const quantity = toIntOrDefault(req.body.quantity, 1);
    const condition = toNullableString(req.body.condition);
    const description = toNullableString(req.body.description);
    const purchase_date = toNullableString(req.body.purchase_date);
    const warranty_expiry = toNullableString(req.body.warranty_expiry);
    const id = req.params.id;
    try {
        const pool = await getPool();
        await pool.query(`UPDATE inventory_items 
                    SET name=?, category=?, quantity=?, \`condition\`=?, description=?, purchase_date=?, warranty_expiry=?
                    WHERE id=?`, [name, category, quantity, condition, description, purchase_date, warranty_expiry, id]);
        res.json({ message: 'Inventory item updated successfully' });
    } catch (err) {
        console.error('Update inventory failed:', err, req.body);
        res.status(500).json({ error: friendlySqlError(err) });
    }
});

app.delete('/api/inventory/:id', requireSuperAdmin, async (req, res) => {
    const id = req.params.id;
    try {
        const pool = await getPool();
        await pool.query('DELETE FROM inventory_items WHERE id=?', [id]);
        res.json({ message: 'Inventory item deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Employees
app.get('/api/employees', requireAuth, async (req, res) => {
    const query = `
        SELECT e.*, r.room_number, r.room_type, hu.name as housing_unit_name
        FROM employees e 
        LEFT JOIN rooms r ON e.assigned_room_id = r.id 
        LEFT JOIN housing_units hu ON r.housing_unit_id = hu.id
        ORDER BY e.name`;
    try {
        const pool = await getPool();
        const [rows] = await pool.query(query);
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
    const id = uuidv4();
    try {
        const pool = await getPool();
        await pool.query(`INSERT INTO employees (id, employee_id, name, department, position, email, phone, assigned_room_id, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [id, employee_id, name, department, position, email, phone, assigned_room_id, status]);
        res.json({ id, employee_id, name, department, position, email, phone, assigned_room_id, status });
    } catch (err) {
        console.error('Create employee failed:', err, req.body);
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
    const status = toNullableString(req.body.status);
    const id = req.params.id;
    try {
        const pool = await getPool();
        await pool.query(`UPDATE employees 
                    SET employee_id=?, name=?, department=?, position=?, email=?, phone=?, assigned_room_id=?, status=?
                    WHERE id=?`, [employee_id, name, department, position, email, phone, assigned_room_id, status, id]);
        res.json({ message: 'Employee updated successfully' });
    } catch (err) {
        console.error('Update employee failed:', err, req.body);
        res.status(500).json({ error: friendlySqlError(err) });
    }
});

app.delete('/api/employees/:id', requireSuperAdmin, async (req, res) => {
    const id = req.params.id;
    try {
        const pool = await getPool();
        await pool.query('DELETE FROM employees WHERE id=?', [id]);
        res.json({ message: 'Employee deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Dashboard Statistics
app.get('/api/dashboard/stats', requireAuth, async (req, res) => {
    try {
        const pool = await getPool();
        const [[h],[r],[i],[e]] = await Promise.all([
            pool.query('SELECT COUNT(1) AS count FROM housing_units'),
            pool.query('SELECT COUNT(1) AS count FROM rooms'),
            pool.query('SELECT COUNT(1) AS count FROM inventory_items'),
            pool.query('SELECT COUNT(1) AS count FROM employees')
        ]);
        res.json({
            totalHousing: h[0].count,
            totalRooms: r[0].count,
            totalItems: i[0].count,
            totalEmployees: e[0].count
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
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
    
    if (!username || !password || !role || !full_name) {
        return res.status(400).json({ error: 'Username, password, role, and full name are required' });
    }
    
    if (!['admin', 'super_admin'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role. Must be admin or super_admin' });
    }
    
    try {
        const pool = await getPool();
        const hashedPassword = await bcrypt.hash(password, 10);
        const id = uuidv4();
        
        await pool.query(
            'INSERT INTO users (id, username, password_hash, role, full_name, email) VALUES (?, ?, ?, ?, ?, ?)',
            [id, username, hashedPassword, role, full_name, email]
        );
        
        res.json({ message: 'User created successfully', id });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'Username already exists' });
        } else {
            console.error('Create user failed:', err);
            res.status(500).json({ error: friendlySqlError(err) });
        }
    }
});

app.put('/api/users/:id', requireSuperAdmin, async (req, res) => {
    const { username, role, full_name, email, is_active } = req.body;
    const userId = req.params.id;
    
    try {
        const pool = await getPool();
        
        // Check if updating password
        let updateFields = ['role = ?', 'full_name = ?', 'email = ?', 'is_active = ?'];
        let updateValues = [role, full_name, email, is_active];
        
        if (username) {
            updateFields.push('username = ?');
            updateValues.push(username);
        }
        
        updateValues.push(userId);
        
        await pool.query(
            `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );
        
        res.json({ message: 'User updated successfully' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'Username already exists' });
        } else {
            console.error('Update user failed:', err);
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

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
initSchema().then(() => {
app.listen(PORT, () => {
    console.log(`HTH Estate Management Server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to access the application`);
    });
}).catch(err => {
    console.error('Failed to initialize database schema:', err);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nShutting down server...');
    try {
        const pool = await getPool();
        await pool.end();
        console.log('MySQL pool ended.');
    } catch (e) {
        console.error('Error ending MySQL pool:', e.message);
    } finally {
        process.exit(0);
    }
});
