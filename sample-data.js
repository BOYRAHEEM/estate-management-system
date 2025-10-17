// Sample Data Script for HTH Estate Management System
// Run this script to populate the database with sample data

const { sql, getPool } = require('./db');
const { v4: uuidv4 } = require('uuid');

// Sample data
const sampleHousingUnits = [
    {
        id: uuidv4(),
        name: 'HTH Bangalore - Block A',
        type_id: 'hth-bangalore',
        address: '123 Hospital Road, Bangalore, Karnataka 560001',
        capacity: 4,
        status: 'available',
        description: 'Main hospital staff housing block with modern amenities'
    },
    {
        id: uuidv4(),
        name: 'HTH Bangalore - Block B',
        type_id: 'hth-bangalore',
        address: '123 Hospital Road, Bangalore, Karnataka 560001',
        capacity: 6,
        status: 'occupied',
        description: 'Secondary housing block for senior staff'
    },
    {
        id: uuidv4(),
        name: 'Green Valley Apartments',
        type_id: 'rental-apartment',
        address: '456 Green Valley Road, Bangalore, Karnataka 560002',
        capacity: 2,
        status: 'available',
        description: 'Modern rental apartments with gym and swimming pool'
    },
    {
        id: uuidv4(),
        name: 'Sunrise Apartments',
        type_id: 'rental-apartment',
        address: '789 Sunrise Avenue, Bangalore, Karnataka 560003',
        capacity: 3,
        status: 'maintenance',
        description: 'Well-maintained apartments near the hospital'
    },
    {
        id: uuidv4(),
        name: 'Staff Quarters - Building 1',
        type_id: 'housement-flat',
        address: '321 Staff Quarters Lane, Bangalore, Karnataka 560004',
        capacity: 8,
        status: 'available',
        description: 'Government staff quarters with basic amenities'
    },
    {
        id: uuidv4(),
        name: 'Staff Quarters - Building 2',
        type_id: 'housement-flat',
        address: '321 Staff Quarters Lane, Bangalore, Karnataka 560004',
        capacity: 6,
        status: 'occupied',
        description: 'Additional staff quarters building'
    }
];

const sampleRooms = [
    // HTH Bangalore - Block A rooms
    { housing_unit_id: null, room_number: 'A101', room_type: 'Single', capacity: 1, status: 'available', description: 'Single occupancy room with attached bathroom' },
    { housing_unit_id: null, room_number: 'A102', room_type: 'Single', capacity: 1, status: 'occupied', description: 'Single occupancy room with attached bathroom' },
    { housing_unit_id: null, room_number: 'A103', room_type: 'Double', capacity: 2, status: 'available', description: 'Double occupancy room with shared bathroom' },
    { housing_unit_id: null, room_number: 'A104', room_type: 'Double', capacity: 2, status: 'maintenance', description: 'Double occupancy room under renovation' },
    
    // HTH Bangalore - Block B rooms
    { housing_unit_id: null, room_number: 'B201', room_type: 'Single', capacity: 1, status: 'occupied', description: 'Senior staff single room' },
    { housing_unit_id: null, room_number: 'B202', room_type: 'Single', capacity: 1, status: 'occupied', description: 'Senior staff single room' },
    { housing_unit_id: null, room_number: 'B203', room_type: 'Triple', capacity: 3, status: 'available', description: 'Triple occupancy room for junior staff' },
    
    // Green Valley Apartments rooms
    { housing_unit_id: null, room_number: 'GVA101', room_type: 'Studio', capacity: 1, status: 'available', description: 'Studio apartment with kitchenette' },
    { housing_unit_id: null, room_number: 'GVA102', room_type: 'Studio', capacity: 1, status: 'occupied', description: 'Studio apartment with kitchenette' },
    
    // Sunrise Apartments rooms
    { housing_unit_id: null, room_number: 'SA201', room_type: '1BHK', capacity: 2, status: 'maintenance', description: '1 Bedroom Hall Kitchen apartment' },
    { housing_unit_id: null, room_number: 'SA202', room_type: '1BHK', capacity: 2, status: 'maintenance', description: '1 Bedroom Hall Kitchen apartment' },
    
    // Staff Quarters rooms
    { housing_unit_id: null, room_number: 'SQ101', room_type: 'Single', capacity: 1, status: 'available', description: 'Basic single room' },
    { housing_unit_id: null, room_number: 'SQ102', room_type: 'Single', capacity: 1, status: 'available', description: 'Basic single room' },
    { housing_unit_id: null, room_number: 'SQ201', room_type: 'Double', capacity: 2, status: 'occupied', description: 'Basic double room' },
    { housing_unit_id: null, room_number: 'SQ202', room_type: 'Double', capacity: 2, status: 'occupied', description: 'Basic double room' }
];

