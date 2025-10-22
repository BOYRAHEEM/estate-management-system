// Sample Data Script for HTH Estate Management System
// Run this script to populate the database with sample data

const { getPool } = require('./db');
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
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    try {
        // Insert housing units
        // Insert housing units
        console.log('Inserting housing units...');
        for (const unit of sampleHousingUnits) {
            await connection.query(
                'INSERT INTO housing_units (id, name, type_id, address, capacity, status, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [unit.id, unit.name, unit.type_id, unit.address, unit.capacity, unit.status, unit.description]
            );
            console.log(`Inserted housing unit: ${unit.name}`);
        }

        // Insert rooms and map inventory room_ids
        console.log('Inserting rooms...');
        let roomIndex = 0;
        for (const unit of sampleHousingUnits) {
            const roomsForUnit = sampleRooms.slice(roomIndex, roomIndex + Math.ceil(sampleRooms.length / sampleHousingUnits.length));
            for (const room of roomsForUnit) {
                const roomId = uuidv4();
                await connection.query(
                    'INSERT INTO rooms (id, housing_unit_id, room_number, room_type, capacity, status, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [roomId, unit.id, room.room_number, room.room_type, room.capacity, room.status, room.description]
                );
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
            await connection.query(
                'INSERT INTO inventory_items (id, room_id, name, category, quantity, `condition`, description, purchase_date, warranty_expiry) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [itemId, item.room_id, item.name, item.category, item.quantity, item.condition, item.description, item.purchase_date || null, item.warranty_expiry || null]
            );
            console.log(`Inserted inventory item: ${item.name}`);
        }

        // Insert employees
        console.log('Inserting employees...');
        for (const employee of sampleEmployees) {
            await connection.query(
                'INSERT INTO employees (id, employee_id, name, department, position, email, phone, assigned_room_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [employee.id, employee.employee_id, employee.name, employee.department, employee.position, employee.email, employee.phone, employee.assigned_room_id, employee.status]
            );
            console.log(`Inserted employee: ${employee.name}`);
        }

        await connection.commit();
        console.log('Sample data insertion completed successfully!');
    } catch (err) {
        console.error('Error inserting sample data:', err);
        try { await connection.rollback(); } catch (_) {}
    } finally {
        try { await connection.release(); } catch (_) {}
        const pool2 = await getPool();
        await pool2.end();
        console.log('MySQL pool ended.');
    }
}

// Initialize database tables first, then check for existing data
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
            role VARCHAR(50) NOT NULL DEFAULT 'admin',
            full_name VARCHAR(255) NULL,
            email VARCHAR(255) NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
        `CREATE TABLE IF NOT EXISTS damage_reports (
            id INT AUTO_INCREMENT PRIMARY KEY,
            item_id VARCHAR(50) NOT NULL,
            damage_type VARCHAR(100) NOT NULL,
            severity VARCHAR(50) NOT NULL,
            description TEXT NULL,
            reported_by VARCHAR(255) NOT NULL,
            damage_status VARCHAR(50) DEFAULT 'pending',
            damage_date DATE NULL,
            reported_date DATE NULL,
            estimated_repair_cost DECIMAL(10,2) NULL,
            repair_notes TEXT NULL,
            resolution_notes TEXT NULL,
            resolved_date DATETIME NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT FK_damage_item FOREIGN KEY (item_id) REFERENCES inventory_items (id) ON DELETE CASCADE ON UPDATE CASCADE,
            INDEX idx_damage_item_id (item_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
    ];
    for (const stmt of ddlStatements) {
        await pool.query(stmt);
    }
    // Seed default housing types
    await pool.query("INSERT IGNORE INTO housing_types (id, name, description) VALUES ('hth-bangalore','HTH Bangalore','Hospital staff housing in Bangalore')");
    await pool.query("INSERT IGNORE INTO housing_types (id, name, description) VALUES ('rental-apartment','Rental Apartment','Rental apartments for hospital employees')");
    await pool.query("INSERT IGNORE INTO housing_types (id, name, description) VALUES ('housement-flat','Housement Flat','Housement flats for hospital staff')");
}

// Initialize database tables first, then check for existing data
(async () => {
    try {
        await initSchema();
        const pool = await getPool();
        const [rows] = await pool.query('SELECT COUNT(1) AS count FROM housing_units');
        if (rows[0]?.count > 0) {
            console.log('Sample data already exists in the database.');
            await pool.end();
            console.log('MySQL pool ended.');
        } else {
            await insertSampleData();
        }
    } catch (err) {
        console.error('Setup error:', err);
        try { const pool = await getPool(); await pool.end(); } catch (_) {}
    }
})();

// Database connection is closed after operations complete
