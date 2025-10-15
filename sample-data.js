// Sample Data Script for HTH Estate Management System
// Run this script to populate the database with sample data

const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');

const db = new sqlite3.Database('estate_management.db');

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
function insertSampleData() {
    console.log('Starting to insert sample data...');
    
    db.serialize(() => {
        // Insert housing units
        console.log('Inserting housing units...');
        const insertHousing = db.prepare(`INSERT INTO housing_units (id, name, type_id, address, capacity, status, description) VALUES (?, ?, ?, ?, ?, ?, ?)`);
        
        sampleHousingUnits.forEach((unit, index) => {
            insertHousing.run([unit.id, unit.name, unit.type_id, unit.address, unit.capacity, unit.status, unit.description]);
            console.log(`Inserted housing unit: ${unit.name}`);
        });
        insertHousing.finalize();
        
        // Insert rooms
        console.log('Inserting rooms...');
        const insertRoom = db.prepare(`INSERT INTO rooms (id, housing_unit_id, room_number, room_type, capacity, status, description) VALUES (?, ?, ?, ?, ?, ?, ?)`);
        
        let roomIndex = 0;
        sampleHousingUnits.forEach((unit, unitIndex) => {
            // Assign rooms to housing units
            const roomsForUnit = sampleRooms.slice(roomIndex, roomIndex + Math.ceil(sampleRooms.length / sampleHousingUnits.length));
            
            roomsForUnit.forEach((room, roomUnitIndex) => {
                const roomId = uuidv4();
                insertRoom.run([roomId, unit.id, room.room_number, room.room_type, room.capacity, room.status, room.description]);
                console.log(`Inserted room: ${room.room_number} in ${unit.name}`);
                
                // Update the room_id in sampleInventoryItems for this room
                const inventoryStartIndex = roomIndex * 3; // Assuming 3 items per room on average
                for (let i = inventoryStartIndex; i < inventoryStartIndex + 3 && i < sampleInventoryItems.length; i++) {
                    if (sampleInventoryItems[i].room_id === null) {
                        sampleInventoryItems[i].room_id = roomId;
                        break;
                    }
                }
            });
            
            roomIndex += Math.ceil(sampleRooms.length / sampleHousingUnits.length);
        });
        insertRoom.finalize();
        
        // Insert inventory items
        console.log('Inserting inventory items...');
        const insertInventory = db.prepare(`INSERT INTO inventory_items (id, room_id, name, category, quantity, condition, description, purchase_date, warranty_expiry) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        
        sampleInventoryItems.forEach((item, index) => {
            if (item.room_id) {
                const itemId = uuidv4();
                insertInventory.run([itemId, item.room_id, item.name, item.category, item.quantity, item.condition, item.description, item.purchase_date, item.warranty_expiry]);
                console.log(`Inserted inventory item: ${item.name}`);
            }
        });
        insertInventory.finalize();
        
        // Insert employees
        console.log('Inserting employees...');
        const insertEmployee = db.prepare(`INSERT INTO employees (id, employee_id, name, department, position, email, phone, assigned_room_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        
        sampleEmployees.forEach((employee, index) => {
            insertEmployee.run([employee.id, employee.employee_id, employee.name, employee.department, employee.position, employee.email, employee.phone, employee.assigned_room_id, employee.status]);
            console.log(`Inserted employee: ${employee.name}`);
        });
        insertEmployee.finalize();
        
        console.log('Sample data insertion completed successfully!');
    });
}

// Initialize database tables first, then check for existing data
db.serialize(() => {
    // Create tables if they don't exist (same as in server.js)
    db.run(`CREATE TABLE IF NOT EXISTS housing_types (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

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

    // Check if sample data already exists
    db.get("SELECT COUNT(*) as count FROM housing_units", (err, row) => {
        if (err) {
            console.error('Error checking existing data:', err);
            return;
        }
        
        if (row.count > 0) {
            console.log('Sample data already exists in the database.');
            console.log('To reset the database, delete the estate_management.db file and run this script again.');
        } else {
            insertSampleData();
        }
    });
});

// Close database connection
setTimeout(() => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('Database connection closed.');
        }
    });
}, 2000);