const sampleInventoryItems = [
    // Room A101 items
    { room_id: null, name: 'Single Bed', category: 'Furniture', quantity: 1, condition: 'good', description: 'Wooden single bed with mattress', purchase_date: '2023-01-15' },
    { room_id: null, name: 'Study Table', category: 'Furniture', quantity: 1, condition: 'excellent', description: 'Wooden study table with drawer', purchase_date: '2023-01-15' },
    { room_id: null, name: 'Ceiling Fan', category: 'Electronics', quantity: 1, condition: 'good', description: '3-blade ceiling fan', purchase_date: '2023-01-10', warranty_expiry: '2026-01-10' },
    { room_id: null, name: 'LED Light', category: 'Electronics', quantity: 2, condition: 'excellent', description: 'Energy efficient LED bulbs', purchase_date: '2023-01-15' },
    
    // Room A102 items
    { room_id: null, name: 'Single Bed', category: 'Furniture', quantity: 1, condition: 'fair', description: 'Metal single bed with mattress', purchase_date: '2022-06-20' },
    { room_id: null, name: 'Wardrobe', category: 'Furniture', quantity: 1, condition: 'good', description: '3-door wooden wardrobe', purchase_date: '2022-06-20' },
    { room_id: null, name: 'Air Conditioner', category: 'Appliances', quantity: 1, condition: 'excellent', description: '1.5 ton split AC', purchase_date: '2023-03-10', warranty_expiry: '2026-03-10' },
    
    // Room A103 items
    { room_id: null, name: 'Bunk Bed', category: 'Furniture', quantity: 1, condition: 'good', description: 'Metal bunk bed for two people', purchase_date: '2023-02-01' },
    { room_id: null, name: 'Study Chairs', category: 'Furniture', quantity: 2, condition: 'good', description: 'Plastic study chairs', purchase_date: '2023-02-01' },
    { room_id: null, name: 'Refrigerator', category: 'Appliances', quantity: 1, condition: 'excellent', description: '150L single door refrigerator', purchase_date: '2023-02-05', warranty_expiry: '2026-02-05' },
    
    // Room B201 items
    { room_id: null, name: 'King Size Bed', category: 'Furniture', quantity: 1, condition: 'excellent', description: 'Premium king size bed with memory foam mattress', purchase_date: '2023-01-20' },
    { room_id: null, name: 'Smart TV', category: 'Electronics', quantity: 1, condition: 'excellent', description: '43-inch smart LED TV', purchase_date: '2023-01-20', warranty_expiry: '2026-01-20' },
    { room_id: null, name: 'Air Conditioner', category: 'Appliances', quantity: 1, condition: 'excellent', description: '2 ton split AC with inverter', purchase_date: '2023-01-20', warranty_expiry: '2026-01-20' },
    
    // Room GVA101 items
    { room_id: null, name: 'Sofa Bed', category: 'Furniture', quantity: 1, condition: 'good', description: 'Convertible sofa bed', purchase_date: '2023-03-01' },
    { room_id: null, name: 'Kitchen Cabinet', category: 'Furniture', quantity: 1, condition: 'excellent', description: 'Modular kitchen cabinet', purchase_date: '2023-03-01' },
    { room_id: null, name: 'Microwave', category: 'Appliances', quantity: 1, condition: 'excellent', description: '25L convection microwave', purchase_date: '2023-03-01', warranty_expiry: '2026-03-01' }
];

