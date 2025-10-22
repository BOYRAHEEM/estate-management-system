// Estate Management System - Frontend Application
class EstateManagementApp {
    constructor() {
        this.currentSection = 'dashboard';
        this.housingTypes = [];
        this.housingUnits = [];
        this.rooms = [];
        this.inventoryItems = [];
        this.employees = [];
        this.users = [];
        this.damageReports = [];
        this.currentEditId = null;
        this.currentUser = null;
        this.isAuthenticated = false;
        this.activityLog = [];
        this.loginHistory = [];
        
        this.init();
    }

    // Activity Logging Methods
    logActivity(action, details = '', category = 'general') {
        const activity = {
            id: Date.now() + Math.random(),
            timestamp: new Date(),
            user: this.currentUser ? this.currentUser.username : 'Unknown',
            action: action,
            details: details,
            category: category,
            ip: '127.0.0.1' // In a real app, this would be the actual IP
        };
        
        this.activityLog.unshift(activity);
        
        // Keep only last 100 activities
        if (this.activityLog.length > 100) {
            this.activityLog = this.activityLog.slice(0, 100);
        }
        
        // Save to localStorage
        this.saveActivityLog();
        
        // Update UI if activity log is currently visible
        if (document.getElementById('activity-log-form').style.display === 'block') {
            this.renderActivityLog();
        }
        
        console.log('Activity logged:', activity);
    }

    saveActivityLog() {
        try {
            localStorage.setItem('activityLog', JSON.stringify(this.activityLog));
        } catch (error) {
            console.error('Error saving activity log:', error);
        }
    }

    loadActivityLog() {
        try {
            const stored = localStorage.getItem('activityLog');
            if (stored) {
                this.activityLog = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading activity log:', error);
            this.activityLog = [];
        }
    }

    logLogin(username, success = true) {
        const login = {
            id: Date.now() + Math.random(),
            timestamp: new Date(),
            username: username,
            success: success,
            ip: '127.0.0.1'
        };
        
        this.loginHistory.unshift(login);
        
        // Keep only last 50 logins
        if (this.loginHistory.length > 50) {
            this.loginHistory = this.loginHistory.slice(0, 50);
        }
        
        // Save to localStorage
        this.saveLoginHistory();
        
        console.log('Login logged:', login);
    }

    saveLoginHistory() {
        try {
            localStorage.setItem('loginHistory', JSON.stringify(this.loginHistory));
        } catch (error) {
            console.error('Error saving login history:', error);
        }
    }

    loadLoginHistory() {
        try {
            const stored = localStorage.getItem('loginHistory');
            if (stored) {
                this.loginHistory = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading login history:', error);
            this.loginHistory = [];
        }
    }

    renderLoginHistory() {
        const loginHistoryList = document.getElementById('login-history-list');
        const totalLogins = document.getElementById('total-logins');
        const lastLogin = document.getElementById('last-login');
        
        if (!loginHistoryList) return;
        
        if (this.loginHistory.length === 0) {
            loginHistoryList.innerHTML = '<p class="empty-state">No login history available</p>';
            return;
        }
        
        loginHistoryList.innerHTML = this.loginHistory.map(login => `
            <div class="login-history-item">
                <div class="login-date">${this.formatTime(login.timestamp)}</div>
                <div class="login-ip">${login.ip}</div>
                <div class="login-status status-${login.success ? 'success' : 'failed'}">${login.success ? 'Success' : 'Failed'}</div>
            </div>
        `).join('');
        
        if (totalLogins) {
            totalLogins.textContent = this.loginHistory.length;
        }
        
        if (lastLogin) {
            const lastLoginEntry = this.loginHistory.find(login => login.success);
            lastLogin.textContent = lastLoginEntry ? this.formatTime(lastLoginEntry.timestamp) : 'Never';
        }
    }

    async init() {
        try {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }
            
            // Setup event listeners safely
            this.setupEventListeners();
            
            // Load activity logs
            this.loadActivityLog();
            this.loadLoginHistory();
            
            // Check authentication first before showing any UI
            await this.checkAuthentication();
            
            if (this.isAuthenticated) {
                // Show main app if authenticated
                this.showMainApp();
                await this.loadInitialData();
                this.showSection('dashboard');
                this.updateDashboard();
            } else {
                // Show login page only if not authenticated
                this.showLoginPage();
            }
        } catch (error) {
            console.error('Error during app initialization:', error);
            // Show login page on error
            this.showLoginPage();
        }
    }

    setupEventListeners() {
        try {
            // Login form
            const loginForm = document.getElementById('login-form');
            if (loginForm) {
                loginForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleLogin();
                });
            }
        } catch (error) {
            console.error('Error setting up login form listener:', error);
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }

