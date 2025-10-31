const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn(
    "[database] Variável de ambiente DATABASE_URL não definida. Defina antes de iniciar o servidor."
  );
}

const pool = new Pool({
  connectionString,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : undefined,
});

pool.on("error", (error) => {
  console.error("[database] Erro inesperado no pool", error);
});

const query = (text, params) => pool.query(text, params);

module.exports = {
  pool,
  query,
};