const sampleEmployees = [
    {
        id: uuidv4(),
        employee_id: 'EMP001',
        name: 'Dr. Rajesh Kumar',
        department: 'Cardiology',
        position: 'Senior Consultant',
        email: 'rajesh.kumar@hth.com',
        phone: '+91-9876543210',
        assigned_room_id: null,
        status: 'active'
    },
    {
        id: uuidv4(),
        employee_id: 'EMP002',
        name: 'Dr. Priya Sharma',
        department: 'Pediatrics',
        position: 'Consultant',
        email: 'priya.sharma@hth.com',
        phone: '+91-9876543211',
        assigned_room_id: null,
        status: 'active'
    },
    {
        id: uuidv4(),
        employee_id: 'EMP003',
        name: 'Nurse Anjali Singh',
        department: 'Emergency',
        position: 'Senior Nurse',
        email: 'anjali.singh@hth.com',
        phone: '+91-9876543212',
        assigned_room_id: null,
        status: 'active'
    },
    {
        id: uuidv4(),
        employee_id: 'EMP004',
        name: 'Dr. Amit Patel',
        department: 'Orthopedics',
        position: 'Junior Doctor',
        email: 'amit.patel@hth.com',
        phone: '+91-9876543213',
        assigned_room_id: null,
        status: 'on-leave'
    },
    {
        id: uuidv4(),
        employee_id: 'EMP005',
        name: 'Nurse Sunita Reddy',
        department: 'ICU',
        position: 'Staff Nurse',
        email: 'sunita.reddy@hth.com',
        phone: '+91-9876543214',
        assigned_room_id: null,
        status: 'active'
    },
    {
        id: uuidv4(),
        employee_id: 'EMP006',
        name: 'Dr. Vikram Joshi',
        department: 'Neurology',
        position: 'Head of Department',
        email: 'vikram.joshi@hth.com',
        phone: '+91-9876543215',
        assigned_room_id: null,
        status: 'active'
    }
];

