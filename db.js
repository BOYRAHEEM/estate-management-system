const mysql = require('mysql2/promise');

// Environment-driven config for MySQL
const config = {
	host: process.env.MYSQL_HOST || 'localhost',
	user: process.env.MYSQL_USER || 'root',
	password: process.env.MYSQL_PASSWORD || 'HTH_Server1',
	database: process.env.MYSQL_DB || 'hospital_estate',
	port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT, 10) : 3306,

	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0
};

let pool;

async function getPool() {
	if (!pool) {
		pool = mysql.createPool(config);
		// simple test connection
		await pool.query('SELECT 1');
		console.log('Connected to MySQL', { host: config.host, database: config.database });
	}
	return pool;
}

module.exports = { getPool };


