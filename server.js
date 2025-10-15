const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Database setup
const db = new sqlite3.Database('estate_management.db');

// Initialize database tables
db.serialize(() => {
    // Housing types table
    db.run(`CREATE TABLE IF NOT EXISTS housing_types (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Housing units table
    db.run(`CREATE TABLE IF NOT EXISTS housing_units (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type_id TEXT NOT NULL,
        address TEXT NOT NULL,
        capacity INTEGER DEFAULT 1,
        status TEXT DEFAULT 'available',
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (type_id) REFERENCES housing_types (id)
    )`);

    // Rooms table
    db.run(`CREATE TABLE IF NOT EXISTS rooms (
        id TEXT PRIMARY KEY,
        housing_unit_id TEXT NOT NULL,
        room_number TEXT NOT NULL,
        room_type TEXT NOT NULL,
        capacity INTEGER DEFAULT 1,
        status TEXT DEFAULT 'available',
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (housing_unit_id) REFERENCES housing_units (id)
    )`);

    // Inventory items table
    db.run(`CREATE TABLE IF NOT EXISTS inventory_items (
        id TEXT PRIMARY KEY,
        room_id TEXT NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        quantity INTEGER DEFAULT 1,
        condition TEXT DEFAULT 'good',
        description TEXT,
        purchase_date DATE,
        warranty_expiry DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES rooms (id)
    )`);

    // Employees table
    db.run(`CREATE TABLE IF NOT EXISTS employees (
        id TEXT PRIMARY KEY,
        employee_id TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        department TEXT NOT NULL,
        position TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        assigned_room_id TEXT,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (assigned_room_id) REFERENCES rooms (id)
    )`);

    // Insert default housing types
    const defaultHousingTypes = [
        { id: 'hth-bangalore', name: 'HTH Bangalore', description: 'Hospital staff housing in Bangalore' },
        { id: 'rental-apartment', name: 'Rental Apartment', description: 'Rental apartments for hospital employees' },
        { id: 'housement-flat', name: 'Housement Flat', description: 'Housement flats for hospital staff' }
    ];

    defaultHousingTypes.forEach(type => {
        db.run(`INSERT OR IGNORE INTO housing_types (id, name, description) VALUES (?, ?, ?)`,
            [type.id, type.name, type.description]);
    });
});

// API Routes

// Housing Types
app.get('/api/housing-types', (req, res) => {
    db.all('SELECT * FROM housing_types ORDER BY name', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/api/housing-types', (req, res) => {
    const { name, description } = req.body;
    const id = uuidv4();
    
    db.run('INSERT INTO housing_types (id, name, description) VALUES (?, ?, ?)',
        [id, name, description], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id, name, description });
        });
});

// Housing Units
app.get('/api/housing-units', (req, res) => {
    const query = `
        SELECT hu.*, ht.name as type_name 
        FROM housing_units hu 
        JOIN housing_types ht ON hu.type_id = ht.id 
        ORDER BY hu.name
    `;
    
    db.all(query, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/api/housing-units', (req, res) => {
    const { name, type_id, address, capacity, status, description } = req.body;
    const id = uuidv4();
    
    db.run(`INSERT INTO housing_units (id, name, type_id, address, capacity, status, description) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, name, type_id, address, capacity || 1, status || 'available', description], 
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id, name, type_id, address, capacity, status, description });
        });
});

app.put('/api/housing-units/:id', (req, res) => {
    const { name, type_id, address, capacity, status, description } = req.body;
    const id = req.params.id;
    
    db.run(`UPDATE housing_units 
            SET name = ?, type_id = ?, address = ?, capacity = ?, status = ?, description = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
        [name, type_id, address, capacity, status, description, id], 
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Housing unit updated successfully' });
        });
});

app.delete('/api/housing-units/:id', (req, res) => {
    const id = req.params.id;
    
    db.run('DELETE FROM housing_units WHERE id = ?', [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Housing unit deleted successfully' });
    });
});

// Rooms
app.get('/api/rooms', (req, res) => {
    const housingUnitId = req.query.housing_unit_id;
    let query = `
        SELECT r.*, hu.name as housing_unit_name, hu.address as housing_address
        FROM rooms r 
        JOIN housing_units hu ON r.housing_unit_id = hu.id 
    `;
    
    if (housingUnitId) {
        query += ' WHERE r.housing_unit_id = ?';
        db.all(query, [housingUnitId], (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(rows);
        });
    } else {
        query += ' ORDER BY r.room_number';
        db.all(query, (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(rows);
        });
    }
});

app.post('/api/rooms', (req, res) => {
    const { housing_unit_id, room_number, room_type, capacity, status, description } = req.body;
    const id = uuidv4();
    
    db.run(`INSERT INTO rooms (id, housing_unit_id, room_number, room_type, capacity, status, description) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, housing_unit_id, room_number, room_type, capacity || 1, status || 'available', description], 
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id, housing_unit_id, room_number, room_type, capacity, status, description });
        });
});

app.put('/api/rooms/:id', (req, res) => {
    const { room_number, room_type, capacity, status, description } = req.body;
    const id = req.params.id;
    
    db.run(`UPDATE rooms 
            SET room_number = ?, room_type = ?, capacity = ?, status = ?, description = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
        [room_number, room_type, capacity, status, description, id], 
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Room updated successfully' });
        });
});

app.delete('/api/rooms/:id', (req, res) => {
    const id = req.params.id;
    
    db.run('DELETE FROM rooms WHERE id = ?', [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Room deleted successfully' });
    });
});

// Inventory Items
app.get('/api/inventory', (req, res) => {
    const roomId = req.query.room_id;
    let query = `
        SELECT i.*, r.room_number, r.room_type, hu.name as housing_unit_name
        FROM inventory_items i 
        JOIN rooms r ON i.room_id = r.id 
        JOIN housing_units hu ON r.housing_unit_id = hu.id
    `;
    
    if (roomId) {
        query += ' WHERE i.room_id = ?';
        db.all(query, [roomId], (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(rows);
        });
    } else {
        query += ' ORDER BY i.name';
        db.all(query, (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(rows);
        });
    }
});

app.post('/api/inventory', (req, res) => {
    const { room_id, name, category, quantity, condition, description, purchase_date, warranty_expiry } = req.body;
    const id = uuidv4();
    
    db.run(`INSERT INTO inventory_items (id, room_id, name, category, quantity, condition, description, purchase_date, warranty_expiry) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, room_id, name, category, quantity || 1, condition || 'good', description, purchase_date, warranty_expiry], 
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id, room_id, name, category, quantity, condition, description, purchase_date, warranty_expiry });
        });
});

app.put('/api/inventory/:id', (req, res) => {
    const { name, category, quantity, condition, description, purchase_date, warranty_expiry } = req.body;
    const id = req.params.id;
    
    db.run(`UPDATE inventory_items 
            SET name = ?, category = ?, quantity = ?, condition = ?, description = ?, purchase_date = ?, warranty_expiry = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
        [name, category, quantity, condition, description, purchase_date, warranty_expiry, id], 
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Inventory item updated successfully' });
        });
});

app.delete('/api/inventory/:id', (req, res) => {
    const id = req.params.id;
    
    db.run('DELETE FROM inventory_items WHERE id = ?', [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Inventory item deleted successfully' });
    });
});

// Employees
app.get('/api/employees', (req, res) => {
    const query = `
        SELECT e.*, r.room_number, r.room_type, hu.name as housing_unit_name
        FROM employees e 
        LEFT JOIN rooms r ON e.assigned_room_id = r.id 
        LEFT JOIN housing_units hu ON r.housing_unit_id = hu.id
        ORDER BY e.name
    `;
    
    db.all(query, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/api/employees', (req, res) => {
    const { employee_id, name, department, position, email, phone, assigned_room_id, status } = req.body;
    const id = uuidv4();
    
    db.run(`INSERT INTO employees (id, employee_id, name, department, position, email, phone, assigned_room_id, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, employee_id, name, department, position, email, phone, assigned_room_id, status || 'active'], 
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id, employee_id, name, department, position, email, phone, assigned_room_id, status });
        });
});

app.put('/api/employees/:id', (req, res) => {
    const { employee_id, name, department, position, email, phone, assigned_room_id, status } = req.body;
    const id = req.params.id;
    
    db.run(`UPDATE employees 
            SET employee_id = ?, name = ?, department = ?, position = ?, email = ?, phone = ?, assigned_room_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
        [employee_id, name, department, position, email, phone, assigned_room_id, status, id], 
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Employee updated successfully' });
        });
});

app.delete('/api/employees/:id', (req, res) => {
    const id = req.params.id;
    
    db.run('DELETE FROM employees WHERE id = ?', [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Employee deleted successfully' });
    });
});

// Dashboard Statistics
app.get('/api/dashboard/stats', (req, res) => {
    const stats = {};
    
    // Get total housing units
    db.get('SELECT COUNT(*) as count FROM housing_units', (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        stats.totalHousing = row.count;
        
        // Get total rooms
        db.get('SELECT COUNT(*) as count FROM rooms', (err, row) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            stats.totalRooms = row.count;
            
            // Get total inventory items
            db.get('SELECT COUNT(*) as count FROM inventory_items', (err, row) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                stats.totalItems = row.count;
                
                // Get total employees
                db.get('SELECT COUNT(*) as count FROM employees', (err, row) => {
                    if (err) {
                        res.status(500).json({ error: err.message });
                        return;
                    }
                    stats.totalEmployees = row.count;
                    
                    res.json(stats);
                });
            });
        });
    });
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`HTH Estate Management Server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to access the application`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Database connection closed.');
        process.exit(0);
    });
});
