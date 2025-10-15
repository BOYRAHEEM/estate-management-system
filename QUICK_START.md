# HTH Estate Management System - Quick Start Guide

## 🚀 Quick Setup (Windows)

1. **Double-click `start.bat`** - This will automatically:
   - Install dependencies
   - Set up sample data
   - Start the server

2. **Open your browser** and go to: `http://localhost:3000`

## 🚀 Quick Setup (Mac/Linux)

1. **Run the setup script**:
   ```bash
   chmod +x start.sh
   ./start.sh
   ```

2. **Open your browser** and go to: `http://localhost:3000`

## 🚀 Manual Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Add sample data**:
   ```bash
   npm run sample-data
   ```

3. **Start the server**:
   ```bash
   npm start
   ```

4. **Open your browser** and go to: `http://localhost:3000`

## 📋 What You'll See

The system comes pre-loaded with sample data including:

- **6 Housing Units** across 3 types:
  - HTH Bangalore (2 blocks)
  - Rental Apartments (2 buildings)
  - Housement Flats (2 buildings)

- **15 Rooms** with different types:
  - Single, Double, Triple occupancy
  - Studio, 1BHK apartments
  - Various statuses (Available, Occupied, Maintenance)

- **6 Inventory Items** including:
  - Furniture (beds, tables, wardrobes)
  - Electronics (TVs, fans, lights)
  - Appliances (AC, refrigerator, microwave)

- **6 Sample Employees** from different departments:
  - Doctors (Cardiology, Pediatrics, Orthopedics, Neurology)
  - Nurses (Emergency, ICU)

## 🎯 Key Features

### Dashboard
- Real-time statistics
- Recent housing units
- Housing type distribution

### Housing Management
- Add/Edit/Delete housing units
- Filter by type and search
- Track capacity and status

### Inventory Management
- Room-based inventory tracking
- Item categories and conditions
- Purchase dates and warranties

### Employee Management
- Complete employee profiles
- Room assignments
- Department and position tracking

## 🔧 Adding New Housing Types

The system is designed to be extensible. To add new housing types:

1. **Via Database**: Insert directly into the `housing_types` table
2. **Via API**: Use POST `/api/housing-types`
3. **Via Code**: Modify the `defaultHousingTypes` array in `server.js`

## 🛠️ Troubleshooting

### Port Already in Use
```bash
# Change port
PORT=3001 npm start
```

### Reset Database
```bash
# Delete database file and restart
rm estate_management.db
npm run sample-data
npm start
```

### Dependencies Issues
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

## 📱 Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 🎨 Customization

- **Colors**: Modify CSS custom properties in `styles.css`
- **Housing Types**: Add new types in `server.js`
- **Categories**: Extend inventory categories as needed

---

**Ready to manage your hospital estate!** 🏥✨
