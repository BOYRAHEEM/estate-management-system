const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { sql, getPool } = require('./db');

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

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Database schema initialization (SQL Server)
async function initSchema() {
    const pool = await getPool();
    // Create tables if they do not exist
    const schemaSql = `
IF OBJECT_ID('dbo.housing_types','U') IS NULL
BEGIN
    CREATE TABLE dbo.housing_types (
        id NVARCHAR(50) NOT NULL PRIMARY KEY,
        name NVARCHAR(255) NOT NULL UNIQUE,
        description NVARCHAR(MAX) NULL,
        created_at DATETIME2 DEFAULT SYSUTCDATETIME()
    );
END;

IF OBJECT_ID('dbo.housing_units','U') IS NULL
BEGIN
    CREATE TABLE dbo.housing_units (
        id NVARCHAR(50) NOT NULL PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        type_id NVARCHAR(50) NOT NULL,
        address NVARCHAR(500) NOT NULL,
        capacity INT DEFAULT 1,
        status NVARCHAR(50) DEFAULT 'available',
        description NVARCHAR(MAX) NULL,
        created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_housing_units_type FOREIGN KEY (type_id) REFERENCES dbo.housing_types (id)
    );
END;

IF OBJECT_ID('dbo.rooms','U') IS NULL
BEGIN
    CREATE TABLE dbo.rooms (
        id NVARCHAR(50) NOT NULL PRIMARY KEY,
        housing_unit_id NVARCHAR(50) NOT NULL,
        room_number NVARCHAR(50) NOT NULL,
        room_type NVARCHAR(50) NOT NULL,
        capacity INT DEFAULT 1,
        status NVARCHAR(50) DEFAULT 'available',
        description NVARCHAR(MAX) NULL,
        created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_rooms_unit FOREIGN KEY (housing_unit_id) REFERENCES dbo.housing_units (id)
    );
END;

IF OBJECT_ID('dbo.inventory_items','U') IS NULL
BEGIN
    CREATE TABLE dbo.inventory_items (
        id NVARCHAR(50) NOT NULL PRIMARY KEY,
        room_id NVARCHAR(50) NOT NULL,
        name NVARCHAR(255) NOT NULL,
        category NVARCHAR(100) NOT NULL,
        quantity INT DEFAULT 1,
        condition NVARCHAR(50) DEFAULT 'good',
        description NVARCHAR(MAX) NULL,
        purchase_date DATE NULL,
        warranty_expiry DATE NULL,
        created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_inventory_room FOREIGN KEY (room_id) REFERENCES dbo.rooms (id)
    );
END;

IF OBJECT_ID('dbo.employees','U') IS NULL
BEGIN
    CREATE TABLE dbo.employees (
        id NVARCHAR(50) NOT NULL PRIMARY KEY,
        employee_id NVARCHAR(100) NOT NULL UNIQUE,
        name NVARCHAR(255) NOT NULL,
        department NVARCHAR(255) NOT NULL,
        position NVARCHAR(255) NOT NULL,
        email NVARCHAR(255) NULL,
        phone NVARCHAR(50) NULL,
        assigned_room_id NVARCHAR(50) NULL,
        status NVARCHAR(50) DEFAULT 'active',
        created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_employees_room FOREIGN KEY (assigned_room_id) REFERENCES dbo.rooms (id)
    );
END;

-- Default housing types
IF NOT EXISTS (SELECT 1 FROM dbo.housing_types WHERE id = 'hth-bangalore')
    INSERT INTO dbo.housing_types (id, name, description) VALUES ('hth-bangalore','HTH Bangalore','Hospital staff housing in Bangalore');
IF NOT EXISTS (SELECT 1 FROM dbo.housing_types WHERE id = 'rental-apartment')
    INSERT INTO dbo.housing_types (id, name, description) VALUES ('rental-apartment','Rental Apartment','Rental apartments for hospital employees');
IF NOT EXISTS (SELECT 1 FROM dbo.housing_types WHERE id = 'housement-flat')
    INSERT INTO dbo.housing_types (id, name, description) VALUES ('housement-flat','Housement Flat','Housement flats for hospital staff');
`;
    await pool.request().batch(schemaSql);
}

// API Routes

// Housing Types
app.get('/api/housing-types', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query('SELECT * FROM dbo.housing_types ORDER BY name');
        res.json(result.recordset);
    } catch (err) {
            res.status(500).json({ error: err.message });
        }
});