        // Profile form handlers
        const usernameForm = document.getElementById('username-form');
        if (usernameForm) {
            usernameForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateUsername();
            });
        }

        const passwordForm = document.getElementById('password-form');
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updatePassword();
            });
        }

        // System settings form
        const systemSettingsForm = document.getElementById('system-settings-form-content');
        if (systemSettingsForm) {
            systemSettingsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveSystemSettings();
            });
        }

        // Security settings form
        const securitySettingsForm = document.getElementById('security-settings-form-content');
        if (securitySettingsForm) {
            securitySettingsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveSecuritySettings();
            });
        }

        // Activity log filters
        const activityFilter = document.getElementById('activity-filter');
        if (activityFilter) {
            activityFilter.addEventListener('change', () => {
                this.renderActivityLog();
            });
        }

        const activityDateFilter = document.getElementById('activity-date-filter');
        if (activityDateFilter) {
            activityDateFilter.addEventListener('change', () => {
                this.renderActivityLog();
            });
        }

        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                this.showSection(section);
            });
        });

        // Stat cards navigation
        document.querySelectorAll('.stat-card[data-nav]').forEach(card => {
            card.addEventListener('click', (e) => {
                const target = e.currentTarget.getAttribute('data-nav');
                if (target) this.showSection(target);
            });
        });

        // Inventory view toggle buttons
        const gridViewBtn = document.getElementById('grid-view-btn');
        const listViewBtn = document.getElementById('list-view-btn');
        
        if (gridViewBtn && listViewBtn) {
            gridViewBtn.addEventListener('click', () => {
                this.setInventoryView('grid');
            });
            
            listViewBtn.addEventListener('click', () => {
                this.setInventoryView('list');
            });
        }

        // Inventory filters
        const roomFilter = document.getElementById('room-filter');
        const categoryFilter = document.getElementById('category-filter');
        
        const inventorySearch = document.getElementById('inventory-search');

        if (roomFilter) {
            roomFilter.addEventListener('change', () => this.filterInventory());
        }
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => this.filterInventory());
        }
        
        if (inventorySearch) {
            inventorySearch.addEventListener('input', () => this.filterInventory());
        }

        // Housing filters
        const housingTypeFilter = document.getElementById('housing-type-filter');
        const housingSearch = document.getElementById('housing-search');

        if (housingTypeFilter) {
            housingTypeFilter.addEventListener('change', () => this.filterHousing());
        }
        if (housingSearch) {
            housingSearch.addEventListener('input', () => this.filterHousing());
        }

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

        // PDF Report Generation
        const generatePdfBtn = document.getElementById('generate-pdf-report-btn');
        if (generatePdfBtn) {
			generatePdfBtn.addEventListener('click', () => {
				this.openReportOptions();
			});
        }

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

        const roomSearch = document.getElementById('room-search');
        if (roomSearch) {
            roomSearch.addEventListener('input', (e) => {
                this.filterInventoryByRoomSearch(e.target.value);
            });
        }


        document.getElementById('employee-search').addEventListener('input', (e) => {
            this.filterEmployees(e.target.value);
        });

        // Dashboard controls
        // (Dashboard type filter removed)

        // User management
        const addUserBtn = document.getElementById('add-user-btn');
        if (addUserBtn) {
            addUserBtn.addEventListener('click', () => {
                this.showUserModal();
            });
        }

        // Burger menu
        const burgerToggle = document.getElementById('burger-toggle');
        const burgerDropdown = document.getElementById('burger-dropdown');
        console.log('Burger toggle element:', burgerToggle);
        console.log('Burger dropdown element:', burgerDropdown);
        
        if (burgerToggle && burgerDropdown) {
            burgerToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('Burger toggle clicked');
                this.toggleBurgerMenu();
            });

            // Close burger menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!burgerToggle.contains(e.target) && !burgerDropdown.contains(e.target)) {
                    this.closeBurgerMenu();
                }
            });
        } else {
            console.error('Burger menu elements not found!');
        }
    }

    // Authentication Methods
    async checkAuthentication() {
        try {
            const response = await fetch('/api/auth/me', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.user;
                this.isAuthenticated = true;
                this.updateUserInterface();
                return true;
            } else {
                this.isAuthenticated = false;
                return false;
            }
        } catch (error) {
            console.error('Authentication check failed:', error);
            this.isAuthenticated = false;
            return false;
        }
    }

    async handleLogin() {
        console.log('=== LOGIN ATTEMPT ===');
        const usernameField = document.getElementById('username');
        const passwordField = document.getElementById('password');
        
        console.log('Username field found:', !!usernameField);
        console.log('Password field found:', !!passwordField);
        
        if (!usernameField || !passwordField) {
            console.error('Login form fields not found!');
            this.showNotification('Login form fields not found. Please refresh the page.', 'error');
            return;
        }
        
        const username = usernameField.value;
        const password = passwordField.value;

        console.log('Login attempt:', { username, password: password ? 'provided' : 'missing' });

        if (!username || !password) {
            this.showNotification('Please enter both username and password', 'error');
            return;
        }

        try {
            console.log('Sending login request...');
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ username, password })
            });

            console.log('Login response status:', response.status);
            console.log('Login response ok:', response.ok);

            if (response.ok) {
                const data = await response.json();
                console.log('Login successful, user data:', data);
                this.currentUser = data.user;
                this.isAuthenticated = true;
                this.updateUserInterface();
                this.showMainApp();
                this.showNotification('Login successful!', 'success');
                
                // Log successful login
                this.logLogin(username, true);
                this.logActivity('User Login', `User ${username} logged in successfully`, 'authentication');
                
                // Load data after successful login
                await this.loadInitialData();
                this.showSection('dashboard');
                this.updateDashboard();
            } else {
                const errorData = await response.json();
                console.log('Login failed, error data:', errorData);
                this.showNotification(errorData.error || 'Login failed', 'error');
                
                // Log failed login
                this.logLogin(username, false);
                this.logActivity('Failed Login', `Failed login attempt for ${username}`, 'authentication');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showNotification('Login failed. Please try again.', 'error');
            
            // Log login error
            this.logLogin(username, false);
            this.logActivity('Login Error', `Login error for ${username}: ${error.message}`, 'authentication');
        }
    }


    async handleLogout() {
        try {
            // Log logout before clearing user data
            if (this.currentUser) {
                this.logActivity('User Logout', `User ${this.currentUser.username} logged out`, 'authentication');
            }
            
            await fetch('/api/logout', {
                method: 'POST',
                credentials: 'include'
            });
            
            this.isAuthenticated = false;
            this.currentUser = null;
            this.showLoginPage();
            this.showNotification('Logged out successfully', 'success');
        } catch (error) {
            console.error('Logout error:', error);
            this.showNotification('Logout failed', 'error');
            this.logActivity('Logout Error', `Logout error: ${error.message}`, 'authentication');
        }
    }

    showLoginPage() {
        // Show login page
        document.getElementById('login-page').classList.remove('hidden');
        document.getElementById('login-page').style.display = 'block';
        document.getElementById('login-page').classList.add('visible');
        
        // Hide app completely
        document.getElementById('app').classList.add('hidden');
        document.getElementById('app').style.display = 'none';
        document.getElementById('app').classList.remove('loaded', 'visible');
    }

    showMainApp() {
        document.getElementById('login-page').classList.add('hidden');
        document.getElementById('login-page').classList.remove('visible');
        // Force show the app by setting display style directly
        document.getElementById('app').style.display = 'block';
        document.getElementById('app').classList.add('loaded', 'visible');
    }

    updateUserInterface() {
        if (this.currentUser) {
            // Update user info in header (if elements exist)
            const userNameElement = document.getElementById('user-name');
            const userRoleElement = document.getElementById('user-role-badge');
            
            if (userNameElement) {
                userNameElement.textContent = this.currentUser.full_name;
            }
            if (userRoleElement) {
                userRoleElement.textContent = this.currentUser.role.replace('_', ' ');
            }
            
            // Show/hide elements based on role
            const superAdminElements = document.querySelectorAll('.super-admin-only');
            superAdminElements.forEach(element => {
                if (this.currentUser.role === 'super_admin') {
                    element.classList.add('show');
                    element.style.display = '';
                } else {
                    element.classList.remove('show');
                    element.style.display = 'none';
                }
            });
        }
    }

    toggleBurgerMenu() {
        const burgerToggle = document.getElementById('burger-toggle');
        const burgerDropdown = document.getElementById('burger-dropdown');
        
        console.log('Toggle burger menu called');
        console.log('Burger toggle:', burgerToggle);
        console.log('Burger dropdown:', burgerDropdown);
        
        if (burgerToggle && burgerDropdown) {
            const isActive = burgerDropdown.classList.contains('active');
            console.log('Is active:', isActive);
            
            if (isActive) {
                console.log('Closing burger menu');
                this.closeBurgerMenu();
            } else {
                console.log('Opening burger menu');
                this.openBurgerMenu();
            }
        } else {
            console.error('Burger menu elements not found in toggle function!');
        }
    }

    openBurgerMenu() {
        const burgerToggle = document.getElementById('burger-toggle');
        const burgerDropdown = document.getElementById('burger-dropdown');
        
        console.log('Opening burger menu');
        if (burgerToggle && burgerDropdown) {
            burgerToggle.classList.add('active');
            burgerDropdown.classList.add('active');
            console.log('Classes added - toggle:', burgerToggle.classList.contains('active'), 'dropdown:', burgerDropdown.classList.contains('active'));
        } else {
            console.error('Elements not found in openBurgerMenu');
        }
    }

    closeBurgerMenu() {
        const burgerToggle = document.getElementById('burger-toggle');
        const burgerDropdown = document.getElementById('burger-dropdown');
        
        console.log('Closing burger menu');
        if (burgerToggle && burgerDropdown) {
            burgerToggle.classList.remove('active');
            burgerDropdown.classList.remove('active');
            console.log('Classes removed');
        } else {
            console.error('Elements not found in closeBurgerMenu');
        }
    }

    async loadInitialData() {
        try {
            console.log('Loading initial data...');
            
            // Load data one by one to identify which fails
            console.log('Fetching housing types...');
            const housingTypes = await this.fetchData('/api/housing-types');
            console.log('Housing types loaded:', housingTypes.length);
            
            console.log('Fetching housing units...');
            const housingUnits = await this.fetchData('/api/housing-units');
            console.log('Housing units loaded:', housingUnits.length);
            
            console.log('Fetching rooms...');
            const rooms = await this.fetchData('/api/rooms');
            console.log('Rooms loaded:', rooms.length);
            
            console.log('Fetching inventory...');
            const inventoryItems = await this.fetchData('/api/inventory');
            console.log('Inventory items loaded:', inventoryItems.length);
            
            console.log('Fetching employees...');
            const employees = await this.fetchData('/api/employees');
            console.log('Employees loaded:', employees.length);

            this.housingTypes = housingTypes;
            this.housingUnits = housingUnits;
            this.rooms = rooms;
            this.inventoryItems = inventoryItems;
            this.employees = employees;

            // Load damage reports for super admins to update notification badge
            if (this.currentUser && this.currentUser.role === 'super_admin') {
                console.log('Fetching damage reports...');
                await this.loadDamageReports();
            }

            this.populateHousingTypeFilter();
            this.populateRoomFilter();
            console.log('Initial data loaded successfully');
        } catch (error) {
            console.error('Error loading initial data:', error);
            console.error('Error details:', error.message, error.stack);
            this.showNotification(`Error loading data: ${error.message}`, 'error');
        }
    }

    async fetchData(url) {
        const response = await fetch(url, {
            credentials: 'include'
        });
        if (!response.ok) {
            if (response.status === 401) {
                this.isAuthenticated = false;
                this.showLoginPage();
                throw new Error('Authentication required');
            }
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
            credentials: 'include',
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            if (response.status === 401) {
                this.isAuthenticated = false;
                this.showLoginPage();
                throw new Error('Authentication required');
            }
            // Try to extract error message from response
            try {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            } catch (e) {
                if (e.message && e.message !== 'Authentication required') {
                    throw e;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        }
        return await response.json();
    }

    async putData(url, data) {
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            if (response.status === 401) {
                this.isAuthenticated = false;
                this.showLoginPage();
                throw new Error('Authentication required');
            }
            // Try to extract error message from response
            try {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            } catch (e) {
                if (e.message && e.message !== 'Authentication required') {
                    throw e;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        }
        return await response.json();
    }

    async deleteData(url) {
        const response = await fetch(url, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (!response.ok) {
            if (response.status === 401) {
                this.isAuthenticated = false;
                this.showLoginPage();
                throw new Error('Authentication required');
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    }

    async showSection(sectionName) {
        // Normalize deprecated section names
        if (sectionName === 'users') {
            sectionName = 'user-management';
        }
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
                this.renderEmployeeList();
                break;
            case 'damage-reports':
                if (this.currentUser && this.currentUser.role === 'super_admin') {
                    this.loadDamageReports();
                } else {
                    this.showNotification('Access denied. Super Admin role required.', 'error');
                    this.showSection('dashboard');
                    return;
                }
                break;
        case 'profile':
            await this.loadProfile();
            break;
        case 'user-management':
            await this.loadUserManagement();
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
        const recentHousing = this.housingUnits.slice(0, 10);
        const container = document.getElementById('recent-housing');
        
        if (recentHousing.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-home"></i><h3>No housing units</h3><p>Add your first housing unit to get started</p></div>';
            return;
        }

        container.innerHTML = recentHousing.map(unit => `
            <div class="recent-item">
                <div class="recent-info">
                    <h4>${unit.name}</h4>
                    <p>${unit.type_name || 'Unknown Type'} • ${unit.address || 'No Address'}</p>
                </div>
                <span class="status-badge status-${unit.status}">${unit.status}</span>
            </div>
        `).join('');
    }

    renderHousingChart() {
        const container = document.getElementById('housing-chart');
        
        // Calculate room occupancy statistics
        const roomStats = {
            total: this.rooms.length,
            occupied: 0,
            available: 0,
            maintenance: 0
        };
        
        // Count rooms by status
        this.rooms.forEach(room => {
            if (room.status === 'occupied') {
                roomStats.occupied++;
            } else if (room.status === 'available') {
                roomStats.available++;
            } else if (room.status === 'maintenance') {
                roomStats.maintenance++;
            }
        });

        if (roomStats.total === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-home"></i><h3>No room data</h3><p>Add rooms to see occupancy statistics</p></div>';
            return;
        }

        // Calculate percentages
        const occupiedPct = Math.round((roomStats.occupied / roomStats.total) * 100);
        const availablePct = Math.round((roomStats.available / roomStats.total) * 100);
        const maintenancePct = Math.round((roomStats.maintenance / roomStats.total) * 100);

        // Define status colors and labels
        const statusConfig = {
            'occupied': { color: '#e74c3c', label: 'Occupied', icon: 'fas fa-user' },
            'available': { color: '#27ae60', label: 'Available', icon: 'fas fa-check' },
            'maintenance': { color: '#f39c12', label: 'Maintenance', icon: 'fas fa-tools' }
        };

        const statusData = [
            { status: 'occupied', count: roomStats.occupied, percentage: occupiedPct },
            { status: 'available', count: roomStats.available, percentage: availablePct },
            { status: 'maintenance', count: roomStats.maintenance, percentage: maintenancePct }
        ].filter(item => item.count > 0);

        const max = Math.max(...statusData.map(item => item.count));
        const bars = statusData.map(item => {
            const heightPct = max === 0 ? 0 : Math.round((item.count / max) * 100);
            const config = statusConfig[item.status];
            return `<div class="bar" title="${config.label}: ${item.count} (${item.percentage}%)" data-count="${item.count}" style="height:${heightPct}%; background-color:${config.color};"></div>`;
        }).join('');
        
        const labels = statusData.map(item => {
            const config = statusConfig[item.status];
            return `<span title="${config.label}: ${item.count}">${config.label.slice(0,4).toUpperCase()}</span>`;
        }).join('');
        
        // Calculate circumference for circular progress
        const radius = 50;
        const circumference = 2 * Math.PI * radius;
        
        container.innerHTML = `
            <div class="occupancy-redesign">
                <!-- Summary Header -->
                <div class="occupancy-header">
                    <div class="occupancy-total">
                        <div class="total-icon">
                            <i class="fas fa-door-open"></i>
                        </div>
                        <div class="total-info">
                            <span class="total-number">${roomStats.total}</span>
                            <span class="total-label">Total Rooms</span>
                        </div>
                    </div>
                    <div class="occupancy-percentage">
                        <div class="percentage-circle">
                            <svg viewBox="0 0 120 120">
                                <circle class="bg-circle" cx="60" cy="60" r="${radius}"></circle>
                                <circle class="progress-circle" cx="60" cy="60" r="${radius}"
                                    stroke-dasharray="${circumference}"
                                    stroke-dashoffset="${circumference - (occupiedPct / 100) * circumference}"></circle>
                            </svg>
                            <div class="percentage-text">
                                <span class="percent-value">${occupiedPct}%</span>
                                <span class="percent-label">Occupied</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        `;
    }

    


    renderHousingUnits() {
        const container = document.getElementById('housing-list');
        
        if (this.housingUnits.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-home"></i><h3>No housing units</h3><p>Add your first housing unit to get started</p></div>';
            return;
        }

        // Update housing stats
        this.updateHousingStats();

        // Filter housing based on current filters
        const filteredHousing = this.getFilteredHousingUnits();

        if (filteredHousing.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><h3>No housing units found</h3><p>Try adjusting your filters or search terms</p></div>';
            return;
        }

        container.innerHTML = filteredHousing.map(unit => this.renderHousingCard(unit)).join('');
    }

    // New housing methods
    updateHousingStats() {
        const totalHousesCount = document.getElementById('total-houses-count');
        const totalBedroomsCount = document.getElementById('total-bedrooms-count');
        const totalResidentsCount = document.getElementById('total-residents-count');
        
        if (totalHousesCount) {
            totalHousesCount.textContent = this.housingUnits.length;
        }
        if (totalBedroomsCount) {
            totalBedroomsCount.textContent = this.housingUnits.length * 3; // 3 bedrooms per house
        }
        if (totalResidentsCount) {
            totalResidentsCount.textContent = this.employees.filter(emp => emp.assigned_room_id).length;
        }
    }

    renderHousingCard(unit) {
        // Get rooms for this housing unit
        const unitRooms = this.rooms.filter(room => room.housing_unit_id === unit.id);
        
        // Calculate occupancy
        const occupiedRooms = unitRooms.filter(room => 
            this.employees.some(emp => emp.assigned_room_id === room.id)
        );
        
        const occupancyStatus = unitRooms.length > 0 && occupiedRooms.length === unitRooms.length ? 'full' : 
                               occupiedRooms.length > 0 ? 'partial' : 'empty';
        
        const occupancyText = occupancyStatus === 'full' ? 'Fully Occupied' :
                             occupancyStatus === 'partial' ? 'Partially Occupied' : 'Vacant';

        // Get bedroom details
        const bedrooms = unitRooms.map(room => {
            const occupant = this.employees.find(emp => emp.assigned_room_id === room.id);
            return {
                name: `Room ${room.room_number || 'N/A'} (${room.room_type || 'Unknown Type'})`,
                occupant: occupant ? occupant.name : null,
                status: occupant ? 'occupied' : 'vacant'
            };
        });

        return `
            <div class="housing-card">
                <div class="housing-header">
                    <h3 class="housing-title">${unit.name}</h3>
                    <span class="housing-type-badge">${unit.type_name || 'Unknown Type'}</span>
                </div>
                
                <div class="housing-details">
                    <div class="housing-detail-item">
                        <span class="housing-detail-label">Housing Type</span>
                        <span class="housing-detail-value">${unit.type_name || 'Unknown Type'}</span>
                    </div>
                    <div class="housing-detail-item">
                        <span class="housing-detail-label">Occupancy</span>
                        <span class="occupancy-status ${occupancyStatus}">
                            <i class="fas fa-${occupancyStatus === 'full' ? 'check-circle' : occupancyStatus === 'partial' ? 'exclamation-circle' : 'times-circle'}"></i>
                            ${occupancyText}
                        </span>
                    </div>
                </div>

                <div class="bedrooms-section">
                    <div class="bedrooms-title">
                        <i class="fas fa-bed"></i>
                        Bedrooms (${occupiedRooms.length}/3 occupied)
                    </div>
                    <div class="bedrooms-grid">
                        ${bedrooms.map(bedroom => `
                            <div class="bedroom-item">
                                <div class="bedroom-info">
                                    <div class="bedroom-name">${bedroom.name}</div>
                                    <div class="bedroom-occupant">${bedroom.occupant || 'Vacant'}</div>
                                </div>
                                <span class="bedroom-status ${bedroom.status}">
                                    ${bedroom.status === 'occupied' ? 'Occupied' : 'Vacant'}
                                </span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="housing-actions">
                    <button class="btn" onclick="app.manageRooms('${unit.id}')">
                        <i class="fas fa-bed"></i> Manage Rooms
                    </button>
                    <button class="btn btn-secondary" onclick="app.editHousing('${unit.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger" onclick="app.deleteHousing('${unit.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }

    getFilteredHousingUnits() {
        const typeFilter = document.getElementById('housing-type-filter')?.value || '';
        const searchTerm = document.getElementById('housing-search')?.value?.toLowerCase() || '';

        return this.housingUnits.filter(unit => {
            const matchesType = !typeFilter || (unit.type_name || 'Unknown Type') === typeFilter;
            
            const matchesSearch = !searchTerm || 
                unit.name.toLowerCase().includes(searchTerm) ||
                (unit.type_name || 'Unknown Type').toLowerCase().includes(searchTerm);

            return matchesType && matchesSearch;
        });
    }

    filterHousing() {
        this.renderHousingUnits();
    }

    renderInventoryItems() {
        const container = document.getElementById('inventory-list');
        
        if (this.inventoryItems.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-boxes"></i><h3>No inventory items</h3><p>Add your first inventory item to get started</p></div>';
            return;
        }

        // Update inventory stats
        this.updateInventoryStats();

        // Default view: group by room
        this.renderGroupedInventoryByRoom(this.rooms, this.inventoryItems);
    }

    // New inventory methods
    updateInventoryStats() {
        const totalInventoryCount = document.getElementById('total-inventory-count');
        const totalRoomsCount = document.getElementById('total-rooms-count');
        
        if (totalInventoryCount) {
            totalInventoryCount.textContent = this.inventoryItems.length;
        }
        if (totalRoomsCount) {
            totalRoomsCount.textContent = this.rooms.length;
        }
    }

    setInventoryView(view) {
        const container = document.getElementById('inventory-list');
        const gridBtn = document.getElementById('grid-view-btn');
        const listBtn = document.getElementById('list-view-btn');
        
        if (view === 'list') {
            container.classList.add('list-view');
            gridBtn.classList.remove('active');
            listBtn.classList.add('active');
        } else {
            container.classList.remove('list-view');
            gridBtn.classList.add('active');
            listBtn.classList.remove('active');
        }
        
        // Re-render with new view
        this.renderInventoryItems();
    }

    getFilteredInventoryItems() {
        const roomFilter = document.getElementById('room-filter')?.value || '';
        const categoryFilter = document.getElementById('category-filter')?.value || '';
        
        const searchTerm = document.getElementById('inventory-search')?.value?.toLowerCase() || '';

        return this.inventoryItems.filter(item => {
            const matchesRoom = !roomFilter || item.room_id === roomFilter;
            const matchesCategory = !categoryFilter || item.category === categoryFilter;
            
            const matchesSearch = !searchTerm || 
                item.name.toLowerCase().includes(searchTerm) ||
                item.description?.toLowerCase().includes(searchTerm) ||
                item.category?.toLowerCase().includes(searchTerm);

            return matchesRoom && matchesCategory && matchesSearch;
        });
    }

    filterInventory() {
        const container = document.getElementById('inventory-list');
        const filteredItems = this.getFilteredInventoryItems();

        if (filteredItems.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><h3>No items found</h3><p>Try adjusting your filters or search terms</p></div>';
            return;
        }

        // Re-render with filtered items
        this.renderGroupedInventoryByRoom(this.rooms, filteredItems);
    }

    handleItemCategoryChange() {
        const categorySelect = document.getElementById('item-category');
        const customItemGroup = document.getElementById('custom-item-group');
        const customItemInput = document.getElementById('item-name');
        
        if (categorySelect && customItemGroup && customItemInput) {
            if (categorySelect.value === 'Other') {
                customItemGroup.style.display = 'block';
                customItemInput.required = true;
                customItemInput.value = '';
            } else {
                customItemGroup.style.display = 'none';
                customItemInput.required = false;
                customItemInput.value = categorySelect.value;
            }
        }
    }

    renderEmployeeList(filtered = null) {
        const listEl = document.getElementById('employee-list');
        const detailsEl = document.getElementById('employee-details');
        const employees = filtered || this.employees;
        if (!listEl || !detailsEl) return;
        if (employees.length === 0) {
            listEl.innerHTML = '<div class="empty-state" style="padding:1rem;"><i class="fas fa-users"></i><h3>No employees</h3><p>Add your first employee to get started</p></div>';
            detailsEl.classList.add('empty');
            detailsEl.innerHTML = '<div class="empty-state"><i class="fas fa-user"></i><h3>Select an employee</h3><p>Click an employee from the list to view details</p></div>';
            return;
        }
        listEl.innerHTML = employees.map(e => `
            <div class="employee-list-item" data-id="${e.id}">
                <div>
                    <div style="font-weight:600; color:#2c3e50;">${e.name}</div>
                    <div style="font-size:12px; color:#7f8c8d;">${e.employee_id} • ${e.department}</div>
                    <div style="font-size:12px; color:#516173; margin-top:2px;">${e.assigned_room_id ? `${e.housing_unit_name || 'Unknown Unit'} - Room ${e.room_number || 'N/A'} (${e.room_type || 'Unknown Type'})` : 'No room assigned'}</div>
                </div>
                <span class="status-badge status-${e.status}">${e.status}</span>
            </div>
        `).join('');
        // click handlers
        listEl.querySelectorAll('.employee-list-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = item.getAttribute('data-id');
                listEl.querySelectorAll('.employee-list-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                const emp = this.employees.find(x => x.id === id);
                this.renderEmployeeDetails(emp);
            });
        });
        // select first by default
        const first = employees[0];
        const firstEl = listEl.querySelector(`.employee-list-item[data-id="${first.id}"]`);
        if (firstEl) firstEl.classList.add('active');
        this.renderEmployeeDetails(first);
    }

    renderEmployeeDetails(employee) {
        const el = document.getElementById('employee-details');
        if (!el) return;
        if (!employee) {
            el.classList.add('empty');
            el.innerHTML = '<div class="empty-state"><i class="fas fa-user"></i><h3>Select an employee</h3><p>Click an employee from the list to view details</p></div>';
            return;
        }
        el.classList.remove('empty');
        el.innerHTML = `
            <div class="card" style="box-shadow:none; border:none;">
                <div class="card-header">
                    <h3 class="card-title">${employee.name}</h3>
                    <div class="card-actions">
                        <button class="btn btn-secondary" onclick="app.editEmployee('${employee.id}')"><i class="fas fa-edit"></i> Edit</button>
                        <button class="btn btn-danger" onclick="app.deleteEmployee('${employee.id}')"><i class="fas fa-trash"></i> Delete</button>
                    </div>
                </div>
                <div class="card-content">
                    <div class="card-item"><span class="card-label">Employee ID:</span><span class="card-value">${employee.employee_id}</span></div>
                    <div class="card-item"><span class="card-label">Department:</span><span class="card-value">${employee.department}</span></div>
                    <div class="card-item"><span class="card-label">Position:</span><span class="card-value">${employee.position}</span></div>
                    <div class="card-item"><span class="card-label">Status:</span><span class="card-value"><span class="status-badge status-${employee.status}">${employee.status}</span></span></div>
                    <div class="card-item"><span class="card-label">Assigned Room:</span><span class="card-value">${employee.assigned_room_id ? `${employee.housing_unit_name || 'Unknown Unit'} - Room ${employee.room_number || 'N/A'} (${employee.room_type || 'Unknown Type'})` : 'No room assigned'}</span></div>
                    ${employee.email ? `<div class="card-item"><span class="card-label">Email:</span><span class="card-value">${employee.email}</span></div>` : ''}
                    ${employee.phone ? `<div class="card-item"><span class="card-label">Phone:</span><span class="card-value">${employee.phone}</span></div>` : ''}
                </div>
            </div>
        `;
    }

    showModal(title, content, options) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-body').innerHTML = content;
        const overlay = document.getElementById('modal-overlay');
        const saveBtn = document.getElementById('modal-save');
        if (options) {
            if (options.showSave === false) {
                saveBtn.style.display = 'none';
            } else {
                saveBtn.style.display = '';
            }
            if (options.saveText) {
                saveBtn.textContent = options.saveText;
            } else {
                saveBtn.textContent = 'Save';
            }
        } else {
            saveBtn.style.display = '';
            saveBtn.textContent = 'Save';
        }
        overlay.classList.add('active');
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
                    <label for="item-category">Item Type *</label>
                    <select id="item-category" required onchange="app.handleItemCategoryChange()">
                        <option value="">Select item type</option>
                        <option value="Smart TV" ${item?.category === 'Smart TV' ? 'selected' : ''}>Smart TV</option>
                        <option value="Decoder" ${item?.category === 'Decoder' ? 'selected' : ''}>Decoder</option>
                        <option value="Mattress" ${item?.category === 'Mattress' ? 'selected' : ''}>Mattress</option>
                        <option value="Table" ${item?.category === 'Table' ? 'selected' : ''}>Table</option>
                        <option value="Chairs" ${item?.category === 'Chairs' ? 'selected' : ''}>Chairs</option>
                        <option value="Sofa" ${item?.category === 'Sofa' ? 'selected' : ''}>Sofa</option>
                        <option value="Gas cylinder" ${item?.category === 'Gas cylinder' ? 'selected' : ''}>Gas cylinder</option>
                        <option value="Stove" ${item?.category === 'Stove' ? 'selected' : ''}>Stove</option>
                        <option value="Air-conditioner" ${item?.category === 'Air-conditioner' ? 'selected' : ''}>Air-conditioner</option>
                        <option value="Bed frame" ${item?.category === 'Bed frame' ? 'selected' : ''}>Bed frame</option>
                        <option value="Speakers" ${item?.category === 'Speakers' ? 'selected' : ''}>Speakers</option>
                        <option value="Mirror" ${item?.category === 'Mirror' ? 'selected' : ''}>Mirror</option>
                        <option value="Wall clock" ${item?.category === 'Wall clock' ? 'selected' : ''}>Wall clock</option>
                        <option value="Bookshelf" ${item?.category === 'Bookshelf' ? 'selected' : ''}>Bookshelf</option>
                        <option value="Pillows" ${item?.category === 'Pillows' ? 'selected' : ''}>Pillows</option>
                        <option value="Wardrobe" ${item?.category === 'Wardrobe' ? 'selected' : ''}>Wardrobe</option>
                        <option value="Other" ${item?.category === 'Other' ? 'selected' : ''}>Other (Custom Item)</option>
                    </select>
                </div>

                <div class="form-group" id="custom-item-group" style="display: none;">
                    <label for="item-name">Custom Item Name *</label>
                    <input type="text" id="item-name" placeholder="Enter custom item name" value="${item?.category === 'Other' ? item?.name : ''}">
                </div>
                
                <div class="form-group">
                    <label for="item-room">Room *</label>
                    <select id="item-room" required>
                        <option value="">Select room</option>
                        ${this.rooms.map(room => `
                            <option value="${room.id}" ${item?.room_id === room.id ? 'selected' : ''}>
                                ${room.housing_unit_name || 'Unknown Unit'} - Room ${room.room_number || 'N/A'} (${room.room_type || 'Unknown Type'})
                            </option>
                        `).join('')}
                    </select>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="item-quantity">Quantity *</label>
                        <input type="number" id="item-quantity" value="${item?.quantity || 1}" min="1" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="item-unit">Unit</label>
                        <select id="item-unit">
                            <option value="pcs" ${item?.unit === 'pcs' ? 'selected' : ''}>Pieces</option>
                            <option value="set" ${item?.unit === 'set' ? 'selected' : ''}>Set</option>
                            <option value="pair" ${item?.unit === 'pair' ? 'selected' : ''}>Pair</option>
                            <option value="kg" ${item?.unit === 'kg' ? 'selected' : ''}>Kilogram</option>
                            <option value="liter" ${item?.unit === 'liter' ? 'selected' : ''}>Liter</option>
                        </select>
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
                        ${this.rooms.map(room => {
                            // Check if room is already assigned to another active employee
                            const isOccupied = this.employees.some(emp => 
                                emp.assigned_room_id === room.id && 
                                emp.status === 'active' && 
                                emp.id !== employee?.id
                            );
                            
                            // Show the room if it's not occupied, or if it's currently assigned to this employee
                            const shouldShow = !isOccupied || employee?.assigned_room_id === room.id;
                            
                            if (shouldShow) {
                                return `
                                    <option value="${room.id}" ${employee?.assigned_room_id === room.id ? 'selected' : ''}>
                                        ${room.housing_unit_name || 'Unknown Unit'} - Room ${room.room_number || 'N/A'} (${room.room_type || 'Unknown Type'})
                                    </option>
                                `;
                            }
                            return '';
                        }).join('')}
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

    async saveInventory(id, keepOpen = false) {
        const category = document.getElementById('item-category').value;
        const customName = document.getElementById('item-name').value;
        
        const data = {
            name: category === 'Other' ? customName : category,
            room_id: document.getElementById('item-room').value,
            category: category,
            quantity: parseInt(document.getElementById('item-quantity').value),
            unit: document.getElementById('item-unit').value,
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
            
            await this.loadInitialData();
            this.renderInventoryItems();
            this.updateDashboard();

            if (!keepOpen) {
                this.closeModal();
            } else {
                // Reopen add flow for the same room
                const roomId = data.room_id;
                this.addInventoryForRoom(roomId);
                // Clear fields for next entry
                setTimeout(() => {
                    const nameEl = document.getElementById('item-name');
                    const qtyEl = document.getElementById('item-quantity');
                    const catEl = document.getElementById('item-category');
                    const condEl = document.getElementById('item-condition');
                    const descEl = document.getElementById('item-description');
                    const pdEl = document.getElementById('item-purchase-date');
                    const weEl = document.getElementById('item-warranty');
                    if (nameEl) nameEl.value = '';
                    if (qtyEl) qtyEl.value = 1;
                    if (catEl) catEl.value = '';
                    if (condEl) condEl.value = 'good';
                    if (descEl) descEl.value = '';
                    if (pdEl) pdEl.value = '';
                    if (weEl) weEl.value = '';
                    if (nameEl) nameEl.focus();
                }, 0);
            }
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
            this.renderEmployeeList();
            this.updateDashboard();
        } catch (error) {
            console.error('Error saving employee:', error);
            // Extract error message from the response
            const errorMessage = error.message || error.error || 'Error saving employee';
            this.showNotification(errorMessage, 'error');
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
                this.renderEmployeeList();
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
                    <td>${room.room_number || 'N/A'}</td>
                    <td>${room.room_type || 'Unknown Type'}</td>
                    <td>${room.capacity}</td>
                    <td><span class="status-badge status-${room.status}">${room.status}</span></td>
                    <td>
                        <button class="btn btn-soft-success btn-sm btn-pill" onclick="app.addInventoryForRoom('${room.id}')"><i class="fas fa-plus"></i><span>Add item</span></button>
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
        // Add a 'Save & Add Another' button (only for add flow)
        const footer = document.querySelector('.modal-footer');
        if (footer && !document.getElementById('modal-save-another')) {
            const addAnother = document.createElement('button');
            addAnother.id = 'modal-save-another';
            addAnother.className = 'btn btn-outline-primary btn-sm btn-pill';
            addAnother.innerHTML = '<i class="fas fa-plus"></i><span>Save & Add Another</span>';
            addAnother.onclick = () => this.saveInventory(null, true);
            footer.insertBefore(addAnother, document.getElementById('modal-save'));
        }
        // Cleanup when truly saving and closing
        const modalSave = document.getElementById('modal-save');
        const cleanup = () => {
            if (roomSelect) roomSelect.disabled = false;
            const addAnotherBtn = document.getElementById('modal-save-another');
            if (addAnotherBtn && addAnotherBtn.parentNode) {
                addAnotherBtn.parentNode.removeChild(addAnotherBtn);
            }
            modalSave && modalSave.removeEventListener('click', cleanup);
        };
        if (modalSave) {
            modalSave.addEventListener('click', cleanup);
        }
    }

    populateRoomFilter() {
        const roomFilter = document.getElementById('room-filter');
        const rooms = this.rooms.map(room => `
            <option value="${room.id}">${room.housing_unit_name || 'Unknown Unit'} - Room ${room.room_number || 'N/A'}</option>
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
            (unit.address || 'No Address').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (unit.type_name || 'Unknown Type').toLowerCase().includes(searchTerm.toLowerCase())
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
                        <span class="card-value">${unit.type_name || 'Unknown Type'}</span>
                    </div>
                    <div class="card-item">
                        <span class="card-label">Address:</span>
                        <span class="card-value">${unit.address || 'No Address'}</span>
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
        const term = (searchTerm || '').trim().toLowerCase();
        if (!term) {
            // empty search -> grouped view
            this.renderGroupedInventoryByRoom(this.rooms, this.inventoryItems);
            return;
        }
        const filtered = this.inventoryItems.filter(item => 
            item.name.toLowerCase().includes(term) ||
            item.category.toLowerCase().includes(term) ||
            item.housing_unit_name.toLowerCase().includes(term) ||
            (item.room_number + '').toLowerCase().includes(term) ||
            (item.room_type + '').toLowerCase().includes(term) ||
            (item.description || '').toLowerCase().includes(term)
        );
        this.renderFilteredInventory(filtered);
    }

    filterInventoryByRoom(roomId) {
        if (!roomId) {
            // reset to full grouped view
            this.renderGroupedInventoryByRoom(this.rooms, this.inventoryItems);
            return;
        }
        
        const rooms = this.rooms.filter(r => r.id === roomId);
        const items = this.inventoryItems.filter(item => item.room_id === roomId);
        this.renderGroupedInventoryByRoom(rooms, items);
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
                        ${this.currentUser && this.currentUser.role === 'super_admin' ? '' : `
                        ${item.condition === 'damaged' || item.condition === 'repairing' ? '' : `
                        <button class="btn btn-soft-danger btn-sm" onclick="app.reportDamage('${item.id}')"><i class="fas fa-exclamation-triangle"></i> Report Damage</button>
                        `}
                        `}
                        ${item.condition === 'repairing' ? `
                        <span class="status-badge status-repairing"><i class="fas fa-tools"></i> Under Repair</span>
                        ` : ''}
                        ${item.condition === 'damaged' ? `
                        <span class="status-badge status-damaged"><i class="fas fa-exclamation-triangle"></i> Damage Reported</span>
                        ` : ''}
                        ${this.currentUser && this.currentUser.role === 'super_admin' ? `
                        <button class="btn btn-secondary" onclick="app.editInventory('${item.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-danger" onclick="app.deleteInventory('${item.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                        ` : ''}
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
                            ${this.isRecentlyRepaired(item) ? '<span class="recently-repaired-indicator">Recently Repaired</span>' : ''}
                        </span>
                    </div>
                    <div class="card-item">
                        <span class="card-label">Location:</span>
                        <span class="card-value">${item.housing_unit_name || 'Unknown Unit'} - Room ${item.room_number || 'N/A'}</span>
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


    filterInventoryByRoomSearch(searchTerm) {
        const lower = searchTerm.trim().toLowerCase();
        if (!lower) {
            this.renderGroupedInventoryByRoom(this.rooms, this.inventoryItems);
            return;
        }
        const matchingRooms = this.rooms.filter(r =>
            r.room_number.toLowerCase().includes(lower) ||
            r.room_type.toLowerCase().includes(lower) ||
            (r.housing_unit_name || '').toLowerCase().includes(lower)
        );
        const roomIds = new Set(matchingRooms.map(r => r.id));
        const items = this.inventoryItems.filter(i => roomIds.has(i.room_id));
        this.renderGroupedInventoryByRoom(matchingRooms, items);
    }

    renderGroupedInventoryByRoom(rooms, items) {
        const container = document.getElementById('inventory-list');
        if (!rooms || rooms.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><h3>No rooms found</h3><p>Try adjusting your search</p></div>';
            return;
        }
        // Build map roomId -> items
        const byRoom = rooms.map(room => {
            const roomItems = items.filter(i => i.room_id === room.id);
            const itemsHtml = roomItems.length === 0
                ? `<div class="room-group-empty">
                    <div class="empty-icon">
                        <i class="fas fa-box-open"></i>
                    </div>
                    <p>No items in this room</p>
                    <button class="btn btn-primary btn-sm" onclick="app.addInventoryForRoom('${room.id}')">
                        <i class="fas fa-plus"></i> Add First Item
                    </button>
                </div>`
                : roomItems.map(item => `
                    <div class="inventory-item-card">
                        <div class="item-header">
                            <div class="item-icon">
                                <i class="fas fa-${this.getItemIcon(item.category)}"></i>
                            </div>
                            <div class="item-info">
                                <h4 class="item-name">${item.name}</h4>
                                <p class="item-category">${item.category}</p>
                            </div>
                            <div class="item-status">
                                <span class="status-indicator status-${item.condition}"></span>
                                <span class="status-text">${item.condition}</span>
                            </div>
                        </div>
                        
                        <div class="item-details">
                            <div class="detail-row">
                                <span class="detail-label">Quantity</span>
                                <span class="detail-value">${item.quantity} ${item.unit || 'pcs'}</span>
                            </div>
                            ${item.description ? `
                            <div class="detail-row">
                                <span class="detail-label">Description</span>
                                <span class="detail-value">${item.description}</span>
                            </div>
                            ` : ''}
                        </div>
                        
                        <div class="item-actions">
                            ${this.currentUser && this.currentUser.role === 'super_admin' ? '' : `
                            ${item.condition === 'damaged' || item.condition === 'repairing' ? '' : `
                            <button class="action-btn damage-btn" onclick="app.reportDamage('${item.id}')" title="Report Damage">
                                <i class="fas fa-exclamation-triangle"></i>
                            </button>
                            `}
                            `}
                            ${item.condition === 'repairing' ? `
                            <span class="status-badge repairing">
                                <i class="fas fa-tools"></i> Under Repair
                            </span>
                            ` : ''}
                            ${item.condition === 'damaged' ? `
                            <span class="status-badge damaged">
                                <i class="fas fa-exclamation-triangle"></i> Damaged
                            </span>
                            ` : ''}
                            ${this.currentUser && this.currentUser.role === 'super_admin' ? `
                            <button class="action-btn edit-btn" onclick="app.editInventory('${item.id}')" title="Edit Item">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn delete-btn" onclick="app.deleteInventory('${item.id}')" title="Delete Item">
                                <i class="fas fa-trash"></i>
                            </button>
                            ` : ''}
                        </div>
                    </div>
                `).join('');
            return `
                <div class="room-group">
                    <div class="room-group-header" onclick="app.toggleRoomInventory('${room.id}')">
                        <div class="room-header-left">
                            <i class="fas fa-chevron-right room-toggle-icon" id="toggle-icon-${room.id}"></i>
                            <h4>${room.housing_unit_name || 'Unknown Unit'} - Room ${room.room_number || 'N/A'} (${room.room_type || 'Unknown Type'})</h4>
                            <span class="item-count-badge">${roomItems.length} ${roomItems.length === 1 ? 'item' : 'items'}</span>
                        </div>
                        <div onclick="event.stopPropagation()">
                            <button class="btn btn-soft-success btn-sm btn-pill" onclick="app.addInventoryForRoom('${room.id}')"><i class="fas fa-plus"></i><span>Add item</span></button>
                        </div>
                    </div>
                    <div class="room-group-body collapsed" id="room-body-${room.id}">${itemsHtml}</div>
                </div>
            `;
        }).join('');
        container.innerHTML = byRoom;
    }

    toggleRoomInventory(roomId) {
        const roomBody = document.getElementById(`room-body-${roomId}`);
        const toggleIcon = document.getElementById(`toggle-icon-${roomId}`);
        
        if (roomBody && toggleIcon) {
            roomBody.classList.toggle('collapsed');
            toggleIcon.classList.toggle('fa-chevron-right');
            toggleIcon.classList.toggle('fa-chevron-down');
        }
    }

    getItemIcon(category) {
        const iconMap = {
            'Smart TV': 'tv',
            'Decoder': 'satellite-dish',
            'Mattress': 'bed',
            'Table': 'table',
            'Chairs': 'chair',
            'Sofa': 'couch',
            'Gas cylinder': 'fire',
            'Stove': 'fire-burner',
            'Air-conditioner': 'snowflake',
            'Bed frame': 'bed',
            'Speakers': 'volume-up',
            'Mirror': 'mirror',
            'Wall clock': 'clock',
            'Bookshelf': 'books',
            'Pillows': 'pillow',
            'Wardrobe': 'tshirt',
            'Electronics': 'microchip',
            'Furniture': 'chair',
            'Kitchen': 'utensils',
            'Bathroom': 'bath',
            'Bedding': 'bed',
            'Appliances': 'plug',
            'Other': 'box'
        };
        return iconMap[category] || 'box';
    }

    filterEmployees(searchTerm) {
        const filtered = this.employees.filter(employee => 
            employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            employee.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            employee.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
            employee.position.toLowerCase().includes(searchTerm.toLowerCase())
        );
        this.renderEmployeeList(filtered);
    }

    renderFilteredEmployees(_) { /* no-op in master-detail; kept for compatibility */ }

    reportDamage(itemId) {
        const item = this.inventoryItems.find(i => i.id === itemId);
        if (!item) return;

        const title = `Report Damage - ${item.name}`;
        const content = `
            <form id="damage-report-form">
                <div class="form-group">
                    <label for="damage-type">Damage Type *</label>
                    <select id="damage-type" required>
                        <option value="">Select damage type</option>
                        <option value="broken">Broken</option>
                        <option value="cracked">Cracked</option>
                        <option value="scratched">Scratched</option>
                        <option value="dented">Dented</option>
                        <option value="malfunctioning">Malfunctioning</option>
                        <option value="worn">Worn</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="damage-severity">Severity *</label>
                    <select id="damage-severity" required>
                        <option value="">Select severity</option>
                        <option value="minor">Minor</option>
                        <option value="moderate">Moderate</option>
                        <option value="severe">Severe</option>
                        <option value="critical">Critical</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="damage-description">Damage Description *</label>
                    <textarea id="damage-description" rows="3" placeholder="Describe the damage in detail..." required></textarea>
                </div>
                
                <div class="form-group">
                    <label for="reported-by">Reported By *</label>
                    <input type="text" id="reported-by" placeholder="Your name" required readonly>
                </div>
                
                <div class="form-group">
                    <label for="damage-date">Date of Damage *</label>
                    <input type="date" id="damage-date" required>
                </div>
                
                <div class="form-group">
                    <label for="estimated-repair-cost">Estimated Repair Cost</label>
                    <input type="number" id="estimated-repair-cost" placeholder="0.00" step="0.01" min="0">
                </div>
                
                <div class="form-group">
                    <label for="repair-notes">Repair Notes</label>
                    <textarea id="repair-notes" rows="2" placeholder="Any additional notes for repair..."></textarea>
                </div>
            </form>
        `;
        
        this.showModal(title, content);
        
        // Auto-populate the reported by field with current user's name
        const reportedByField = document.getElementById('reported-by');
        if (reportedByField && this.currentUser) {
            reportedByField.value = this.currentUser.full_name || this.currentUser.username;
        }
        
        // Set default date to today
        const damageDateField = document.getElementById('damage-date');
        if (damageDateField) {
            const today = new Date().toISOString().split('T')[0];
            damageDateField.value = today;
        }
        
        document.getElementById('modal-save').onclick = () => {
            this.submitDamageReport(itemId);
        };
    }

    async submitDamageReport(itemId) {
        const form = document.getElementById('damage-report-form');
        const formData = {
            item_id: itemId,
            damage_type: document.getElementById('damage-type').value,
            severity: document.getElementById('damage-severity').value,
            description: document.getElementById('damage-description').value,
            reported_by: document.getElementById('reported-by').value,
            damage_date: document.getElementById('damage-date').value,
            estimated_cost: document.getElementById('estimated-repair-cost').value,
            repair_notes: document.getElementById('repair-notes').value
        };

        // Validate required fields
        if (!formData.damage_type || !formData.severity || !formData.description || !formData.reported_by || !formData.damage_date) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }

        try {
            console.log('Submitting damage report:', formData);
            // Submit damage report using the new API endpoint
            const response = await this.postData('/api/damage-reports', formData);
            console.log('Damage report response:', response);
            
            this.showNotification('Damage report submitted successfully', 'success');
            this.closeModal();
            
            // Refresh inventory display
            await this.loadInitialData();
            this.renderInventoryItems();
            this.updateDashboard();
            
            // Update damage reports notification if user is super admin
            if (this.currentUser && this.currentUser.role === 'super_admin') {
                await this.loadDamageReports();
            }
        } catch (error) {
            console.error('Error submitting damage report:', error);
            console.error('Error details:', {
                message: error.message,
                status: error.status,
                response: error.response
            });
            this.showNotification(`Error submitting damage report: ${error.message}`, 'error');
        }
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

    // User Management Methods (Super Admin only)
    async loadUsers() {
        try {
            this.users = await this.fetchData('/api/users');
            this.renderUsers();
        } catch (error) {
            console.error('Error loading users:', error);
            this.showNotification('Error loading users', 'error');
        }
    }

    renderUsers() {
        const container = document.getElementById('users-list');
        
        if (this.users.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-users"></i><h3>No users found</h3><p>Add your first user to get started</p></div>';
            return;
        }

        container.innerHTML = this.users.map(user => `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">${user.full_name}</h3>
                    <div class="card-actions">
                        <button class="btn btn-secondary" onclick="app.editUser('${user.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-danger" onclick="app.deleteUser('${user.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
                <div class="card-content">
                    <div class="card-item">
                        <span class="card-label">Username:</span>
                        <span class="card-value">${user.username}</span>
                    </div>
                    <div class="card-item">
                        <span class="card-label">Role:</span>
                        <span class="card-value">
                            <span class="status-badge status-${user.role}">${user.role.replace('_', ' ')}</span>
                        </span>
                    </div>
                    ${user.email ? `
                    <div class="card-item">
                        <span class="card-label">Email:</span>
                        <span class="card-value">${user.email}</span>
                    </div>
                    ` : ''}
                    <div class="card-item">
                        <span class="card-label">Created:</span>
                        <span class="card-value">${new Date(user.created_at).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    showUserModal(user = null) {
        const isEdit = user !== null;
        const title = isEdit ? 'Edit User' : 'Add User';
        
        const content = `
            <form id="user-form">
                <div class="form-group">
                    <label for="user-username">Username *</label>
                    <input type="text" id="user-username" value="${user?.username || ''}" required>
                </div>
                
                ${!isEdit ? `
                <div class="form-group">
                    <label for="user-password">Password *</label>
                    <input type="password" id="user-password" required>
                </div>
                ` : ''}
                
                <div class="form-group">
                    <label for="user-full-name">Full Name *</label>
                    <input type="text" id="user-full-name" value="${user?.full_name || ''}" required>
                </div>
                
                <div class="form-group">
                    <label for="user-email">Email</label>
                    <input type="email" id="user-email" value="${user?.email || ''}">
                </div>
                
                <div class="form-group">
                    <label for="user-role">Role *</label>
                    <select id="user-role" required>
                        <option value="">Select role</option>
                        <option value="admin" ${user?.role === 'admin' ? 'selected' : ''}>Admin</option>
                        <option value="super_admin" ${user?.role === 'super_admin' ? 'selected' : ''}>Super Admin</option>
                    </select>
                </div>
                
                ${isEdit ? `
                <div class="form-group">
                    <label for="user-status">Status</label>
                    <select id="user-status">
                        <option value="true" ${user?.is_active ? 'selected' : ''}>Active</option>
                        <option value="false" ${!user?.is_active ? 'selected' : ''}>Inactive</option>
                    </select>
                </div>
                ` : ''}
            </form>
        `;
        
        this.showModal(title, content);
        
        document.getElementById('modal-save').onclick = () => {
            this.saveUser(user?.id);
        };
    }

    async saveUser(id) {
        const data = {
            username: document.getElementById('user-username').value,
            full_name: document.getElementById('user-full-name').value,
            email: document.getElementById('user-email').value,
            role: document.getElementById('user-role').value,
            is_active: document.getElementById('user-status') ? document.getElementById('user-status').value === 'true' : true
        };

        if (!id) {
            data.password = document.getElementById('user-password').value;
        }

        // Debug: Log the form data and individual field values
        console.log('Form data:', data);
        console.log('Is edit mode:', !!id);
        console.log('Role field value:', document.getElementById('user-role').value);
        console.log('Role field element:', document.getElementById('user-role'));

        // Validate required fields
        const missingFields = [];
        if (!data.username.trim()) missingFields.push('Username');
        if (!data.full_name.trim()) missingFields.push('Full Name');
        if (!data.role || data.role === '') missingFields.push('Role');
        if (!id && !data.password.trim()) missingFields.push('Password');

        console.log('Missing fields:', missingFields);
        console.log('Role validation - data.role:', data.role, 'type:', typeof data.role, 'empty check:', data.role === '');

        if (missingFields.length > 0) {
            this.showNotification(`Please fill in: ${missingFields.join(', ')}`, 'error');
            return;
        }

        try {
            if (id) {
                await this.putData(`/api/users/${id}`, data);
                this.showNotification('User updated successfully', 'success');
            } else {
                await this.postData('/api/users', data);
                this.showNotification('User created successfully', 'success');
            }
            
            this.closeModal();
            await this.loadUsers();
        } catch (error) {
            console.error('Error saving user:', error);
            let errorMessage = 'Error saving user';
            
            // Try to extract more specific error message
            if (error.message.includes('403')) {
                errorMessage = 'Access denied. Only Super Admin can create users.';
            } else if (error.message.includes('401')) {
                errorMessage = 'Authentication required. Please login again.';
            } else if (error.message.includes('400')) {
                errorMessage = 'Invalid data. Please check your input.';
            }
            
            this.showNotification(errorMessage, 'error');
        }
    }

    async editUser(id) {
        const user = this.users.find(u => u.id === id);
        if (user) {
            this.showUserModal(user);
        }
    }

    async deleteUser(id) {
        if (confirm('Are you sure you want to delete this user?')) {
            try {
                await this.deleteData(`/api/users/${id}`);
                this.showNotification('User deleted successfully', 'success');
                await this.loadUsers();
            } catch (error) {
                console.error('Error deleting user:', error);
                this.showNotification('Error deleting user', 'error');
            }
        }
    }

    // Damage Reports Management (Super Admin only)
    async loadDamageReports() {
        try {
            this.damageReports = await this.fetchData('/api/damage-reports');
            this.renderDamageReports();
            this.updateDamageReportsStats();
            this.updateDamageReportsNotification();
        } catch (error) {
            console.error('Error loading damage reports:', error);
            this.showNotification('Error loading damage reports', 'error');
        }
    }

    renderDamageReports() {
        const container = document.getElementById('damage-reports-list');
        
        if (this.damageReports.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>No damage reports</h3><p>All items are in good condition</p></div>';
            return;
        }

        container.innerHTML = this.damageReports.map(report => this.renderDamageReportCard(report)).join('');
    }

    renderDamageReportCard(report) {
        const createdDate = new Date(report.created_at).toLocaleDateString();
        const damageDate = report.damage_date ? new Date(report.damage_date).toLocaleDateString() : 'Not specified';
        const estimatedCost = report.estimated_cost ? `$${parseFloat(report.estimated_cost).toFixed(2)}` : 'Not specified';

        return `
            <div class="damage-report-card ${report.severity}">
                <div class="damage-report-header">
                    <h3 class="damage-report-title">${report.item_name}</h3>
                    <div class="damage-report-meta">
                        <span class="damage-report-status ${report.status}">${report.status.replace('_', ' ')}</span>
                        <span class="damage-report-severity ${report.severity}">${report.severity}</span>
                    </div>
                </div>
                
                <div class="damage-report-content">
                    <p class="damage-report-description">${report.description}</p>
                    
                    <div class="damage-report-details">
                        <div class="damage-report-detail">
                            <span class="damage-report-detail-label">Reported By</span>
                            <span class="damage-report-detail-value">${report.reported_by}</span>
                        </div>
                        <div class="damage-report-detail">
                            <span class="damage-report-detail-label">Damage Type</span>
                            <span class="damage-report-detail-value">${report.damage_type}</span>
                        </div>
                        <div class="damage-report-detail">
                            <span class="damage-report-detail-label">Location</span>
                            <span class="damage-report-detail-value">${report.housing_unit_name || 'Unknown Unit'} - Room ${report.room_number || 'N/A'}</span>
                        </div>
                        <div class="damage-report-detail">
                            <span class="damage-report-detail-label">Damage Date</span>
                            <span class="damage-report-detail-value">${damageDate}</span>
                        </div>
                        <div class="damage-report-detail">
                            <span class="damage-report-detail-label">Estimated Cost</span>
                            <span class="damage-report-detail-value">${estimatedCost}</span>
                        </div>
                        <div class="damage-report-detail">
                            <span class="damage-report-detail-label">Reported On</span>
                            <span class="damage-report-detail-value">${createdDate}</span>
                        </div>
                    </div>
                    
                    ${report.repair_notes ? `
                    <div class="damage-report-detail">
                        <span class="damage-report-detail-label">Repair Notes</span>
                        <span class="damage-report-detail-value">${report.repair_notes}</span>
                    </div>
                    ` : ''}
                </div>
                
                <div class="damage-report-actions">
                    ${report.status === 'pending' ? `
                    <button class="btn btn-secondary" onclick="app.updateDamageReportStatus('${report.id}', 'in_progress')">
                        <i class="fas fa-play"></i> Start Repair
                    </button>
                    <button class="btn btn-success" onclick="app.updateDamageReportStatus('${report.id}', 'resolved')">
                        <i class="fas fa-check"></i> Mark Resolved
                    </button>
                    ` : ''}
                    ${report.status === 'in_progress' ? `
                    <button class="btn btn-success" onclick="app.updateDamageReportStatus('${report.id}', 'resolved')">
                        <i class="fas fa-check"></i> Mark Resolved
                    </button>
                    <button class="btn btn-secondary" disabled>
                        <i class="fas fa-tools"></i> Repair In Progress
                    </button>
                    ` : ''}
                    ${report.status === 'resolved' ? `
                    <button class="btn btn-success" disabled>
                        <i class="fas fa-check-circle"></i> Resolved
                    </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    updateDamageReportsStats() {
        const totalReports = document.getElementById('total-damage-reports');
        const pendingReports = document.getElementById('pending-damage-reports');
        
        if (totalReports) {
            totalReports.textContent = this.damageReports.length;
        }
        if (pendingReports) {
            const pendingCount = this.damageReports.filter(report => report.status === 'pending').length;
            pendingReports.textContent = pendingCount;
        }
    }

    updateDamageReportsNotification() {
        const badge = document.getElementById('damage-reports-badge');
        if (badge) {
            const pendingCount = this.damageReports.filter(report => report.status === 'pending').length;
            if (pendingCount > 0) {
                badge.textContent = pendingCount;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    async updateDamageReportStatus(reportId, newStatus) {
        try {
            await this.putData(`/api/damage-reports/${reportId}`, { status: newStatus });
            this.showNotification(`Damage report ${newStatus.replace('_', ' ')} successfully`, 'success');
            
            // Refresh damage reports
            await this.loadDamageReports();
            
            // Refresh inventory to show updated item conditions
            await this.loadInitialData();
            this.renderInventoryItems();
            this.updateDashboard();
        } catch (error) {
            console.error('Error updating damage report status:', error);
            this.showNotification('Error updating damage report status', 'error');
        }
    }

    // PDF Report Generation
	openReportOptions() {
		const title = 'Generate PDF Report';
		const content = `
			<form id="report-options-form">
				<div class="form-group">
					<label for="report-housing-unit">Housing Unit</label>
					<select id="report-housing-unit">
						<option value="">All Housing Units</option>
						${this.housingUnits.map(unit => `
							<option value="${unit.id}">${unit.name}</option>
						`).join('')}
					</select>
				</div>
				<div class="form-group">
					<label for="report-type">Report Type</label>
					<select id="report-type">
						<option value="full">Full Report (Rooms + Inventory + Damage)</option>
						<option value="rooms">Rooms Only</option>
						<option value="inventory">Inventory Only</option>
						<option value="damage">Damage Reports Only</option>
					</select>
				</div>
			</form>
		`;

		this.showModal(title, content, { showSave: true, saveText: 'Generate' });
		const saveBtn = document.getElementById('modal-save');
		if (saveBtn) {
			saveBtn.onclick = () => {
				const type = document.getElementById('report-type').value || 'full';
				const housingUnitId = document.getElementById('report-housing-unit').value || '';
				this.closeModal();
				this.generatePdfReport(type, housingUnitId);
			};
		}
	}

	async generatePdfReport(type = 'full', housingUnitId = '') {
        try {
            // Show loading state
            const generateBtn = document.getElementById('generate-pdf-report-btn');
            const originalText = generateBtn.innerHTML;
            generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating PDF...';
            generateBtn.disabled = true;

            // Build query parameters
            let apiUrl = `/api/generate-report?type=${encodeURIComponent(type)}`;
            if (housingUnitId) {
                apiUrl += `&housing_unit_id=${encodeURIComponent(housingUnitId)}`;
            }

            // Make request to generate PDF
			const response = await fetch(apiUrl, {
                method: 'GET',
                credentials: 'include'
            });

            if (!response.ok) {
                // Try to get error details from response
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    if (errorData.error) {
                        errorMessage = errorData.error;
                        if (errorData.details) {
                            errorMessage += `: ${errorData.details}`;
                        }
                    }
                } catch (e) {
                    // If response is not JSON, use status text
                    errorMessage = response.statusText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            // Get the PDF blob
            const blob = await response.blob();
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            
            // Get filename from response headers or use default
            const contentDisposition = response.headers.get('Content-Disposition');
			let filename = `${type}-report.pdf`;
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                if (filenameMatch) {
                    filename = filenameMatch[1];
                }
            }
            
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            this.showNotification('PDF report generated successfully!', 'success');

        } catch (error) {
            console.error('PDF generation failed:', error);
            this.showNotification(`Failed to generate PDF report: ${error.message}`, 'error');
        } finally {
            // Reset button state
            const generateBtn = document.getElementById('generate-pdf-report-btn');
            generateBtn.innerHTML = '<i class="fas fa-file-pdf"></i> Generate PDF Report';
            generateBtn.disabled = false;
        }
    }

    // Check if an item was recently repaired (within 2 days)
    isRecentlyRepaired(item) {
        if (item.condition !== 'good') return false;
        
        // Find the most recent damage report for this item that was resolved
        const recentReport = this.damageReports.find(report => 
            report.item_id === item.id && 
            report.status === 'resolved'
        );
        
        if (!recentReport) return false;
        
        // Check if the report was resolved within the last 2 days
        const resolvedDate = new Date(recentReport.updated_at);
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        
        return resolvedDate >= twoDaysAgo;
    }

    // Profile Management Methods
    async loadProfile() {
        try {
            const profile = await this.fetchData('/api/profile');
            this.renderProfile(profile);
        } catch (error) {
            console.error('Error loading profile:', error);
            this.showNotification('Error loading profile', 'error');
        }
    }

    renderProfile(profile) {
        document.getElementById('profile-name').textContent = profile.username;
        document.getElementById('profile-role').textContent = profile.role.replace('_', ' ').toUpperCase();
        document.getElementById('profile-email').textContent = profile.email || 'No email provided';
        document.getElementById('current-username').value = profile.username;
        
        // Update the user info in the header if it exists
        const userNameElement = document.getElementById('user-name');
        const userRoleElement = document.getElementById('user-role-badge');
        if (userNameElement) {
            userNameElement.textContent = profile.username;
        }
        if (userRoleElement) {
            userRoleElement.textContent = profile.role.replace('_', ' ').toUpperCase();
        }
    }

    showChangeUsernameForm() {
        document.getElementById('change-username-form').style.display = 'block';
        document.getElementById('change-password-form').style.display = 'none';
    }

    hideChangeUsernameForm() {
        document.getElementById('change-username-form').style.display = 'none';
        document.getElementById('username-form').reset();
    }

    showChangePasswordForm() {
        document.getElementById('change-password-form').style.display = 'block';
        document.getElementById('change-username-form').style.display = 'none';
    }

    hideChangePasswordForm() {
        document.getElementById('change-password-form').style.display = 'none';
        document.getElementById('password-form').reset();
    }

    async updateUsername() {
        const newUsername = document.getElementById('new-username').value;
        const confirmUsername = document.getElementById('confirm-username').value;

        console.log('Frontend - newUsername:', newUsername);
        console.log('Frontend - confirmUsername:', confirmUsername);

        if (newUsername !== confirmUsername) {
            this.showNotification('Username confirmation does not match', 'error');
            return;
        }

        try {
            const requestData = {
                newUsername,
                confirmUsername
            };
            console.log('Frontend - sending data:', requestData);
            
            await this.putData('/api/profile/username', requestData);
            
            this.showNotification('Username updated successfully', 'success');
            this.hideChangeUsernameForm();
            await this.loadProfile();
        } catch (error) {
            console.error('Error updating username:', error);
            this.showNotification(`Error updating username: ${error.message}`, 'error');
        }
    }

    async updatePassword() {
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        console.log('Frontend - currentPassword:', currentPassword ? 'provided' : 'missing');
        console.log('Frontend - newPassword:', newPassword ? 'provided' : 'missing');
        console.log('Frontend - confirmPassword:', confirmPassword ? 'provided' : 'missing');

        if (newPassword !== confirmPassword) {
            this.showNotification('Password confirmation does not match', 'error');
            return;
        }

        try {
            const requestData = {
                currentPassword,
                newPassword,
                confirmPassword
            };
            console.log('Frontend - sending password data:', requestData);
            
            await this.putData('/api/change-password', requestData);
            
            this.showNotification('Password updated successfully', 'success');
            this.hideChangePasswordForm();
        } catch (error) {
            console.error('Error updating password:', error);
            this.showNotification(`Error updating password: ${error.message}`, 'error');
        }
    }

    // New Profile Options Methods
    showLoginHistory() {
        document.getElementById('login-history-form').style.display = 'block';
        this.loadLoginHistory();
        this.renderLoginHistory();
    }

    hideLoginHistory() {
        document.getElementById('login-history-form').style.display = 'none';
    }

    loadLoginHistory() {
        // Simulate login history data
        const loginHistory = [
            { date: '2024-01-15 10:30:00', ip: '192.168.1.100', status: 'Success' },
            { date: '2024-01-14 09:15:00', ip: '192.168.1.100', status: 'Success' },
            { date: '2024-01-13 14:45:00', ip: '192.168.1.100', status: 'Success' },
            { date: '2024-01-12 11:20:00', ip: '192.168.1.100', status: 'Failed' }
        ];

        document.getElementById('total-logins').textContent = loginHistory.filter(h => h.status === 'Success').length;
        document.getElementById('last-login').textContent = loginHistory[0]?.date || 'Never';

        const historyList = document.getElementById('login-history-list');
        historyList.innerHTML = loginHistory.map(entry => `
            <div class="history-item">
                <div class="history-date">${entry.date}</div>
                <div class="history-ip">IP: ${entry.ip}</div>
                <div class="history-status status-${entry.status.toLowerCase()}">${entry.status}</div>
            </div>
        `).join('');
    }

    exportData() {
        this.showNotification('Exporting data...', 'info');
        
        // Simulate data export
        setTimeout(() => {
            const data = {
                housingUnits: this.housingUnits,
                inventoryItems: this.inventoryItems,
                employees: this.employees,
                rooms: this.rooms,
                exportDate: new Date().toISOString()
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `estate-data-export-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            this.showNotification('Data exported successfully', 'success');
        }, 1000);
    }

    showSystemSettings() {
        document.getElementById('system-settings-form').style.display = 'block';
        this.loadSystemSettings();
    }

    hideSystemSettings() {
        document.getElementById('system-settings-form').style.display = 'none';
    }

    loadSystemSettings() {
        // Load current system settings from localStorage or defaults
        const settings = this.getSystemSettings();
        document.getElementById('session-timeout').value = settings.sessionTimeout;
        document.getElementById('backup-frequency').value = settings.backupFrequency;
    }

    getSystemSettings() {
        // Get settings from localStorage or return defaults
        const defaultSettings = {
            sessionTimeout: 30,
            backupFrequency: 'daily'
        };

        try {
            const stored = localStorage.getItem('systemSettings');
            return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
        } catch (error) {
            console.error('Error loading system settings:', error);
            return defaultSettings;
        }
    }

    async saveSystemSettings() {
        try {
            const settings = {
                sessionTimeout: parseInt(document.getElementById('session-timeout').value),
                backupFrequency: document.getElementById('backup-frequency').value
            };

            // Validate settings
            if (settings.sessionTimeout < 5 || settings.sessionTimeout > 480) {
                this.showNotification('Session timeout must be between 5 and 480 minutes', 'error');
                return;
            }

            // Save to localStorage
            localStorage.setItem('systemSettings', JSON.stringify(settings));

            // Apply settings
            this.applySystemSettings(settings);

            this.showNotification('System settings saved successfully', 'success');
            this.hideSystemSettings();

        } catch (error) {
            console.error('Error saving system settings:', error);
            this.showNotification('Failed to save system settings', 'error');
        }
    }

    applySystemSettings(settings) {
        // Apply session timeout (this would typically be handled server-side)
        console.log('Applying session timeout:', settings.sessionTimeout, 'minutes');
        
        // Apply backup frequency
        console.log('Backup frequency set to:', settings.backupFrequency);
    }

    showActivityLog() {
        document.getElementById('activity-log-form').style.display = 'block';
        this.loadActivityLog();
        this.renderActivityLog();
    }

    hideActivityLog() {
        document.getElementById('activity-log-form').style.display = 'none';
    }

    renderActivityLog() {
        const activityList = document.getElementById('activity-log-list');
        if (!activityList) return;
        
        if (this.activityLog.length === 0) {
            activityList.innerHTML = '<p class="empty-state">No activity logs available</p>';
            return;
        }
        
        const filter = document.getElementById('activity-filter')?.value || 'all';
        const dateFilter = document.getElementById('activity-date-filter')?.value;
        
        let filteredActivities = this.activityLog;
        
        // Filter by category
        if (filter !== 'all') {
            filteredActivities = filteredActivities.filter(activity => activity.category === filter);
        }
        
        // Filter by date
        if (dateFilter) {
            const filterDate = new Date(dateFilter);
            filteredActivities = filteredActivities.filter(activity => {
                const activityDate = new Date(activity.timestamp);
                return activityDate.toDateString() === filterDate.toDateString();
            });
        }
        
        activityList.innerHTML = filteredActivities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas fa-${this.getActivityIcon(activity.category)}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-header">
                        <span class="activity-action">${activity.action}</span>
                        <span class="activity-time">${this.formatTime(activity.timestamp)}</span>
                    </div>
                    <div class="activity-details">${activity.details}</div>
                    <div class="activity-meta">
                        <span class="activity-user">${activity.user}</span>
                        <span class="activity-category">${activity.category}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    getActivityIcon(category) {
        const icons = {
            'authentication': 'sign-in-alt',
            'data': 'database',
            'system': 'cog',
            'general': 'info-circle'
        };
        return icons[category] || 'info-circle';
    }
    
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }

    showSecuritySettings() {
        document.getElementById('security-settings-form').style.display = 'block';
        this.loadSecuritySettings();
    }

    hideSecuritySettings() {
        document.getElementById('security-settings-form').style.display = 'none';
    }

    loadSecuritySettings() {
        // Load current security settings from localStorage or defaults
        const settings = this.getSecuritySettings();
        document.getElementById('password-expiry').value = settings.passwordExpiry;
        document.getElementById('failed-login-limit').value = settings.failedLoginLimit;
    }

    getSecuritySettings() {
        // Get security settings from localStorage or return defaults
        const defaultSettings = {
            passwordExpiry: 90,
            failedLoginLimit: 5
        };

        try {
            const stored = localStorage.getItem('securitySettings');
            return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
        } catch (error) {
            console.error('Error loading security settings:', error);
            return defaultSettings;
        }
    }

    async saveSecuritySettings() {
        try {
            const settings = {
                passwordExpiry: parseInt(document.getElementById('password-expiry').value),
                failedLoginLimit: parseInt(document.getElementById('failed-login-limit').value)
            };

            // Validate settings
            if (settings.passwordExpiry < 30 || settings.passwordExpiry > 365) {
                this.showNotification('Password expiry must be between 30 and 365 days', 'error');
                return;
            }

            if (settings.failedLoginLimit < 3 || settings.failedLoginLimit > 10) {
                this.showNotification('Failed login limit must be between 3 and 10', 'error');
                return;
            }

            // Save to localStorage
            localStorage.setItem('securitySettings', JSON.stringify(settings));

            // Apply settings
            this.applySecuritySettings(settings);

            this.showNotification('Security settings saved successfully', 'success');
            this.hideSecuritySettings();

        } catch (error) {
            console.error('Error saving security settings:', error);
            this.showNotification('Failed to save security settings', 'error');
        }
    }

    applySecuritySettings(settings) {
        // Apply password expiry
        console.log('Password expiry set to:', settings.passwordExpiry, 'days');

        // Apply failed login limit
        console.log('Failed login limit set to:', settings.failedLoginLimit, 'attempts');
    }


    // User Management Methods
    async loadUserManagement() {
        if (this.currentUser.role !== 'super_admin') {
            this.showNotification('Access denied. Super Admin role required.', 'error');
            this.showSection('dashboard');
            return;
        }

        try {
            this.users = await this.fetchData('/api/users');
            this.renderUserManagement();
        } catch (error) {
            console.error('Error loading user management:', error);
            this.showNotification('Error loading user management', 'error');
        }
    }

    renderUserManagement() {
        const userListContent = document.getElementById('user-list-content');
        const resetUserSelect = document.getElementById('reset-user-select');
        
        if (!userListContent || !resetUserSelect) return;

        // Render user list
        userListContent.innerHTML = this.users.map(user => `
            <div class="user-card">
                <div class="user-info">
                    <h4>${user.username}</h4>
                    <span class="user-role">${user.role.replace('_', ' ').toUpperCase()}</span>
                </div>
                <div class="user-actions">
                    <button class="btn btn-sm btn-secondary" onclick="app.selectUserForReset('${user.username}')">
                        <i class="fas fa-key"></i> Reset Password
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="app.deleteUser('${user.username}')" ${user.username === this.currentUser?.username ? 'disabled' : ''}>
                        <i class="fas fa-trash"></i> Delete User
                    </button>
                </div>
            </div>
        `).join('');

        // Populate reset user select
        resetUserSelect.innerHTML = '<option value="">Choose a user...</option>' + 
            this.users.map(user => `<option value="${user.username}">${user.username} (${user.role.replace('_', ' ').toUpperCase()})</option>`).join('');
    }

    selectUserForReset(username) {
        const resetUserSelect = document.getElementById('reset-user-select');
        if (resetUserSelect) {
            resetUserSelect.value = username;
        }
    }

    async resetUserPassword() {
        const selectedUser = document.getElementById('reset-user-select').value;
        const newPassword = document.getElementById('new-password-reset').value;
        const confirmPassword = document.getElementById('confirm-password-reset').value;

        if (!selectedUser) {
            this.showNotification('Please select a user', 'error');
            return;
        }

        if (!newPassword || !confirmPassword) {
            this.showNotification('Please enter and confirm the new password', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            this.showNotification('Password confirmation does not match', 'error');
            return;
        }

        if (newPassword.length < 6) {
            this.showNotification('Password must be at least 6 characters long', 'error');
            return;
        }

        try {
            // Find user ID
            const user = this.users.find(u => u.username === selectedUser);
            if (!user) {
                this.showNotification('User not found', 'error');
                return;
            }

            const response = await fetch('/api/admin/reset-password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: selectedUser,
                    newPassword: newPassword
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to reset password');
            }

            this.showNotification(`Password reset successfully for ${selectedUser}`, 'success');
            
            // Clear form
            document.getElementById('reset-user-select').value = '';
            document.getElementById('new-password-reset').value = '';
            document.getElementById('confirm-password-reset').value = '';
        } catch (error) {
            console.error('Error resetting password:', error);
            this.showNotification(`Error resetting password: ${error.message}`, 'error');
        }
    }

    async deleteUser(username) {
        // Prevent deleting own account
        if (username === this.currentUser?.username) {
            this.showNotification('Cannot delete your own account', 'error');
            return;
        }

        // Confirmation dialog
        const confirmed = confirm(`Are you sure you want to delete user "${username}"?\n\nThis action cannot be undone and will permanently remove the user account.`);
        if (!confirmed) {
            return;
        }

        try {
            // Find user ID
            const user = this.users.find(u => u.username === username);
            if (!user) {
                this.showNotification('User not found', 'error');
                return;
            }

            const response = await fetch(`/api/admin/delete-user/${user.id || user.username}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete user');
            }

            this.showNotification(`User "${username}" deleted successfully`, 'success');
            
            // Refresh user list
            this.users = await this.fetchData('/api/users');
            this.renderUserManagement();
            
        } catch (error) {
            console.error('Error deleting user:', error);
            this.showNotification(`Error deleting user: ${error.message}`, 'error');
        }
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Initializing app...');
    try {
        window.app = new EstateManagementApp();
        console.log('App initialized successfully');
    } catch (error) {
        console.error('Error initializing app:', error);
        // Create a minimal app instance for emergency login
        window.app = {
            simpleLogin: async function() {
                try {
                    const response = await fetch('/api/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ username: 'test', password: 'admin123' })
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        console.log('Emergency login successful:', data);
                        alert('Login successful! Please refresh the page.');
                        window.location.reload();
                    } else {
                        const errorData = await response.json();
                        alert(`Login failed: ${errorData.error}`);
                    }
                } catch (error) {
                    console.error('Emergency login error:', error);
                    alert(`Login error: ${error.message}`);
                }
            }
        };
    }
});
