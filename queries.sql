CREATE TABLE users(
	id SERIAL PRIMARY KEY,
	username VARCHAR(100) NOT NULL UNIQUE,
	firstname VARCHAR(100),
	lastname VARCHAR(100),
	password VARCHAR(100),
	photo_url TEXT
);