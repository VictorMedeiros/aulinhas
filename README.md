# Aulinhas

A teaching management system that helps track students, classes, and income.

## Features

- User authentication with Google
- Student management
- Class scheduling
- Income reports
- User-specific data isolation

## Setup

### Prerequisites

- Node.js v14 or higher
- MySQL database
- Google Cloud Platform account

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/aulinhas.git
   cd aulinhas
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Set up environment variables
   ```
   cp .env.example .env
   ```
   Edit `.env` with your database credentials and Google OAuth information

4. Set up the database
   ```
   npx prisma migrate dev
   ```

5. Start the development server
   ```
   npm run dev
   ```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Navigate to "APIs & Services" > "OAuth consent screen"
   - Choose "External" user type
   - Fill in the required app information
4. Go to "APIs & Services" > "Credentials"
   - Create OAuth client ID
   - Application type: Web application
   - Add authorized redirect URIs:
     - Development: `http://localhost:3000/auth/google/callback`
     - Production: `https://your-domain.com/auth/google/callback`
5. Copy the Client ID and Client Secret to your `.env` file

## Development

- Run `npm run dev` to start the development server
- Run `npm run build` to create a production build
- Run `npm start` to start the production server

## License

[MIT](LICENSE)
