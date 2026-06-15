const mysql = require('mysql2/promise');

// ─── MySQL Connection Pool ─────────────────────────────────────────────────────
let pool = null;

const connectMySQL = async () => {
  try {
    pool = mysql.createPool({
      host:     process.env.MYSQL_HOST     || 'localhost',
      port:     Number(process.env.MYSQL_PORT) || 3306,
      user:     process.env.MYSQL_USER     || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'shiptrack_pro',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      // Security: disable multiple statements to prevent SQL injection
      multipleStatements: false,
    });

    // Test connection
    const connection = await pool.getConnection();
    console.log('✅ MySQL Connected:', `${process.env.MYSQL_HOST || 'localhost'}:${process.env.MYSQL_PORT || 3306}/${process.env.MYSQL_DATABASE || 'shiptrack_pro'}`);
    connection.release();

    return pool;
  } catch (err) {
    console.warn('⚠️  MySQL connection failed (non-fatal):', err.message);
    console.warn('   → MySQL features will be disabled. Set MYSQL_* env vars to enable.');
    pool = null;
    return null;
  }
};

// ─── Get Pool ─────────────────────────────────────────────────────────────────
const getPool = () => pool;

// ─── Execute Query (parameterized — prevents SQL injection) ───────────────────
const query = async (sql, params = []) => {
  if (!pool) throw new Error('MySQL not connected');
  const [rows] = await pool.execute(sql, params);
  return rows;
};

// ─── Initialize Tables ────────────────────────────────────────────────────────
const initTables = async () => {
  if (!pool) return;

  try {
    // Roles table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS roles (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        name        VARCHAR(50)   NOT NULL UNIQUE,
        description TEXT,
        permissions JSON,
        is_active   TINYINT(1)    DEFAULT 1,
        created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Users table (relational mirror of MongoDB users)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users_relational (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        mongo_id      VARCHAR(24)   NOT NULL UNIQUE COMMENT 'MongoDB ObjectId reference',
        name          VARCHAR(100)  NOT NULL,
        email         VARCHAR(150)  NOT NULL UNIQUE,
        role          ENUM('admin','manager','staff') DEFAULT 'staff',
        company_name  VARCHAR(150),
        is_active     TINYINT(1)    DEFAULT 1,
        last_login    TIMESTAMP     NULL,
        created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
        updated_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_role  (role),
        INDEX idx_mongo_id (mongo_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Permissions table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS permissions (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        role_id     INT           NOT NULL,
        resource    VARCHAR(100)  NOT NULL COMMENT 'e.g. shipments, users, reports',
        action      VARCHAR(50)   NOT NULL COMMENT 'e.g. create, read, update, delete',
        is_allowed  TINYINT(1)    DEFAULT 1,
        created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        UNIQUE KEY unique_perm (role_id, resource, action)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Financial transactions table (ACID compliant with InnoDB)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS financial_transactions (
        id              INT AUTO_INCREMENT PRIMARY KEY,
        transaction_ref VARCHAR(50)  NOT NULL UNIQUE,
        invoice_number  VARCHAR(50),
        tracking_id     VARCHAR(20),
        sender_name     VARCHAR(100),
        receiver_name   VARCHAR(100),
        amount          DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        tax             DECIMAL(12,2)           DEFAULT 0.00,
        total_amount    DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        currency        VARCHAR(10)   DEFAULT 'INR',
        status          ENUM('pending','paid','overdue','cancelled','refunded') DEFAULT 'pending',
        payment_method  VARCHAR(50),
        due_date        DATE,
        paid_at         TIMESTAMP     NULL,
        created_by      VARCHAR(24)   COMMENT 'MongoDB user ObjectId',
        created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
        updated_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_tracking  (tracking_id),
        INDEX idx_status    (status),
        INDEX idx_created   (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Audit log table (SQL version — for ACID compliance)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS audit_logs_sql (
        id          BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id     VARCHAR(24)   COMMENT 'MongoDB user ObjectId',
        user_name   VARCHAR(100),
        user_role   VARCHAR(50),
        action      VARCHAR(100)  NOT NULL,
        resource    VARCHAR(100),
        resource_id VARCHAR(50),
        description TEXT,
        ip_address  VARCHAR(45),
        status      ENUM('success','failure') DEFAULT 'success',
        created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user    (user_id),
        INDEX idx_action  (action),
        INDEX idx_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Seed default roles
    await pool.execute(`
      INSERT IGNORE INTO roles (name, description, permissions) VALUES
      ('admin',   'Full system access',        '{"shipments":["create","read","update","delete"],"users":["create","read","update","delete"],"reports":["read","generate"],"audit_logs":["read"],"finance":["read","manage"]}'),
      ('manager', 'Company/fleet manager',     '{"shipments":["create","read","update"],"reports":["read","generate"],"ships":["create","read","update","delete"],"crew":["create","read","update","delete"]}'),
      ('staff',   'Delivery/operations staff', '{"shipments":["read","update_status"],"deliveries":["read","update"]}');
    `);

    // Seed default permissions
    const [roles] = await pool.execute('SELECT id, name FROM roles');
    for (const role of roles) {
      const perms = role.name === 'admin'
        ? [
            ['shipments','create'],['shipments','read'],['shipments','update'],['shipments','delete'],
            ['users','create'],['users','read'],['users','update'],['users','delete'],
            ['reports','read'],['reports','generate'],
            ['audit_logs','read'],
            ['finance','read'],['finance','manage'],
          ]
        : role.name === 'manager'
        ? [
            ['shipments','create'],['shipments','read'],['shipments','update'],
            ['reports','read'],['reports','generate'],
            ['ships','create'],['ships','read'],['ships','update'],['ships','delete'],
            ['crew','create'],['crew','read'],['crew','update'],['crew','delete'],
          ]
        : [
            ['shipments','read'],['shipments','update_status'],
            ['deliveries','read'],['deliveries','update'],
          ];

      for (const [resource, action] of perms) {
        await pool.execute(
          'INSERT IGNORE INTO permissions (role_id, resource, action) VALUES (?, ?, ?)',
          [role.id, resource, action]
        );
      }
    }

    console.log('✅ MySQL tables initialized successfully');
  } catch (err) {
    console.error('❌ MySQL table init error:', err.message);
  }
};

module.exports = { connectMySQL, getPool, query, initTables };