app.post('/api/housing-types', async (req, res) => {
    const name = toNullableString(req.body.name);
    const description = toNullableString(req.body.description);
    const id = uuidv4();
    try {
        const pool = await getPool();
        await pool.request()
            .input('id', sql.NVarChar(50), id)
            .input('name', sql.NVarChar(255), name)
            .input('description', sql.NVarChar(sql.MAX), description)
            .query('INSERT INTO dbo.housing_types (id, name, description) VALUES (@id, @name, @description)');
        res.json({ id, name, description });
    } catch (err) {
        console.error('Create housing-type failed:', err, req.body);
        res.status(500).json({ error: friendlySqlError(err) });
    }
});

// Housing Units
app.get('/api/housing-units', async (req, res) => {
    const query = `
        SELECT hu.*, ht.name as type_name 
        FROM dbo.housing_units hu 
        JOIN dbo.housing_types ht ON hu.type_id = ht.id 
        ORDER BY hu.name`;
    try {
        const pool = await getPool();
        const result = await pool.request().query(query);
        res.json(result.recordset);
    } catch (err) {
            res.status(500).json({ error: err.message });
    }
});

app.post('/api/housing-units', async (req, res) => {
    const name = toNullableString(req.body.name);
    const type_id = toNullableString(req.body.type_id);
    const address = toNullableString(req.body.address);
    const capacity = toIntOrDefault(req.body.capacity, 1);
    const status = toNullableString(req.body.status) || 'available';
    const description = toNullableString(req.body.description);
    const id = uuidv4();
    try {
        const pool = await getPool();
        await pool.request()
            .input('id', sql.NVarChar(50), id)
            .input('name', sql.NVarChar(255), name)
            .input('type_id', sql.NVarChar(50), type_id)
            .input('address', sql.NVarChar(500), address)
            .input('capacity', sql.Int, capacity)
            .input('status', sql.NVarChar(50), status)
            .input('description', sql.NVarChar(sql.MAX), description)
            .query(`INSERT INTO dbo.housing_units (id, name, type_id, address, capacity, status, description) 
                    VALUES (@id, @name, @type_id, @address, @capacity, @status, @description)`);
        res.json({ id, name, type_id, address, capacity, status, description });
    } catch (err) {
        console.error('Create housing-unit failed:', err, req.body);
        res.status(500).json({ error: friendlySqlError(err) });
    }
});

app.put('/api/housing-units/:id', async (req, res) => {
    const name = toNullableString(req.body.name);
    const type_id = toNullableString(req.body.type_id);
    const address = toNullableString(req.body.address);
    const capacity = toIntOrDefault(req.body.capacity, 1);
    const status = toNullableString(req.body.status) || 'available';
    const description = toNullableString(req.body.description);
    const id = req.params.id;
    try {
        const pool = await getPool();
        await pool.request()
            .input('id', sql.NVarChar(50), id)
            .input('name', sql.NVarChar(255), name)
            .input('type_id', sql.NVarChar(50), type_id)
            .input('address', sql.NVarChar(500), address)
            .input('capacity', sql.Int, capacity)
            .input('status', sql.NVarChar(50), status)
            .input('description', sql.NVarChar(sql.MAX), description)
            .query(`UPDATE dbo.housing_units 
                    SET name=@name, type_id=@type_id, address=@address, capacity=@capacity, status=@status, description=@description, updated_at=SYSUTCDATETIME()
                    WHERE id=@id`);
        res.json({ message: 'Housing unit updated successfully' });
    } catch (err) {
        console.error('Update housing-unit failed:', err, req.body);
        res.status(500).json({ error: friendlySqlError(err) });
    }
});

