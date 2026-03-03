# api_con

A Node.js api project built with TypeScript and Firebase Functions.

## Features

- Express.js server with TypeScript
- Firebase Functions integration
- Socket.io for real-time communication
- MongoDB with Mongoose
- Authentication system
- Email notifications
- Cron jobs
- Audit logging

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   - Copy `.env.example` to `.env.development`
   - Set `NODE_ENV=development` in `.env.development`
   - Update the values according to your configuration

3. Start development server:
   ```bash
   npm start
   ```

## Available Scripts

- `npm start` - Start development server
- `npm run build:dev` - Build for development
- `npm run build:prod` - Build for production
- `npm run deploy` - Deploy to Firebase

## Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── entities/        # Database entities
├── helpers/         # Utility functions
├── routes/          # API routes
├── schemas/         # Validation schemas
├── server/          # Server setup
└── services/        # Business logic
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT
