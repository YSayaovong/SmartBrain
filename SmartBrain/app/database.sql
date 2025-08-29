-- Create database manually then run these in psql:
-- CREATE DATABASE smartbrain;
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  entries INTEGER DEFAULT 0,
  joined TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS login (
  id SERIAL PRIMARY KEY,
  hash TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL
);