app.delete('/api/housing-units/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const pool = await getPool();
        await pool.request().input('id', sql.NVarChar(50), id).query('DELETE FROM dbo.housing_units WHERE id = @id');
        res.json({ message: 'Housing unit deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Rooms
app.get('/api/rooms', async (req, res) => {
    const housingUnitId = req.query.housing_unit_id;
    let query = `
        SELECT r.*, hu.name as housing_unit_name, hu.address as housing_address
        FROM dbo.rooms r 
        JOIN dbo.housing_units hu ON r.housing_unit_id = hu.id`;
    try {
        const pool = await getPool();
    if (housingUnitId) {
            query += ' WHERE r.housing_unit_id = @housing_unit_id';
            const result = await pool.request().input('housing_unit_id', sql.NVarChar(50), housingUnitId).query(query);
            res.json(result.recordset);
    } else {
        query += ' ORDER BY r.room_number';
            const result = await pool.request().query(query);
            res.json(result.recordset);
        }
    } catch (err) {
                res.status(500).json({ error: err.message });
    }
});

app.post('/api/rooms', async (req, res) => {
    const housing_unit_id = toNullableString(req.body.housing_unit_id);
    const room_number = toNullableString(req.body.room_number);
    const room_type = toNullableString(req.body.room_type);
    const capacity = toIntOrDefault(req.body.capacity, 1);
    const status = toNullableString(req.body.status) || 'available';
    const description = toNullableString(req.body.description);
    const id = uuidv4();
    try {
        const pool = await getPool();
        await pool.request()
            .input('id', sql.NVarChar(50), id)
            .input('housing_unit_id', sql.NVarChar(50), housing_unit_id)
            .input('room_number', sql.NVarChar(50), room_number)
            .input('room_type', sql.NVarChar(50), room_type)
            .input('capacity', sql.Int, capacity)
            .input('status', sql.NVarChar(50), status)
            .input('description', sql.NVarChar(sql.MAX), description)
            .query(`INSERT INTO dbo.rooms (id, housing_unit_id, room_number, room_type, capacity, status, description)
                    VALUES (@id, @housing_unit_id, @room_number, @room_type, @capacity, @status, @description)`);
        res.json({ id, housing_unit_id, room_number, room_type, capacity, status, description });
    } catch (err) {
        console.error('Create room failed:', err, req.body);
        res.status(500).json({ error: friendlySqlError(err) });
    }
});

app.put('/api/rooms/:id', async (req, res) => {
    const room_number = toNullableString(req.body.room_number);
    const room_type = toNullableString(req.body.room_type);
    const capacity = toIntOrDefault(req.body.capacity, 1);
    const status = toNullableString(req.body.status) || 'available';
    const description = toNullableString(req.body.description);
    const id = req.params.id;
    try {
        const pool = await getPool();
        await pool.request()
            .input('id', sql.NVarChar(50), id)
            .input('room_number', sql.NVarChar(50), room_number)
            .input('room_type', sql.NVarChar(50), room_type)
            .input('capacity', sql.Int, capacity)
            .input('status', sql.NVarChar(50), status)
            .input('description', sql.NVarChar(sql.MAX), description)
            .query(`UPDATE dbo.rooms 
                    SET room_number=@room_number, room_type=@room_type, capacity=@capacity, status=@status, description=@description, updated_at=SYSUTCDATETIME()
                    WHERE id=@id`);
        res.json({ message: 'Room updated successfully' });
    } catch (err) {
        console.error('Update room failed:', err, req.body);
        res.status(500).json({ error: friendlySqlError(err) });
    }
});

app.delete('/api/rooms/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const pool = await getPool();
        await pool.request().input('id', sql.NVarChar(50), id).query('DELETE FROM dbo.rooms WHERE id=@id');
        res.json({ message: 'Room deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Inventory Items
app.get('/api/inventory', async (req, res) => {
    const roomId = req.query.room_id;
    let query = `
        SELECT i.*, r.room_number, r.room_type, hu.name as housing_unit_name
        FROM dbo.inventory_items i 
        JOIN dbo.rooms r ON i.room_id = r.id 
        JOIN dbo.housing_units hu ON r.housing_unit_id = hu.id`;
    try {
        const pool = await getPool();
    if (roomId) {
            query += ' WHERE i.room_id = @room_id';
            const result = await pool.request().input('room_id', sql.NVarChar(50), roomId).query(query);
            res.json(result.recordset);
    } else {
        query += ' ORDER BY i.name';
            const result = await pool.request().query(query);
            res.json(result.recordset);
        }
    } catch (err) {
                res.status(500).json({ error: err.message });
    }
});

app.post('/api/inventory', async (req, res) => {
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
        await pool.request()
            .input('id', sql.NVarChar(50), id)
            .input('room_id', sql.NVarChar(50), room_id)
            .input('name', sql.NVarChar(255), name)
            .input('category', sql.NVarChar(100), category)
            .input('quantity', sql.Int, quantity)
            .input('condition', sql.NVarChar(50), condition)
            .input('description', sql.NVarChar(sql.MAX), description)
            .input('purchase_date', sql.Date, purchase_date)
            .input('warranty_expiry', sql.Date, warranty_expiry)
            .query(`INSERT INTO dbo.inventory_items (id, room_id, name, category, quantity, condition, description, purchase_date, warranty_expiry)
                    VALUES (@id, @room_id, @name, @category, @quantity, @condition, @description, @purchase_date, @warranty_expiry)`);
        res.json({ id, room_id, name, category, quantity, condition, description, purchase_date, warranty_expiry });
    } catch (err) {
        console.error('Create inventory failed:', err, req.body);
        res.status(500).json({ error: friendlySqlError(err) });
    }
});

app.put('/api/inventory/:id', async (req, res) => {
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
        await pool.request()
            .input('id', sql.NVarChar(50), id)
            .input('name', sql.NVarChar(255), name)
            .input('category', sql.NVarChar(100), category)
            .input('quantity', sql.Int, quantity)
            .input('condition', sql.NVarChar(50), condition)
            .input('description', sql.NVarChar(sql.MAX), description)
            .input('purchase_date', sql.Date, purchase_date)
            .input('warranty_expiry', sql.Date, warranty_expiry)
            .query(`UPDATE dbo.inventory_items 
                    SET name=@name, category=@category, quantity=@quantity, condition=@condition, description=@description, purchase_date=@purchase_date, warranty_expiry=@warranty_expiry, updated_at=SYSUTCDATETIME()
                    WHERE id=@id`);
        res.json({ message: 'Inventory item updated successfully' });
    } catch (err) {
        console.error('Update inventory failed:', err, req.body);
        res.status(500).json({ error: friendlySqlError(err) });
    }
});

app.delete('/api/inventory/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const pool = await getPool();
        await pool.request().input('id', sql.NVarChar(50), id).query('DELETE FROM dbo.inventory_items WHERE id=@id');
        res.json({ message: 'Inventory item deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Employees
app.get('/api/employees', async (req, res) => {
    const query = `
        SELECT e.*, r.room_number, r.room_type, hu.name as housing_unit_name
        FROM dbo.employees e 
        LEFT JOIN dbo.rooms r ON e.assigned_room_id = r.id 
        LEFT JOIN dbo.housing_units hu ON r.housing_unit_id = hu.id
        ORDER BY e.name`;
    try {
        const pool = await getPool();
        const result = await pool.request().query(query);
        res.json(result.recordset);
    } catch (err) {
            res.status(500).json({ error: err.message });
    }
});

app.post('/api/employees', async (req, res) => {
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
        await pool.request()
            .input('id', sql.NVarChar(50), id)
            .input('employee_id', sql.NVarChar(100), employee_id)
            .input('name', sql.NVarChar(255), name)
            .input('department', sql.NVarChar(255), department)
            .input('position', sql.NVarChar(255), position)
            .input('email', sql.NVarChar(255), email)
            .input('phone', sql.NVarChar(50), phone)
            .input('assigned_room_id', sql.NVarChar(50), assigned_room_id)
            .input('status', sql.NVarChar(50), status)
            .query(`INSERT INTO dbo.employees (id, employee_id, name, department, position, email, phone, assigned_room_id, status)
                    VALUES (@id, @employee_id, @name, @department, @position, @email, @phone, @assigned_room_id, @status)`);
        res.json({ id, employee_id, name, department, position, email, phone, assigned_room_id, status });
    } catch (err) {
        console.error('Create employee failed:', err, req.body);
        res.status(500).json({ error: friendlySqlError(err) });
    }
});

app.put('/api/employees/:id', async (req, res) => {
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
        await pool.request()
            .input('id', sql.NVarChar(50), id)
            .input('employee_id', sql.NVarChar(100), employee_id)
            .input('name', sql.NVarChar(255), name)
            .input('department', sql.NVarChar(255), department)
            .input('position', sql.NVarChar(255), position)
            .input('email', sql.NVarChar(255), email)
            .input('phone', sql.NVarChar(50), phone)
            .input('assigned_room_id', sql.NVarChar(50), assigned_room_id)
            .input('status', sql.NVarChar(50), status)
            .query(`UPDATE dbo.employees 
                    SET employee_id=@employee_id, name=@name, department=@department, position=@position, email=@email, phone=@phone, assigned_room_id=@assigned_room_id, status=@status, updated_at=SYSUTCDATETIME()
                    WHERE id=@id`);
        res.json({ message: 'Employee updated successfully' });
    } catch (err) {
        console.error('Update employee failed:', err, req.body);
        res.status(500).json({ error: friendlySqlError(err) });
    }
});

app.delete('/api/employees/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const pool = await getPool();
        await pool.request().input('id', sql.NVarChar(50), id).query('DELETE FROM dbo.employees WHERE id=@id');
        res.json({ message: 'Employee deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Dashboard Statistics
app.get('/api/dashboard/stats', async (req, res) => {
    try {
        const pool = await getPool();
        const [housing, rooms, items, employees] = await Promise.all([
            pool.request().query('SELECT COUNT(1) AS count FROM dbo.housing_units'),
            pool.request().query('SELECT COUNT(1) AS count FROM dbo.rooms'),
            pool.request().query('SELECT COUNT(1) AS count FROM dbo.inventory_items'),
            pool.request().query('SELECT COUNT(1) AS count FROM dbo.employees')
        ]);
        res.json({
            totalHousing: housing.recordset[0].count,
            totalRooms: rooms.recordset[0].count,
            totalItems: items.recordset[0].count,
            totalEmployees: employees.recordset[0].count
        });
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
        await pool.close();
        console.log('SQL Server connection closed.');
    } catch (e) {
        console.error('Error closing SQL Server connection:', e.message);
    } finally {
        process.exit(0);
    }
});
