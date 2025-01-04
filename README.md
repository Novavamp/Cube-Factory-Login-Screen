# Cube Factory Login Page Replica

## Overview

This web application is a replica of the Cube Factory login page. It demonstrates user authentication functionality with a clean and intuitive interface. The app supports user registration, local login, and Google OAuth 2.0 for seamless authentication. Built with modern web technologies, it ensures secure user data management and session handling.

## Features

- **User Registration**: Sign up with an email and password.
- **User Login**: Login through local authentication or Google OAuth 2.0.
- **Secure Authentication**: Passwords are hashed with bcrypt for enhanced security.
- **Persistent Sessions**: Users remain logged in until they explicitly log out or the session expires.
- **PostgreSQL Integration**: User data is securely stored and managed in a PostgreSQL database.
- **Dynamic UI Rendering**: Uses EJS for rendering dynamic content.
- **Logout Functionality**: Users can securely log out of their sessions.

## Technologies Used

- **Backend**: Node.js, Express.js
- **Authentication**: Passport.js (Local and Google strategies)
- **Database**: PostgreSQL
- **Security**: bcrypt for password hashing, dotenv for environment variable management
- **Session Management**: express-session
- **Frontend**: EJS templates for dynamic views

## Database Schema

The application uses the following database schema:

```sql
CREATE TABLE users(
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    firstname VARCHAR(100),
    lastname VARCHAR(100),
    password VARCHAR(100),
    photo_url TEXT
);
```

## Prerequisites

Ensure you have the following installed on your system:

- Node.js (v16 or above)
- npm (v8 or above)
- PostgreSQL (v13 or above)

## Installation and Setup

1. **Clone the repository**:

   ```bash
   git clone https://github.com/Novavamp/Cube-Factory-Login-Screen
   cd Cube-Factory-Login-Screen
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Set up the environment variables**:  
   Create a `.env` file in the project root with the following configuration:

   ```env
   SESSION_SECRET=your_session_secret
   PG_USER=your_postgresql_user
   PG_PASSWORD=your_postgresql_password
   PG_HOST=your_postgresql_host
   PG_PORT=your_postgresql_port
   PG_DATABASE=your_postgresql_database
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

4. **Set up the database**:

   - Open your PostgreSQL client and create a database.
   - Run the `CREATE TABLE` command provided in the "Database Schema" section.

5. **Run the application**:

   ```bash
   npm start
   ```

6. **Access the application**:  
   Navigate to `http://localhost:3000` in your browser.

## Usage

### Key Routes

- `/`: Displays the login page.
- `/register`: Provides a registration form for new users.
- `/home`: Redirects authenticated users to their dashboard.
- `/auth/google`: Initiates Google OAuth authentication.
- `/auth/google/home`: Callback route for Google authentication.
- `/logout`: Logs the user out and ends the session.

## License

This project is for educational purposes and is not affiliated with or endorsed by Cube Factory. It is intended as a replica for learning and demonstration.

## Author

[Precious Okechukwu Nwosu](mailto:preciousgabraels2@gmail.com)  
[Portfolio](https://preciousgabraels.digi9ja.com.ng)
