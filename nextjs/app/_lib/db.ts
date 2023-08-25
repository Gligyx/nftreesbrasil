import { Pool } from 'pg';

let postgres: Pool | undefined;

if (!postgres) {
  postgres = new Pool({
    user: process.env.PGSQL_USER,
    password: process.env.PGSQL_PASSWORD,
    host: process.env.PGSQL_HOST,
    port: Number(process.env.PGSQL_PORT),
    database: process.env.PGSQL_DATABASE,
  })
}

export default postgres;