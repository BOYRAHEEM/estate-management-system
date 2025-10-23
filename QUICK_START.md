# HTH Estate Management - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Installation
```bash
# 1. Install dependencies
npm install

# 2. Create database
mysql -u root -p
CREATE DATABASE hospital_estate;
exit;

# 3. Initialize database
node sample-data.js

# 4. Start server
npm start
```

### Access the Application
Open your browser and navigate to: **http://localhost:3000**

### Default Login Credentials

**Super Admin:**
```
Username: superadmin
Password: admin123
```

**Regular Admin:**
```
Username: test
Password: admin123
```

⚠️ **Change these passwords immediately after first login!**

## 📋 Quick Feature Overview

### For Super Admins

**User Management:**
- Burger menu (☰) → User Management
- Create, edit, delete users
- Reset passwords

**Full Access:**
- All inventory operations (including delete)
- View damage reports page
- System settings

### For Regular Admins

**Daily Tasks:**
- Manage housing units and rooms
- Add/edit inventory items
- Report damaged items
- Assign employees to rooms
- Generate PDF reports

## 🎯 Common Tasks

### Add a New Housing Unit
1. Click **"Housing Units"**
2. Click **"+ Add Housing Unit"**
3. Fill in: Name, Address, Type, Total Rooms
4. Click **"Save"**

### Add Inventory to a Room
1. Go to **"Inventory"**
2. Expand the room section
3. Click **"Add item"** button
4. Fill in item details
5. Click **"Save"** (or "Save & Add Another")

### Report Damage
1. Find item in **"Inventory"**
2. Click three dots (⋮) → **"Report Damage"**
3. Select damage type and severity
4. Add description
5. Submit

### Generate a Report
1. Click **"Generate Reports"**
2. Select report type:
   - Full Report
   - Rooms Only
   - Inventory Only
   - Damage Reports Only (styled)
3. Choose housing unit
4. Click **"Generate"**

## 🔑 Keyboard Shortcuts

- `Esc` - Close modal/dialog
- `Enter` - Submit form (when focused)
- `Ctrl + Shift + R` - Hard refresh (clear cache)

## 📊 Understanding the Dashboard

**Key Metrics:**
- **Compliance Rate** - Overall system health
- **Total Rooms** - Number of rooms in system
- **Total Inventory** - Number of items tracked
- **Damage Reports** - Active damage reports

**Color Codes:**
- 🟢 Green - Good/Resolved
- 🟠 Orange - Moderate/In Progress
- 🔴 Red - Severe/Pending

## ⚠️ Common Issues

### "Changes not showing?"
**Solution:** Hard refresh your browser
- Chrome/Edge: `Ctrl + Shift + R`
- Firefox: `Ctrl + F5`

### "Can't delete inventory item?"
**Solution:** Only Super Admins can delete inventory items. Regular admins can only edit.

### "Already Reported" message?
**Solution:** Item has an active damage report. Wait for it to be resolved before reporting again.

### "Room already assigned" error?
**Solution:** Room is already occupied. Choose a different room or unassign the current occupant.

## 📞 Need Help?

Check the full [README.md](README.md) for detailed documentation.

**Contact:**  
Developer: A. Rahim  
Email: boyraheem@icloud.com

---

**Quick Tips:**
- Always use hard refresh after server updates
- Super admins: Use burger menu (☰) for admin tools
- Regular admins: Focus on inventory and damage reporting
- Generate reports regularly for recordkeeping
- Change default passwords immediately!
