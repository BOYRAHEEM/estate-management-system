# HTH Estate Management System

A comprehensive web-based estate management system designed for hospitals and healthcare facilities to manage housing units, rooms, inventory, employees, and damage reports efficiently.

![HTH Logo](Asset/HTH%20logo.jpeg)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [User Roles & Permissions](#user-roles--permissions)
- [PDF Report Generation](#pdf-report-generation)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Contributing](#contributing)
- [License](#license)

## 🏥 Overview

HTH Estate Management System is a full-stack web application built to streamline the management of hospital estate properties. The system provides real-time tracking of housing units, room assignments, inventory management, employee accommodation, and damage reporting with role-based access control.

## ✨ Features

### 🏠 Housing Unit Management
- Create, update, and manage multiple housing units
- Track housing unit types, addresses, and total rooms
- View occupancy statistics and capacity
- Filter and search housing units

### 🚪 Room Management
- Manage individual rooms within housing units
- Track room types (single, double, suite, etc.)
- Monitor room status (available, occupied, maintenance)
- Assign employees to rooms
- Prevent double-booking with automatic validation

### 📦 Inventory Management
- Comprehensive inventory tracking by room
- Categorized items (furniture, electronics, appliances, etc.)
- Monitor item conditions (good, damaged, repairing)
- Quantity and unit tracking
- Warranty and purchase date management
- Role-based edit and delete permissions
- Modern card-based UI with visual indicators

### 👥 Employee Management
- Employee profile management
- Room assignment tracking
- Department and position tracking
- Contact information management
- Employee status monitoring (active, inactive, on leave, resigned)

### ⚠️ Damage Reporting System
- Report damaged items with detailed descriptions
- Severity levels (minor, moderate, severe)
- Damage type categorization
- Status tracking (pending, in progress, resolved)
- Estimated repair cost tracking
- Prevent duplicate reports for items already reported
- Visual status indicators

### 📊 Dashboard & Analytics
- Real-time statistics and metrics
- Compliance rate tracking
- Damage reports overview
- Occupancy rates
- Inventory condition summaries
- Visual charts and graphs

### 📄 PDF Report Generation
Four types of professional PDF reports:

1. **Full Report** - Comprehensive report with rooms, inventory, and damage reports
2. **Rooms Only** - Detailed room information and occupancy
3. **Inventory Only** - Complete inventory listing by room
4. **Damage Reports Only** - Medical-style formatted damage reports with:
   - Item details and location
   - Damage type and severity
   - Full descriptions
   - Repair notes and estimated costs
   - Color-coded severity and status badges

### 🔐 User Management (Super Admin Only)
- Create and manage user accounts
- Role assignment (Admin, Super Admin)
- Password reset functionality
- User activity monitoring
- Username modification

### 🎨 User Interface
- Modern, responsive design
- Intuitive navigation
- Mobile-friendly layout
- Dark mode compatible
- Real-time notifications
- Collapsible inventory sections
- Burger menu for super admin tools

## 🛠️ Technologies Used

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **MySQL** - Relational database
- **Puppeteer** - PDF generation
- **bcrypt** - Password hashing
- **express-session** - Session management
- **express-mysql-session** - Session store

### Frontend
- **HTML5** - Markup
- **CSS3** - Styling with modern features
- **JavaScript (ES6+)** - Client-side logic
- **Font Awesome** - Icons

### Security
- Session-based authentication
- Role-based access control (RBAC)
- Password encryption
- SQL injection prevention
- XSS protection

## 📥 Installation

### Prerequisites
- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- npm or yarn package manager

### Step 1: Clone the Repository
```bash
git clone https://github.com/yourusername/HTH-Estate.git
cd HTH-Estate
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Database Setup
1. Create a MySQL database:
```sql
CREATE DATABASE hospital_estate;
```

2. Update database credentials in `db.js`:
```javascript
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'your_password',
    database: 'hospital_estate'
});
```

3. Run the sample data script to initialize tables:
```bash
node sample-data.js
```

### Step 4: Start the Server
```bash
npm start
```

The application will be available at `http://localhost:3000`

## ⚙️ Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DB=hospital_estate
MYSQL_PORT=3306

# Session Configuration
SESSION_SECRET=your-secret-key-change-in-production
```

### Default Credentials
**Super Admin:**
- Username: `superadmin`
- Password: `admin123`

**Regular Admin:**
- Username: `test`
- Password: `admin123`

⚠️ **Important:** Change these credentials immediately after first login!

## 🚀 Usage

### Login
1. Navigate to `http://localhost:3000`
2. Enter your username and password
3. Click "Login"

### Dashboard
- View real-time statistics
- Monitor compliance rates
- Check damage reports
- Access quick actions

### Managing Housing Units
1. Click "Housing Units" in navigation
2. Click "+ Add Housing Unit" to create new units
3. Fill in the required information
4. Click "Save"

### Managing Inventory
1. Navigate to "Inventory"
2. Browse items by room (collapsible sections)
3. Click three dots (⋮) on any item for options:
   - **Edit** - Modify item details
   - **Report Damage** - Report damaged items (Admin only)
   - **Delete** - Remove items (Super Admin only)

### Reporting Damage
1. Find the item in inventory
2. Click three dots (⋮) → "Report Damage"
3. Fill in damage details:
   - Damage type
   - Severity level
   - Description
   - Estimated cost (optional)
   - Repair notes (optional)
4. Submit the report

### Generating Reports
1. Click "Generate Reports" button
2. Select report type:
   - Full Report
   - Rooms Only
   - Inventory Only
   - Damage Reports Only
3. Choose housing unit or "All"
4. Click "Generate"
5. PDF will download automatically

## 👤 User Roles & Permissions

### Super Admin
**Full Access:**
- ✅ All Admin permissions
- ✅ User Management
- ✅ Delete inventory items
- ✅ Delete housing units, rooms, employees
- ✅ View damage reports page
- ✅ Access system settings
- ✅ View login history
- ✅ Generate all report types

**Restrictions:**
- ❌ Cannot report damage (admin function)

### Admin
**Standard Access:**
- ✅ View dashboard
- ✅ Manage housing units
- ✅ Manage rooms
- ✅ Manage inventory (edit only)
- ✅ Manage employees
- ✅ Report damage
- ✅ Generate reports
- ✅ Change own username/password

**Restrictions:**
- ❌ Delete inventory items
- ❌ User management
- ❌ View damage reports page
- ❌ System settings access

## 📄 PDF Report Generation

### Report Types

#### 1. Full Report
- Complete overview of all data
- Includes rooms, inventory, and damage reports
- Summary statistics
- Detailed tables for all sections

#### 2. Rooms Only
- Room listings with details
- Occupant information
- Room status and types
- Occupancy statistics

#### 3. Inventory Only
- Comprehensive inventory listing
- Grouped by room
- Condition tracking
- Quantity and unit information

#### 4. Damage Reports Only
**Medical-Style Formatted Report:**
- Professional layout with HTH logo
- Individual cards for each damage report
- Color-coded severity badges:
  - 🔴 Severe (Red)
  - 🟠 Moderate (Orange)
  - 🟢 Minor (Green)
- Status indicators:
  - 🟢 Resolved
  - 🟠 In Progress
  - ⚪ Pending
- Detailed sections:
  - Item name and location
  - Damage type and severity
  - Full description box
  - Reported by and date
  - Estimated repair cost
  - Repair notes (if available)

### Filtering Reports
- Generate reports for specific housing units
- Or select "All Housing Units" for comprehensive reports
- Reports are automatically optimized for each type

## 🗄️ Database Schema

### Main Tables

#### housing_units
- `id` - Unique identifier
- `name` - Housing unit name
- `address` - Physical location
- `total_rooms` - Number of rooms
- `housing_type_id` - Reference to housing type

#### rooms
- `id` - Unique identifier
- `room_number` - Room number
- `room_type` - Type (single, double, suite)
- `housing_unit_id` - Reference to housing unit
- `status` - Room status

#### inventory_items
- `id` - Unique identifier
- `name` - Item name
- `category` - Item category
- `quantity` - Item quantity
- `unit` - Unit of measurement
- `condition` - Item condition (good, damaged, repairing)
- `room_id` - Reference to room
- `purchase_date` - Purchase date
- `warranty_expiry` - Warranty expiration

#### employees
- `id` - Unique identifier
- `employee_id` - Employee number
- `name` - Full name
- `department` - Department
- `position` - Job position
- `email` - Email address
- `phone` - Phone number
- `assigned_room_id` - Reference to assigned room
- `status` - Employment status

#### damage_reports
- `id` - Unique identifier
- `item_id` - Reference to damaged item
- `damage_type` - Type of damage
- `severity` - Severity level
- `description` - Detailed description
- `reported_by` - Reporter name
- `reported_date` - Date reported
- `damage_status` - Current status
- `estimated_repair_cost` - Estimated cost
- `repair_notes` - Repair notes
- `resolution_notes` - Resolution details
- `resolved_date` - Resolution date

#### users
- `id` - Unique identifier
- `username` - Login username
- `password` - Hashed password
- `role` - User role (admin, super_admin)
- `full_name` - Display name
- `email` - Email address

## 🔌 API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/auth/me` - Get current user

### Housing Units
- `GET /api/housing-units` - Get all housing units
- `POST /api/housing-units` - Create housing unit
- `PUT /api/housing-units/:id` - Update housing unit
- `DELETE /api/housing-units/:id` - Delete housing unit

### Rooms
- `GET /api/rooms` - Get all rooms
- `POST /api/rooms` - Create room
- `PUT /api/rooms/:id` - Update room
- `DELETE /api/rooms/:id` - Delete room

### Inventory
- `GET /api/inventory` - Get all inventory items
- `POST /api/inventory` - Create inventory item
- `PUT /api/inventory/:id` - Update inventory item
- `DELETE /api/inventory/:id` - Delete inventory item (Super Admin only)

### Employees
- `GET /api/employees` - Get all employees
- `POST /api/employees` - Create employee
- `PUT /api/employees/:id` - Update employee

### Damage Reports
- `GET /api/damage-reports` - Get all damage reports
- `POST /api/damage-reports` - Create damage report
- `PUT /api/damage-reports/:id/status` - Update damage status

### Users (Super Admin Only)
- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Reports
- `GET /api/generate-report` - Generate PDF report
  - Query params: `type` (full|rooms|inventory|damage), `housing_unit_id` (optional)

### Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile/username` - Update username
- `PUT /api/change-password` - Change password

## 🎨 UI Features

### Modern Design Elements
- **Card-based layouts** for better visual organization
- **Color-coded indicators** for status and severity
- **Responsive grid system** for all screen sizes
- **Smooth animations** and transitions
- **Intuitive icons** from Font Awesome
- **Clean typography** for readability

### User Experience
- **Auto-save** for form data
- **Real-time validation** on forms
- **Instant notifications** for actions
- **Keyboard shortcuts** support
- **Mobile-friendly** touch targets
- **Loading states** for async operations
- **Empty states** with helpful messages

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **Session Management**: Secure HTTP-only cookies
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Input sanitization
- **Role-Based Access Control**: Granular permissions
- **Cache Control**: No-cache headers for security
- **CSRF Protection**: Session-based tokens

## 🐛 Known Issues & Limitations

1. **Browser Cache**: May require hard refresh (Ctrl+Shift+R) after updates
2. **PDF Generation**: Large reports (>1000 items) may take time
3. **File Upload**: Logo must be in JPEG format
4. **Database**: Tested primarily with MySQL 8.0
5. **Concurrent Users**: Session store optimized for moderate traffic

## 📈 Future Enhancements

- [ ] Multi-tenancy support
- [ ] Email notifications for damage reports
- [ ] Advanced analytics and charts
- [ ] Mobile app (iOS/Android)
- [ ] Barcode/QR code scanning for inventory
- [ ] Automated backup system
- [ ] Export to Excel/CSV
- [ ] Real-time collaboration
- [ ] Integration with external systems
- [ ] Custom report templates

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support & Contact

For questions, issues, or support:

**Developer:** A. Rahim  
**Email:** boyraheem@icloud.com  
**Project Repository:** [GitHub](https://github.com/yourusername/HTH-Estate)

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- HTH Hospital for project requirements and support
- Font Awesome for icon library
- Puppeteer team for PDF generation capabilities
- Express.js community for excellent documentation
- All contributors and testers

---

**Version:** 1.0.0  
**Last Updated:** October 2025  
**Status:** Production Ready ✅

Made with ❤️ for HTH Hospital Estate Management