// Function to insert sample data
async function insertSampleData() {
    console.log('Starting to insert sample data...');
    const pool = await getPool();
    const tx = new sql.Transaction(await pool);
    await tx.begin();
    try {
        const request = new sql.Request(tx);
        // Insert housing units
        console.log('Inserting housing units...');
        for (const unit of sampleHousingUnits) {
            await request
                .input('id', sql.NVarChar(50), unit.id)
                .input('name', sql.NVarChar(255), unit.name)
                .input('type_id', sql.NVarChar(50), unit.type_id)
                .input('address', sql.NVarChar(500), unit.address)
                .input('capacity', sql.Int, unit.capacity)
                .input('status', sql.NVarChar(50), unit.status)
                .input('description', sql.NVarChar(sql.MAX), unit.description)
                .query('INSERT INTO dbo.housing_units (id, name, type_id, address, capacity, status, description) VALUES (@id, @name, @type_id, @address, @capacity, @status, @description)');
            request.parameters = {}; // reset params
            console.log(`Inserted housing unit: ${unit.name}`);
        }

        // Insert rooms and map inventory room_ids
        console.log('Inserting rooms...');
        let roomIndex = 0;
        for (const unit of sampleHousingUnits) {
            const roomsForUnit = sampleRooms.slice(roomIndex, roomIndex + Math.ceil(sampleRooms.length / sampleHousingUnits.length));
            for (const room of roomsForUnit) {
                const roomId = uuidv4();
                await request
                    .input('id', sql.NVarChar(50), roomId)
                    .input('housing_unit_id', sql.NVarChar(50), unit.id)
                    .input('room_number', sql.NVarChar(50), room.room_number)
                    .input('room_type', sql.NVarChar(50), room.room_type)
                    .input('capacity', sql.Int, room.capacity)
                    .input('status', sql.NVarChar(50), room.status)
                    .input('description', sql.NVarChar(sql.MAX), room.description)
                    .query('INSERT INTO dbo.rooms (id, housing_unit_id, room_number, room_type, capacity, status, description) VALUES (@id, @housing_unit_id, @room_number, @room_type, @capacity, @status, @description)');
                request.parameters = {};
                console.log(`Inserted room: ${room.room_number} in ${unit.name}`);
                const inventoryStartIndex = roomIndex * 3;
                for (let i = inventoryStartIndex; i < inventoryStartIndex + 3 && i < sampleInventoryItems.length; i++) {
                    if (sampleInventoryItems[i].room_id === null) {
                        sampleInventoryItems[i].room_id = roomId;
                        break;
                    }
                }
            }
            roomIndex += Math.ceil(sampleRooms.length / sampleHousingUnits.length);
        }

        // Insert inventory items
        console.log('Inserting inventory items...');
        for (const item of sampleInventoryItems) {
            if (!item.room_id) continue;
            const itemId = uuidv4();
            await request
                .input('id', sql.NVarChar(50), itemId)
                .input('room_id', sql.NVarChar(50), item.room_id)
                .input('name', sql.NVarChar(255), item.name)
                .input('category', sql.NVarChar(100), item.category)
                .input('quantity', sql.Int, item.quantity)
                .input('condition', sql.NVarChar(50), item.condition)
                .input('description', sql.NVarChar(sql.MAX), item.description)
                .input('purchase_date', sql.Date, item.purchase_date || null)
                .input('warranty_expiry', sql.Date, item.warranty_expiry || null)
                .query('INSERT INTO dbo.inventory_items (id, room_id, name, category, quantity, condition, description, purchase_date, warranty_expiry) VALUES (@id, @room_id, @name, @category, @quantity, @condition, @description, @purchase_date, @warranty_expiry)');
            request.parameters = {};
            console.log(`Inserted inventory item: ${item.name}`);
        }

        // Insert employees
        console.log('Inserting employees...');
        for (const employee of sampleEmployees) {
            await request
                .input('id', sql.NVarChar(50), employee.id)
                .input('employee_id', sql.NVarChar(100), employee.employee_id)
                .input('name', sql.NVarChar(255), employee.name)
                .input('department', sql.NVarChar(255), employee.department)
                .input('position', sql.NVarChar(255), employee.position)
                .input('email', sql.NVarChar(255), employee.email)
                .input('phone', sql.NVarChar(50), employee.phone)
                .input('assigned_room_id', sql.NVarChar(50), employee.assigned_room_id)
                .input('status', sql.NVarChar(50), employee.status)
                .query('INSERT INTO dbo.employees (id, employee_id, name, department, position, email, phone, assigned_room_id, status) VALUES (@id, @employee_id, @name, @department, @position, @email, @phone, @assigned_room_id, @status)');
            request.parameters = {};
            console.log(`Inserted employee: ${employee.name}`);
        }

        await tx.commit();
        console.log('Sample data insertion completed successfully!');
    } catch (err) {
        console.error('Error inserting sample data:', err);
        try { await tx.rollback(); } catch (_) {}
    } finally {
        const pool = await getPool();
        await pool.close();
        console.log('Database connection closed.');
    }
}

// Initialize database tables first, then check for existing data
// Ensure schema exists (server does it too). Only seed if empty
(async () => {
    const pool = await getPool();
    // Ensure schema exists
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

IF NOT EXISTS (SELECT 1 FROM dbo.housing_types WHERE id = 'hth-bangalore')
    INSERT INTO dbo.housing_types (id, name, description) VALUES ('hth-bangalore','HTH Bangalore','Hospital staff housing in Bangalore');
IF NOT EXISTS (SELECT 1 FROM dbo.housing_types WHERE id = 'rental-apartment')
    INSERT INTO dbo.housing_types (id, name, description) VALUES ('rental-apartment','Rental Apartment','Rental apartments for hospital employees');
IF NOT EXISTS (SELECT 1 FROM dbo.housing_types WHERE id = 'housement-flat')
    INSERT INTO dbo.housing_types (id, name, description) VALUES ('housement-flat','Housement Flat','Housement flats for hospital staff');
`;
    await pool.request().batch(schemaSql);
    const result = await pool.request().query('SELECT COUNT(1) AS count FROM dbo.housing_units');
    if (result.recordset[0].count > 0) {
        console.log('Sample data already exists in the database.');
        await pool.close();
        console.log('Database connection closed.');
    } else {
        await insertSampleData();
    }
})().catch(async (err) => {
    console.error('Setup error:', err);
    try { const pool = await getPool(); await pool.close(); } catch (_) {}
});

// Database connection is closed after operations complete
