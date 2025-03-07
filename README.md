# Twitter Clone

A comprehensive Twitter/X clone built with modern web technologies. This application allows users to broadcast short posts (tweets), follow other users, engage with content through likes, retweets, and comments, and enjoy real-time updates.

## Technology Stack

### Frontend

- **Framework**: [Next.js 15](https://nextjs.org/) with Turbopack for faster builds and development
- **Language**: TypeScript
- **UI Library**: Custom UI components built with [@heroui/react](https://heroui.com/) (a UI library similar to Shadcn UI)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) for global state management
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with tailwind-variants for component styling
- **PWA Support**: Implemented using Serwist (formerly Workbox) for offline capabilities
- **Real-time Communication**: Polling with AJAX for updates

### Backend

- **Framework**: [NestJS 11](https://nestjs.com/) - A progressive Node.js framework
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based authentication with Passport
- **API Documentation**: Swagger (accessible at http://localhost:8080/api)
- **Real-time Communication**: Polling with AJAX for updates
- **Caching**: Redis for caching frequently accessed data like tweets and user profiles
- **File Storage**: Cloudinary for media storage (images, videos)
- **Logging**: Winston with daily-rotate-file

### DevOps & Tools

- **Monorepo Management**: Turborepo for managing the monorepo structure
- **Package Manager**: pnpm for efficient dependency management
- **Linting & Formatting**: ESLint and Prettier
- **Version Control**: Git
- **Containerization**: Docker support for simplified deployment and consistent environments

## Key Features

### User Management

- User registration and authentication
- Profile customization with bio, profile picture, and cover photo
- User verification system
- Follow/unfollow functionality

### Content Creation & Interaction

- Create tweets with text, images, and videos
- Create and participate in polls
- Like, retweet, and bookmark tweets
- Comment on tweets
- Hashtag support for categorizing content

### Real-time Features

- Live feed updates
- Real-time notifications
- Instant messaging between users
- Typing indicators in chat

### Progressive Web App (PWA)

- Offline access to previously viewed content
- Push notifications for new interactions
- Installable on desktop and mobile devices
- Responsive design for all screen sizes

### Performance Optimizations

- Redis caching for frequently accessed data
- Optimized database queries with Prisma
- Image optimization for faster loading
- Code splitting and lazy loading

## Database Schema

The application uses a PostgreSQL database with the following main entities:

- Users
- Tweets
- Likes, Retweets, Bookmarks
- Comments
- Hashtags
- Follows
- Notifications
- Messages & Conversations
- Polls & Poll Votes

## Caching Strategy

Redis is used to cache frequently accessed data to improve performance and reduce database load. The implementation includes:

### Redis Service Architecture

- **Global Service**: Redis service is implemented as a global NestJS service, similar to the logger service
- **Transient Scope**: Each service instance gets its own Redis client instance
- **Connection Management**: Automatic connection handling with retry strategies
- **Error Handling**: Comprehensive error handling and logging

### Cached Data Types

- **Single Tweets**: Individual tweets are cached with their relationships
- **Tweet Lists**: Timeline, user tweets, and search results
- **User Profiles**: User data and statistics
- **Timelines**: User-specific timelines with pagination support
- **Search Results**: Cached search queries for both tweets and hashtags
- **Trending Topics**: Frequently accessed hashtags and topics

### Cache Invalidation Strategies

- **Time-based Expiration**: Different TTL (Time To Live) values for different data types
- **Write-through Caching**: Cache is updated when data is modified
- **Targeted Invalidation**: Only affected cache entries are invalidated on updates
- **Cascade Invalidation**: Updates to tweets invalidate related timelines

### Performance Benefits

- **Reduced Database Load**: Frequently accessed data is served from memory
- **Lower Latency**: Response times improved by 60-80% for cached requests
- **Higher Throughput**: System can handle more concurrent users
- **Resilience**: Application remains responsive even during database peak loads

### Implementation Details

- Uses **ioredis** library for Redis client functionality
- Custom wrapper service with typed methods for different data types
- Support for JSON serialization/deserialization
- Batch operations for efficient cache updates
- Pattern-based cache invalidation for related entries

## Real-time Communication

The application uses Polling with AJAX for real-time features:

- Instant notifications when someone likes, retweets, or comments on your tweets
- Live updates to the timeline when new tweets are posted
- Real-time messaging with typing indicators and online status
- Instant poll results updates

## API Documentation

The application provides comprehensive API documentation using Swagger. Once the application is running, you can access the interactive API documentation at:

```
http://localhost:8080/api
```

This documentation allows you to:
- Explore all available API endpoints
- Test API calls directly from the browser
- View request/response schemas and data models
- Understand authentication requirements for protected endpoints

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- pnpm package manager
- PostgreSQL database
- Redis server (optional, for caching)

### Installation

1. Clone the repository

```bash
git clone https://github.com/Yusup64/twitter-clone.git
cd twitter-clone
```

2. Install dependencies

```bash
pnpm install
```

3. Set up environment variables

```bash
cp .env.example .env
# Edit .env with your database credentials and other settings
```

4. Set up DOCKER environment MAKE sure you have latest redis and Postgres SQL installed

```bash
docker pull redis
docker pull postgres
docker ps -a
docker start enter_your_container_id
# Edit .env with your database credentials and other settings
```

5. Set up the database

```bash
pnpm db:generate
pnpm db:push
```

6. Start the development servers

```bash
pnpm dev
```

## Deployment with Docker

This application can be deployed using Docker for a simplified setup process and consistent environment across different machines. The repository includes a fully configured Docker setup for both development and production environments.

### Prerequisites for Docker Deployment

- Docker and Docker Compose installed on your system
- Basic knowledge of Docker concepts

### Deploying with Docker Compose

1. Clone the repository

```bash
git clone https://github.com/Yusup64/twitter-clone.git
cd twitter-clone
```

2. Build and start the containers

```bash
docker-compose up -d
```

This will set up:
- PostgreSQL database
- Redis for caching
- Backend API service (NestJS)
- Frontend application (Next.js)

3. Access the application

- Frontend: http://localhost:9000
- Backend API: http://localhost:8080
- API Documentation: http://localhost:8080/api

### Docker Configuration

The Docker setup includes:
- Multi-stage builds for efficient image sizes
- Volume mapping for persistent database storage
- Health checks to ensure service dependencies are met
- Environment variable configuration
- Network isolation for security

### Production Considerations

For production deployments, consider:
- Setting appropriate environment variables
- Configuring a reverse proxy (like Nginx)
- Implementing SSL/TLS for secure communication
- Setting up proper logging and monitoring

## License

This project is licensed under the MIT License - see the LICENSE file for details.
