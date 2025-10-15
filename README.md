# HTH Estate Management System

A comprehensive estate management system designed specifically for hospital employees, featuring housing management, room inventory tracking, and employee assignment capabilities.

## Features

### 🏠 Housing Management
- **Four Main Housing Types**: HTH Bangalore, Rental Apartment, Housement Flat (extensible for more types)
- **Housing Unit Management**: Add, edit, delete housing units with detailed information
- **Room Management**: Track individual rooms within housing units
- **Status Tracking**: Available, Occupied, Maintenance status for all units

### 📦 Inventory Management
- **Room-based Inventory**: Every room has its own inventory system
- **Item Categories**: Organize items by category (furniture, electronics, appliances, etc.)
- **Condition Tracking**: Monitor item condition (excellent, good, fair, poor, damaged)
- **Purchase & Warranty**: Track purchase dates and warranty expiry
- **Quantity Management**: Track multiple quantities of items

### 👥 Employee Management
- **Employee Profiles**: Complete employee information with department and position
- **Room Assignment**: Assign employees to specific rooms
- **Status Tracking**: Active, Inactive, On Leave status
- **Contact Information**: Email and phone number management

### 📊 Dashboard & Analytics
- **Real-time Statistics**: Total housing units, rooms, inventory items, and employees
- **Recent Activity**: View recently added housing units
- **Distribution Charts**: Visual representation of housing type distribution
- **Search & Filter**: Advanced filtering capabilities across all modules

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js with Express.js
- **Database**: SQLite3
- **Styling**: Custom CSS with modern design principles
- **Icons**: Font Awesome

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm (Node Package Manager)

### Installation Steps

1. **Clone or Download the Project**
   ```bash
   # If using git
   git clone <repository-url>
   cd HTH-Estate
   
   # Or simply download and extract the files
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start the Server**
   ```bash
   npm start
   ```

4. **Access the Application**
   Open your web browser and navigate to:
   ```
   http://localhost:3000
   ```

### Development Mode
For development with auto-reload:
```bash
npm run dev
```

## Database Schema

The system uses SQLite with the following main tables:

- **housing_types**: Housing type definitions (HTH Bangalore, Rental Apartment, etc.)
- **housing_units**: Individual housing units with type, address, capacity
- **rooms**: Rooms within housing units with room numbers and types
- **inventory_items**: Inventory items assigned to specific rooms
- **employees**: Employee information with room assignments

## Usage Guide

### Adding Housing Units
1. Navigate to the "Housing" section
2. Click "Add Housing Unit"
3. Fill in the required information:
   - Name (e.g., "Block A - Unit 101")
   - Type (select from predefined types)
   - Address
   - Capacity
   - Status
   - Description (optional)

### Managing Inventory
1. Go to the "Inventory" section
2. Click "Add Item"
3. Provide item details:
   - Name and category
   - Room assignment
   - Quantity and condition
   - Purchase date and warranty (optional)
   - Description

### Employee Management
1. Access the "Employees" section
2. Click "Add Employee"
3. Enter employee information:
   - Employee ID and name
   - Department and position
   - Contact information
   - Room assignment (optional)
   - Status

### Adding New Housing Types
The system is designed to be extensible. To add new housing types:

1. The system automatically creates default types on first run
2. New types can be added through the API or directly in the database
3. The UI will automatically include new types in dropdown menus

## API Endpoints

### Housing Types
- `GET /api/housing-types` - Get all housing types
- `POST /api/housing-types` - Create new housing type

### Housing Units
- `GET /api/housing-units` - Get all housing units
- `POST /api/housing-units` - Create new housing unit
- `PUT /api/housing-units/:id` - Update housing unit
- `DELETE /api/housing-units/:id` - Delete housing unit

### Rooms
- `GET /api/rooms` - Get all rooms
- `POST /api/rooms` - Create new room
- `PUT /api/rooms/:id` - Update room
- `DELETE /api/rooms/:id` - Delete room

### Inventory
- `GET /api/inventory` - Get all inventory items
- `POST /api/inventory` - Create new inventory item
- `PUT /api/inventory/:id` - Update inventory item
- `DELETE /api/inventory/:id` - Delete inventory item

### Employees
- `GET /api/employees` - Get all employees
- `POST /api/employees` - Create new employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## Customization

### Adding New Housing Types
To add new housing types beyond the default three:

1. **Via Database**: Insert directly into the `housing_types` table
2. **Via API**: Use the POST endpoint to add new types
3. **Via Code**: Modify the `defaultHousingTypes` array in `server.js`

### Styling Customization
- Modify `styles.css` for visual changes
- The design uses CSS custom properties for easy color scheme changes
- Responsive design works on desktop, tablet, and mobile devices

### Feature Extensions
The modular architecture allows for easy extension:
- Add new inventory categories
- Implement room booking system
- Add maintenance scheduling
- Integrate with external systems

## Security Considerations

- Input validation on both frontend and backend
- SQL injection protection through parameterized queries
- CORS enabled for cross-origin requests
- Data sanitization for user inputs

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Change port in server.js or use environment variable
   PORT=3001 npm start
   ```

2. **Database Issues**
   - Delete `estate_management.db` to reset the database
   - Restart the server to recreate tables

3. **Dependencies Issues**
   ```bash
   # Clear npm cache and reinstall
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please contact the development team or create an issue in the project repository.

---

**HTH Estate Management System** - Streamlining hospital employee housing and inventory management.
