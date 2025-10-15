// Estate Management System - Frontend Application
class EstateManagementApp {
    constructor() {
        this.currentSection = 'dashboard';
        this.housingTypes = [];
        this.housingUnits = [];
        this.rooms = [];
        this.inventoryItems = [];
        this.employees = [];
        this.currentEditId = null;
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadInitialData();
        this.showSection('dashboard');
        this.updateDashboard();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                this.showSection(section);
            });
        });

        // Modal controls
        document.getElementById('modal-cancel').addEventListener('click', () => {
            this.closeModal();
        });
 
        const modalCloseBtn = document.querySelector('.modal-close');
        if (modalCloseBtn) {
            modalCloseBtn.addEventListener('click', () => {
                this.closeModal();
            });
        }

        document.getElementById('modal-overlay').addEventListener('click', (e) => {
            if (e.target.id === 'modal-overlay') {
                this.closeModal();
            }
        });

        // Add buttons
        document.getElementById('add-housing-btn').addEventListener('click', () => {
            this.showHousingModal();
        });

        document.getElementById('add-item-btn').addEventListener('click', () => {
            this.showInventoryModal();
        });

        document.getElementById('add-employee-btn').addEventListener('click', () => {
            this.showEmployeeModal();
        });

        // Search and filters
        document.getElementById('housing-search').addEventListener('input', (e) => {
            this.filterHousing(e.target.value);
        });

        document.getElementById('housing-type-filter').addEventListener('change', (e) => {
            this.filterHousingByType(e.target.value);
        });

        document.getElementById('inventory-search').addEventListener('input', (e) => {
            this.filterInventory(e.target.value);
        });

        document.getElementById('room-filter').addEventListener('change', (e) => {
            this.filterInventoryByRoom(e.target.value);
        });

        document.getElementById('employee-search').addEventListener('input', (e) => {
            this.filterEmployees(e.target.value);
        });
    }

    async loadInitialData() {
        try {
            const [housingTypes, housingUnits, rooms, inventoryItems, employees] = await Promise.all([
                this.fetchData('/api/housing-types'),
                this.fetchData('/api/housing-units'),
                this.fetchData('/api/rooms'),
                this.fetchData('/api/inventory'),
                this.fetchData('/api/employees')
            ]);

            this.housingTypes = housingTypes;
            this.housingUnits = housingUnits;
            this.rooms = rooms;
            this.inventoryItems = inventoryItems;
            this.employees = employees;

            this.populateHousingTypeFilter();
            this.populateRoomFilter();
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showNotification('Error loading data', 'error');
        }
    }

    async fetchData(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    }

    async postData(url, data) {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    }

    async putData(url, data) {
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    }

    async deleteData(url) {
        const response = await fetch(url, {
            method: 'DELETE'
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    }

    showSection(sectionName) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        // Show section
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionName).classList.add('active');

        this.currentSection = sectionName;

        // Load section-specific data
        switch (sectionName) {
            case 'dashboard':
                this.updateDashboard();
                break;
            case 'housing':
                this.renderHousingUnits();
                break;
            case 'inventory':
                this.renderInventoryItems();
                break;
            case 'employees':
                this.renderEmployees();
                break;
        }
    }

    async updateDashboard() {
        try {
            const stats = await this.fetchData('/api/dashboard/stats');
            
            document.getElementById('total-housing').textContent = stats.totalHousing;
            document.getElementById('total-rooms').textContent = stats.totalRooms;
            document.getElementById('total-items').textContent = stats.totalItems;
            document.getElementById('total-employees').textContent = stats.totalEmployees;

            this.renderRecentHousing();
            this.renderHousingChart();
        } catch (error) {
            console.error('Error updating dashboard:', error);
        }
    }

    renderRecentHousing() {
        const recentHousing = this.housingUnits.slice(0, 5);
        const container = document.getElementById('recent-housing');
        
        if (recentHousing.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-home"></i><h3>No housing units</h3><p>Add your first housing unit to get started</p></div>';
            return;
        }

        container.innerHTML = recentHousing.map(unit => `
            <div class="recent-item">
                <div class="recent-info">
                    <h4>${unit.name}</h4>
                    <p>${unit.type_name} • ${unit.address}</p>
                </div>
                <span class="status-badge status-${unit.status}">${unit.status}</span>
            </div>
        `).join('');
    }

    renderHousingChart() {
        const container = document.getElementById('housing-chart');
        const typeCounts = {};
        
        this.housingUnits.forEach(unit => {
            typeCounts[unit.type_name] = (typeCounts[unit.type_name] || 0) + 1;
        });

        if (Object.keys(typeCounts).length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-chart-pie"></i><h3>No data available</h3><p>Add housing units to see distribution</p></div>';
            return;
        }

        const chartData = Object.entries(typeCounts).map(([type, count]) => `
            <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #f8f9fa;">
                <span>${type}</span>
                <strong>${count}</strong>
            </div>
        `).join('');

        container.innerHTML = chartData;
    }

    renderHousingUnits() {
        const container = document.getElementById('housing-list');
        
        if (this.housingUnits.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-home"></i><h3>No housing units</h3><p>Add your first housing unit to get started</p></div>';
            return;
        }

        container.innerHTML = this.housingUnits.map(unit => `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">${unit.name}</h3>
                    <div class="card-actions">
                        <button class="btn" onclick="app.manageRooms('${unit.id}')">
                            <i class="fas fa-bed"></i> Rooms
                        </button>
                        <button class="btn btn-secondary" onclick="app.editHousing('${unit.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-danger" onclick="app.deleteHousing('${unit.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
                <div class="card-content">
                    <div class="card-item">
                        <span class="card-label">Type:</span>
                        <span class="card-value">${unit.type_name}</span>
                    </div>
                    <div class="card-item">
                        <span class="card-label">Address:</span>
                        <span class="card-value">${unit.address}</span>
                    </div>
                    <div class="card-item">
                        <span class="card-label">Capacity:</span>
                        <span class="card-value">${unit.capacity} people</span>
                    </div>
                    <div class="card-item">
                        <span class="card-label">Status:</span>
                        <span class="card-value">
                            <span class="status-badge status-${unit.status}">${unit.status}</span>
                        </span>
                    </div>
                    ${unit.description ? `
                    <div class="card-item">
                        <span class="card-label">Description:</span>
                        <span class="card-value">${unit.description}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    renderInventoryItems() {
        const container = document.getElementById('inventory-list');
        
        if (this.inventoryItems.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-boxes"></i><h3>No inventory items</h3><p>Add your first inventory item to get started</p></div>';
            return;
        }

        container.innerHTML = this.inventoryItems.map(item => `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">${item.name}</h3>
                    <div class="card-actions">
                        <button class="btn btn-secondary" onclick="app.editInventory('${item.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-danger" onclick="app.deleteInventory('${item.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
                <div class="card-content">
                    <div class="card-item">
                        <span class="card-label">Category:</span>
                        <span class="card-value">${item.category}</span>
                    </div>
                    <div class="card-item">
                        <span class="card-label">Quantity:</span>
                        <span class="card-value">${item.quantity}</span>
                    </div>
                    <div class="card-item">
                        <span class="card-label">Condition:</span>
                        <span class="card-value">
                            <span class="status-badge status-${item.condition}">${item.condition}</span>
                        </span>
                    </div>
                    <div class="card-item">
                        <span class="card-label">Location:</span>
                        <span class="card-value">${item.housing_unit_name} - Room ${item.room_number}</span>
                    </div>
                    ${item.description ? `
                    <div class="card-item">
                        <span class="card-label">Description:</span>
                        <span class="card-value">${item.description}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    renderEmployees() {
        const container = document.getElementById('employee-list');
        
        if (this.employees.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-users"></i><h3>No employees</h3><p>Add your first employee to get started</p></div>';
            return;
        }

        container.innerHTML = this.employees.map(employee => `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">${employee.name}</h3>
                    <div class="card-actions">
                        <button class="btn btn-secondary" onclick="app.editEmployee('${employee.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-danger" onclick="app.deleteEmployee('${employee.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
                <div class="card-content">
                    <div class="card-item">
                        <span class="card-label">Employee ID:</span>
                        <span class="card-value">${employee.employee_id}</span>
                    </div>
                    <div class="card-item">
                        <span class="card-label">Department:</span>
                        <span class="card-value">${employee.department}</span>
                    </div>
                    <div class="card-item">
                        <span class="card-label">Position:</span>
                        <span class="card-value">${employee.position}</span>
                    </div>
                    <div class="card-item">
                        <span class="card-label">Status:</span>
                        <span class="card-value">
                            <span class="status-badge status-${employee.status}">${employee.status}</span>
                        </span>
                    </div>
                    ${employee.assigned_room_id ? `
                    <div class="card-item">
                        <span class="card-label">Assigned Room:</span>
                        <span class="card-value">${employee.housing_unit_name} - Room ${employee.room_number}</span>
                    </div>
                    ` : ''}
                    ${employee.email ? `
                    <div class="card-item">
                        <span class="card-label">Email:</span>
                        <span class="card-value">${employee.email}</span>
                    </div>
                    ` : ''}
                    ${employee.phone ? `
                    <div class="card-item">
                        <span class="card-label">Phone:</span>
                        <span class="card-value">${employee.phone}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    showModal(title, content) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-body').innerHTML = content;
        document.getElementById('modal-overlay').classList.add('active');
    }

    closeModal() {
        document.getElementById('modal-overlay').classList.remove('active');
        this.currentEditId = null;
    }

    showHousingModal(unit = null) {
        const isEdit = unit !== null;
        const title = isEdit ? 'Edit Housing Unit' : 'Add Housing Unit';
        
        const content = `
            <form id="housing-form">
                <div class="form-group">
                    <label for="housing-name">Name *</label>
                    <input type="text" id="housing-name" value="${unit?.name || ''}" required>
                </div>
                
                <div class="form-group">
                    <label for="housing-type">Type *</label>
                    <select id="housing-type" required>
                        <option value="">Select housing type</option>
                        ${this.housingTypes.map(type => `
                            <option value="${type.id}" ${unit?.type_id === type.id ? 'selected' : ''}>${type.name}</option>
                        `).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="housing-address">Address *</label>
                    <input type="text" id="housing-address" value="${unit?.address || ''}" required>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="housing-capacity">Capacity</label>
                        <input type="number" id="housing-capacity" value="${unit?.capacity || 1}" min="1">
                    </div>
                    
                    <div class="form-group">
                        <label for="housing-status">Status</label>
                        <select id="housing-status">
                            <option value="available" ${unit?.status === 'available' ? 'selected' : ''}>Available</option>
                            <option value="occupied" ${unit?.status === 'occupied' ? 'selected' : ''}>Occupied</option>
                            <option value="maintenance" ${unit?.status === 'maintenance' ? 'selected' : ''}>Maintenance</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="housing-description">Description</label>
                    <textarea id="housing-description" rows="3">${unit?.description || ''}</textarea>
                </div>
            </form>
        `;
        
        this.showModal(title, content);
        
        document.getElementById('modal-save').onclick = () => {
            this.saveHousing(unit?.id);
        };
    }

    showInventoryModal(item = null) {
        const isEdit = item !== null;
        const title = isEdit ? 'Edit Inventory Item' : 'Add Inventory Item';
        
        const content = `
            <form id="inventory-form">
                <div class="form-group">
                    <label for="item-name">Name *</label>
                    <input type="text" id="item-name" value="${item?.name || ''}" required>
                </div>
                
                <div class="form-group">
                    <label for="item-room">Room *</label>
                    <select id="item-room" required>
                        <option value="">Select room</option>
                        ${this.rooms.map(room => `
                            <option value="${room.id}" ${item?.room_id === room.id ? 'selected' : ''}>
                                ${room.housing_unit_name} - Room ${room.room_number} (${room.room_type})
                            </option>
                        `).join('')}
                    </select>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="item-category">Category *</label>
                        <input type="text" id="item-category" value="${item?.category || ''}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="item-quantity">Quantity</label>
                        <input type="number" id="item-quantity" value="${item?.quantity || 1}" min="1">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="item-condition">Condition</label>
                    <select id="item-condition">
                        <option value="excellent" ${item?.condition === 'excellent' ? 'selected' : ''}>Excellent</option>
                        <option value="good" ${item?.condition === 'good' ? 'selected' : ''}>Good</option>
                        <option value="fair" ${item?.condition === 'fair' ? 'selected' : ''}>Fair</option>
                        <option value="poor" ${item?.condition === 'poor' ? 'selected' : ''}>Poor</option>
                        <option value="damaged" ${item?.condition === 'damaged' ? 'selected' : ''}>Damaged</option>
                    </select>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="item-purchase-date">Purchase Date</label>
                        <input type="date" id="item-purchase-date" value="${item?.purchase_date || ''}">
                    </div>
                    
                    <div class="form-group">
                        <label for="item-warranty">Warranty Expiry</label>
                        <input type="date" id="item-warranty" value="${item?.warranty_expiry || ''}">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="item-description">Description</label>
                    <textarea id="item-description" rows="3">${item?.description || ''}</textarea>
                </div>
            </form>
        `;
        
        this.showModal(title, content);
        
        document.getElementById('modal-save').onclick = () => {
            this.saveInventory(item?.id);
        };
    }

    showEmployeeModal(employee = null) {
        const isEdit = employee !== null;
        const title = isEdit ? 'Edit Employee' : 'Add Employee';
        
        const content = `
            <form id="employee-form">
                <div class="form-row">
                    <div class="form-group">
                        <label for="employee-id">Employee ID *</label>
                        <input type="text" id="employee-id" value="${employee?.employee_id || ''}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="employee-name">Name *</label>
                        <input type="text" id="employee-name" value="${employee?.name || ''}" required>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="employee-department">Department *</label>
                        <input type="text" id="employee-department" value="${employee?.department || ''}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="employee-position">Position *</label>
                        <input type="text" id="employee-position" value="${employee?.position || ''}" required>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="employee-email">Email</label>
                        <input type="email" id="employee-email" value="${employee?.email || ''}">
                    </div>
                    
                    <div class="form-group">
                        <label for="employee-phone">Phone</label>
                        <input type="tel" id="employee-phone" value="${employee?.phone || ''}">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="employee-room">Assigned Room</label>
                    <select id="employee-room">
                        <option value="">No room assigned</option>
                        ${this.rooms.map(room => `
                            <option value="${room.id}" ${employee?.assigned_room_id === room.id ? 'selected' : ''}>
                                ${room.housing_unit_name} - Room ${room.room_number} (${room.room_type})
                            </option>
                        `).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="employee-status">Status</label>
                    <select id="employee-status">
                        <option value="active" ${employee?.status === 'active' ? 'selected' : ''}>Active</option>
                        <option value="inactive" ${employee?.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                        <option value="on-leave" ${employee?.status === 'on-leave' ? 'selected' : ''}>On Leave</option>
                    </select>
                </div>
            </form>
        `;
        
        this.showModal(title, content);
        
        document.getElementById('modal-save').onclick = () => {
            this.saveEmployee(employee?.id);
        };
    }

    async saveHousing(id) {
        const form = document.getElementById('housing-form');
        const formData = new FormData(form);
        
        const data = {
            name: document.getElementById('housing-name').value,
            type_id: document.getElementById('housing-type').value,
            address: document.getElementById('housing-address').value,
            capacity: parseInt(document.getElementById('housing-capacity').value),
            status: document.getElementById('housing-status').value,
            description: document.getElementById('housing-description').value
        };

        try {
            if (id) {
                await this.putData(`/api/housing-units/${id}`, data);
                this.showNotification('Housing unit updated successfully', 'success');
            } else {
                await this.postData('/api/housing-units', data);
                this.showNotification('Housing unit added successfully', 'success');
            }
            
            this.closeModal();
            await this.loadInitialData();
            this.renderHousingUnits();
            this.updateDashboard();
        } catch (error) {
            console.error('Error saving housing unit:', error);
            this.showNotification('Error saving housing unit', 'error');
        }
    }

    async saveInventory(id) {
        const data = {
            name: document.getElementById('item-name').value,
            room_id: document.getElementById('item-room').value,
            category: document.getElementById('item-category').value,
            quantity: parseInt(document.getElementById('item-quantity').value),
            condition: document.getElementById('item-condition').value,
            description: document.getElementById('item-description').value,
            purchase_date: document.getElementById('item-purchase-date').value,
            warranty_expiry: document.getElementById('item-warranty').value
        };

        try {
            if (id) {
                await this.putData(`/api/inventory/${id}`, data);
                this.showNotification('Inventory item updated successfully', 'success');
            } else {
                await this.postData('/api/inventory', data);
                this.showNotification('Inventory item added successfully', 'success');
            }
            
            this.closeModal();
            await this.loadInitialData();
            this.renderInventoryItems();
            this.updateDashboard();
        } catch (error) {
            console.error('Error saving inventory item:', error);
            this.showNotification('Error saving inventory item', 'error');
        }
    }

    async saveEmployee(id) {
        const data = {
            employee_id: document.getElementById('employee-id').value,
            name: document.getElementById('employee-name').value,
            department: document.getElementById('employee-department').value,
            position: document.getElementById('employee-position').value,
            email: document.getElementById('employee-email').value,
            phone: document.getElementById('employee-phone').value,
            assigned_room_id: document.getElementById('employee-room').value || null,
            status: document.getElementById('employee-status').value
        };

        try {
            if (id) {
                await this.putData(`/api/employees/${id}`, data);
                this.showNotification('Employee updated successfully', 'success');
            } else {
                await this.postData('/api/employees', data);
                this.showNotification('Employee added successfully', 'success');
            }
            
            this.closeModal();
            await this.loadInitialData();
            this.renderEmployees();
            this.updateDashboard();
        } catch (error) {
            console.error('Error saving employee:', error);
            this.showNotification('Error saving employee', 'error');
        }
    }

    async editHousing(id) {
        const unit = this.housingUnits.find(u => u.id === id);
        if (unit) {
            this.showHousingModal(unit);
        }
    }

    async editInventory(id) {
        const item = this.inventoryItems.find(i => i.id === id);
        if (item) {
            this.showInventoryModal(item);
        }
    }

    async editEmployee(id) {
        const employee = this.employees.find(e => e.id === id);
        if (employee) {
            this.showEmployeeModal(employee);
        }
    }

    async deleteHousing(id) {
        if (confirm('Are you sure you want to delete this housing unit?')) {
            try {
                await this.deleteData(`/api/housing-units/${id}`);
                this.showNotification('Housing unit deleted successfully', 'success');
                await this.loadInitialData();
                this.renderHousingUnits();
                this.updateDashboard();
            } catch (error) {
                console.error('Error deleting housing unit:', error);
                this.showNotification('Error deleting housing unit', 'error');
            }
        }
    }

    async deleteInventory(id) {
        if (confirm('Are you sure you want to delete this inventory item?')) {
            try {
                await this.deleteData(`/api/inventory/${id}`);
                this.showNotification('Inventory item deleted successfully', 'success');
                await this.loadInitialData();
                this.renderInventoryItems();
                this.updateDashboard();
            } catch (error) {
                console.error('Error deleting inventory item:', error);
                this.showNotification('Error deleting inventory item', 'error');
            }
        }
    }

    async deleteEmployee(id) {
        if (confirm('Are you sure you want to delete this employee?')) {
            try {
                await this.deleteData(`/api/employees/${id}`);
                this.showNotification('Employee deleted successfully', 'success');
                await this.loadInitialData();
                this.renderEmployees();
                this.updateDashboard();
            } catch (error) {
                console.error('Error deleting employee:', error);
                this.showNotification('Error deleting employee', 'error');
            }
        }
    }

    async manageRooms(housingUnitId) {
        try {
            const rooms = await this.fetchData(`/api/rooms?housing_unit_id=${housingUnitId}`);
            this._roomsForUnit = rooms;
            this._roomsForUnitId = housingUnitId;
            const unit = this.housingUnits.find(u => u.id === housingUnitId);
            const title = `Manage Rooms • ${unit ? unit.name : ''}`;

            const rowsHtml = rooms.map(room => `
                <tr>
                    <td>${room.room_number}</td>
                    <td>${room.room_type}</td>
                    <td>${room.capacity}</td>
                    <td><span class="status-badge status-${room.status}">${room.status}</span></td>
                    <td>
                        <button class="btn btn-success" onclick="app.addInventoryForRoom('${room.id}')"><i class="fas fa-plus"></i> Item</button>
                        <button class="btn btn-secondary" onclick="app.showRoomForm('${housingUnitId}', '${room.id}')"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-danger" onclick="app.deleteRoom('${room.id}', '${housingUnitId}')"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `).join('');

            const content = `
                <div style="display:flex; justify-content: space-between; align-items:center; margin-bottom: 1rem;">
                    <div>
                        <button class="btn btn-primary" onclick="app.showRoomForm('${housingUnitId}')"><i class="fas fa-plus"></i> Add Room</button>
                    </div>
                </div>
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Room #</th>
                                <th>Type</th>
                                <th>Capacity</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml || '<tr><td colspan="5" style="text-align:center; padding:1rem;">No rooms yet</td></tr>'}
                        </tbody>
                    </table>
                </div>
            `;

            this.showModal(title, content);
            document.getElementById('modal-save').onclick = () => {
                this.closeModal();
            };
        } catch (error) {
            console.error('Error loading rooms:', error);
            this.showNotification('Error loading rooms', 'error');
        }
    }

    showRoomForm(housingUnitId, roomId = null) {
        const unitName = this.housingUnits.find(u => u.id === housingUnitId)?.name || '';
        const room = roomId ? (this._roomsForUnit || []).find(r => r.id === roomId) : null;
        const title = (room ? 'Edit Room • ' : 'Add Room • ') + unitName;
        const content = `
            <form id="room-form">
                <div class="form-row">
                    <div class="form-group">
                        <label for="room-number">Room Number *</label>
                        <input type="text" id="room-number" value="${room ? room.room_number : ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="room-type">Room Type *</label>
                        <select id="room-type" required>
                            <option value="">Select type</option>
                            <option value="single" ${room && room.room_type === 'single' ? 'selected' : ''}>Single</option>
                            <option value="double" ${room && room.room_type === 'double' ? 'selected' : ''}>Double</option>
                            <option value="triple" ${room && room.room_type === 'triple' ? 'selected' : ''}>Triple</option>
                            <option value="studio" ${room && room.room_type === 'studio' ? 'selected' : ''}>Studio</option>
                            <option value="1BHK" ${room && room.room_type === '1BHK' ? 'selected' : ''}>1BHK</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="room-capacity">Capacity</label>
                        <input type="number" id="room-capacity" value="${room ? room.capacity : 1}" min="1">
                    </div>
                    <div class="form-group">
                        <label for="room-status">Status</label>
                        <select id="room-status">
                            <option value="available" ${room && room.status === 'available' ? 'selected' : ''}>Available</option>
                            <option value="occupied" ${room && room.status === 'occupied' ? 'selected' : ''}>Occupied</option>
                            <option value="maintenance" ${room && room.status === 'maintenance' ? 'selected' : ''}>Maintenance</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label for="room-description">Description</label>
                    <textarea id="room-description" rows="3">${room ? (room.description || '') : ''}</textarea>
                </div>
            </form>
        `;

        this.showModal(title, content);
        document.getElementById('modal-save').onclick = () => {
            this.saveRoom(housingUnitId, room ? room.id : null);
        };
    }

    async saveRoom(housingUnitId, roomId = null) {
        const data = {
            housing_unit_id: housingUnitId,
            room_number: document.getElementById('room-number').value,
            room_type: document.getElementById('room-type').value,
            capacity: parseInt(document.getElementById('room-capacity').value),
            status: document.getElementById('room-status').value,
            description: document.getElementById('room-description').value
        };

        try {
            if (roomId) {
                const { housing_unit_id, ...update } = data;
                await this.putData(`/api/rooms/${roomId}`, update);
                this.showNotification('Room updated successfully', 'success');
            } else {
                await this.postData('/api/rooms', data);
                this.showNotification('Room added successfully', 'success');
            }

            await this.loadInitialData();
            this.manageRooms(housingUnitId);
            this.updateDashboard();
        } catch (error) {
            console.error('Error saving room:', error);
            this.showNotification('Error saving room', 'error');
        }
    }

    async deleteRoom(roomId, housingUnitId) {
        if (confirm('Are you sure you want to delete this room?')) {
            try {
                await this.deleteData(`/api/rooms/${roomId}`);
                this.showNotification('Room deleted successfully', 'success');
                await this.loadInitialData();
                this.manageRooms(housingUnitId);
                this.updateDashboard();
            } catch (error) {
                console.error('Error deleting room:', error);
                this.showNotification('Error deleting room', 'error');
            }
        }
    }

    addInventoryForRoom(roomId) {
        // Open inventory modal and preselect the room
        this.showInventoryModal();
        const roomSelect = document.getElementById('item-room');
        if (roomSelect) {
            roomSelect.value = roomId;
            roomSelect.disabled = true;
        }
        // When saving, re-enable to avoid leaving disabled state for next open
        const modalSave = document.getElementById('modal-save');
        const cleanup = () => {
            if (roomSelect) roomSelect.disabled = false;
            modalSave && modalSave.removeEventListener('click', cleanup);
        };
        if (modalSave) {
            modalSave.addEventListener('click', cleanup);
        }
    }

    populateRoomFilter() {
        const roomFilter = document.getElementById('room-filter');
        const rooms = this.rooms.map(room => `
            <option value="${room.id}">${room.housing_unit_name} - Room ${room.room_number}</option>
        `).join('');
        
        roomFilter.innerHTML = '<option value="">All Rooms</option>' + rooms;
    }

    populateHousingTypeFilter() {
        const typeFilter = document.getElementById('housing-type-filter');
        if (!typeFilter) return;
        const options = this.housingTypes.map(t => `
            <option value="${t.id}">${t.name}</option>
        `).join('');
        typeFilter.innerHTML = '<option value="">All Types</option>' + options;
    }

    filterHousing(searchTerm) {
        const filtered = this.housingUnits.filter(unit => 
            unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            unit.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
            unit.type_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        this.renderFilteredHousing(filtered);
    }

    filterHousingByType(typeId) {
        if (!typeId) {
            this.renderHousingUnits();
            return;
        }
        
        const filtered = this.housingUnits.filter(unit => unit.type_id === typeId);
        this.renderFilteredHousing(filtered);
    }

    renderFilteredHousing(units) {
        const container = document.getElementById('housing-list');
        
        if (units.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><h3>No housing units found</h3><p>Try adjusting your search criteria</p></div>';
            return;
        }

        container.innerHTML = units.map(unit => `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">${unit.name}</h3>
                    <div class="card-actions">
                        <button class="btn" onclick="app.manageRooms('${unit.id}')">
                            <i class="fas fa-bed"></i> Rooms
                        </button>
                        <button class="btn btn-secondary" onclick="app.editHousing('${unit.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-danger" onclick="app.deleteHousing('${unit.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
                <div class="card-content">
                    <div class="card-item">
                        <span class="card-label">Type:</span>
                        <span class="card-value">${unit.type_name}</span>
                    </div>
                    <div class="card-item">
                        <span class="card-label">Address:</span>
                        <span class="card-value">${unit.address}</span>
                    </div>
                    <div class="card-item">
                        <span class="card-label">Capacity:</span>
                        <span class="card-value">${unit.capacity} people</span>
                    </div>
                    <div class="card-item">
                        <span class="card-label">Status:</span>
                        <span class="card-value">
                            <span class="status-badge status-${unit.status}">${unit.status}</span>
                        </span>
                    </div>
                    ${unit.description ? `
                    <div class="card-item">
                        <span class="card-label">Description:</span>
                        <span class="card-value">${unit.description}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    filterInventory(searchTerm) {
        const filtered = this.inventoryItems.filter(item => 
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.housing_unit_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        this.renderFilteredInventory(filtered);
    }

    filterInventoryByRoom(roomId) {
        if (!roomId) {
            this.renderInventoryItems();
            return;
        }
        
        const filtered = this.inventoryItems.filter(item => item.room_id === roomId);
        this.renderFilteredInventory(filtered);
    }

    renderFilteredInventory(items) {
        const container = document.getElementById('inventory-list');
        
        if (items.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><h3>No inventory items found</h3><p>Try adjusting your search criteria</p></div>';
            return;
        }

        container.innerHTML = items.map(item => `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">${item.name}</h3>
                    <div class="card-actions">
                        <button class="btn btn-secondary" onclick="app.editInventory('${item.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-danger" onclick="app.deleteInventory('${item.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
                <div class="card-content">
                    <div class="card-item">
                        <span class="card-label">Category:</span>
                        <span class="card-value">${item.category}</span>
                    </div>
                    <div class="card-item">
                        <span class="card-label">Quantity:</span>
                        <span class="card-value">${item.quantity}</span>
                    </div>
                    <div class="card-item">
                        <span class="card-label">Condition:</span>
                        <span class="card-value">
                            <span class="status-badge status-${item.condition}">${item.condition}</span>
                        </span>
                    </div>
                    <div class="card-item">
                        <span class="card-label">Location:</span>
                        <span class="card-value">${item.housing_unit_name} - Room ${item.room_number}</span>
                    </div>
                    ${item.description ? `
                    <div class="card-item">
                        <span class="card-label">Description:</span>
                        <span class="card-value">${item.description}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    filterEmployees(searchTerm) {
        const filtered = this.employees.filter(employee => 
            employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            employee.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            employee.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
            employee.position.toLowerCase().includes(searchTerm.toLowerCase())
        );
        this.renderFilteredEmployees(filtered);
    }

    renderFilteredEmployees(employees) {
        const container = document.getElementById('employee-list');
        
        if (employees.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><h3>No employees found</h3><p>Try adjusting your search criteria</p></div>';
            return;
        }

        container.innerHTML = employees.map(employee => `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">${employee.name}</h3>
                    <div class="card-actions">
                        <button class="btn btn-secondary" onclick="app.editEmployee('${employee.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-danger" onclick="app.deleteEmployee('${employee.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
                <div class="card-content">
                    <div class="card-item">
                        <span class="card-label">Employee ID:</span>
                        <span class="card-value">${employee.employee_id}</span>
                    </div>
                    <div class="card-item">
                        <span class="card-label">Department:</span>
                        <span class="card-value">${employee.department}</span>
                    </div>
                    <div class="card-item">
                        <span class="card-label">Position:</span>
                        <span class="card-value">${employee.position}</span>
                    </div>
                    <div class="card-item">
                        <span class="card-label">Status:</span>
                        <span class="card-value">
                            <span class="status-badge status-${employee.status}">${employee.status}</span>
                        </span>
                    </div>
                    ${employee.assigned_room_id ? `
                    <div class="card-item">
                        <span class="card-label">Assigned Room:</span>
                        <span class="card-value">${employee.housing_unit_name} - Room ${employee.room_number}</span>
                    </div>
                    ` : ''}
                    ${employee.email ? `
                    <div class="card-item">
                        <span class="card-label">Email:</span>
                        <span class="card-value">${employee.email}</span>
                    </div>
                    ` : ''}
                    ${employee.phone ? `
                    <div class="card-item">
                        <span class="card-label">Phone:</span>
                        <span class="card-value">${employee.phone}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Add styles if not already added
        if (!document.getElementById('notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 1rem 1.5rem;
                    border-radius: 8px;
                    color: white;
                    font-weight: 500;
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    animation: slideIn 0.3s ease;
                }
                .notification-success { background: #27ae60; }
                .notification-error { background: #e74c3c; }
                .notification-info { background: #3498db; }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(styles);
        }
        
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new EstateManagementApp();
});
