import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const pool = new Pool({
    user: process.env.DB_USER || 'teammanager_user',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'teammanager_db',
    password: process.env.DB_PASS || 'securepassword123',
    port: Number(process.env.DB_PORT) || 5432,
});
export default pool;
//# sourceMappingURL=db.js.map