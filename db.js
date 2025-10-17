const sql = require('mssql');

// Environment-driven config with sensible defaults for SQL Server/Express
// Note: (localdb) is not supported by 'tedious'. Use localhost or .\\SQLEXPRESS via SQL_SERVER/SQL_INSTANCE.
const config = {
	server: process.env.SQL_SERVER || 'localhost',
	database: process.env.SQL_DATABASE || 'HTHEstate',
	user: process.env.SQL_USER || undefined,
	password: process.env.SQL_PASSWORD || undefined,
	port: process.env.SQL_PORT ? parseInt(process.env.SQL_PORT, 10) : undefined,
	options: {
		instanceName: process.env.SQL_INSTANCE || undefined, // e.g. 'SQLEXPRESS'
		trustServerCertificate: true,
		enableArithAbort: true
	}
};

let poolPromise;

async function getPool() {
	if (!poolPromise) {
		poolPromise = new sql.ConnectionPool(config)
			.connect()
			.then(pool => {
				console.log('Connected to SQL Server', { server: config.server, instance: config.options.instanceName, database: config.database });
				return pool;
			})
			.catch(err => {
				console.error('SQL Server connection error:', err);
				console.error('Tried config:', { server: config.server, instance: config.options.instanceName, database: config.database, port: config.port });
				poolPromise = undefined;
				throw err;
			});
	}
	return poolPromise;
}

module.exports = { sql, getPool };


