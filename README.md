# Smart Task Manager - Backend API

A production-ready Node.js + TypeScript backend for an intelligent task management system that automatically classifies and organizes tasks based on content analysis.

## 🌟 Features

- **Intelligent Auto-Classification**: Automatically detects task category, priority, entities, and suggests actions
- **RESTful API**: 5 core endpoints with comprehensive CRUD operations
- **Advanced Filtering**: Filter tasks by status, category, priority, and search text
- **Pagination & Sorting**: Efficient data retrieval with customizable sorting
- **Task History**: Complete audit trail of all task changes
- **Input Validation**: Robust validation using Zod
- **Error Handling**: Comprehensive error handling with meaningful messages
- **Rate Limiting**: Protection against abuse
- **Security**: Helmet, CORS, and security best practices
- **Logging**: Winston-based structured logging
- **Type Safety**: Full TypeScript implementation
- **Testing**: Unit tests for classification logic
- **Database**: PostgreSQL/Supabase with optimized indexes

## 📋 Table of Contents

- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Database Setup](#database-setup)
- [API Documentation](#api-documentation)
- [Classification System](#classification-system)
- [Testing](#testing)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)
- [Architecture](#architecture)

## 🛠 Tech Stack

- **Runtime**: Node.js (v18+)
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (via Supabase)
- **Validation**: Zod
- **Testing**: Jest
- **Logging**: Winston
- **Security**: Helmet, CORS, express-rate-limit
- **Date Parsing**: chrono-node

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Supabase account (or PostgreSQL database)

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd TaskManagement_Backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
NODE_ENV=development
PORT=3000

SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

JWT_SECRET=your_secret_key_min_32_characters
JWT_EXPIRES_IN=7d

ALLOWED_ORIGINS=*
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

4. **Set up the database**

Run the SQL schema in your Supabase SQL editor:
```bash
# Copy contents of database/schema.sql and run in Supabase SQL Editor
```

5. **Start the development server**
```bash
npm run dev
```

The server will start at `http://localhost:3000`

### Production Build

```bash
npm run build
npm start
```

## 🗄 Database Setup

### Using Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor
3. Copy and paste the contents of `database/schema.sql`
4. Run the SQL script
5. Get your credentials from Settings > API

### Database Schema

**Tasks Table**
```sql
tasks (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT (scheduling|finance|technical|safety|general),
  priority TEXT (high|medium|low),
  status TEXT (pending|in_progress|completed),
  assigned_to TEXT,
  due_date TIMESTAMP,
  extracted_entities JSONB,
  suggested_actions JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

**Task History Table**
```sql
task_history (
  id UUID PRIMARY KEY,
  task_id UUID REFERENCES tasks(id),
  action TEXT (created|updated|status_changed|completed),
  old_value JSONB,
  new_value JSONB,
  changed_by TEXT,
  changed_at TIMESTAMP
)
```

## 📚 API Documentation

Base URL: `http://localhost:3000/api`

### Health Check

```http
GET /health
```

**Response**
```json
{
  "success": true,
  "message": "Server is healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development"
}
```

### 1. Create Task

```http
POST /api/tasks
```

**Request Body**
```json
{
  "title": "Schedule urgent meeting with team today about budget allocation",
  "description": "Need to discuss Q4 budget and resource planning",
  "assigned_to": "John Smith",
  "due_date": "2024-12-25T10:00:00Z"
}
```

**Response** (201 Created)
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "task": {
      "id": "uuid",
      "title": "Schedule urgent meeting with team today about budget allocation",
      "description": "Need to discuss Q4 budget and resource planning",
      "category": "scheduling",
      "priority": "high",
      "status": "pending",
      "assigned_to": "John Smith",
      "due_date": "2024-12-25T10:00:00Z",
      "extracted_entities": {
        "dates": ["today"],
        "persons": ["team", "John Smith"],
        "actionVerbs": ["schedule", "discuss"]
      },
      "suggested_actions": [
        "Block calendar",
        "Send invite",
        "Prepare agenda",
        "Set reminder"
      ],
      "created_at": "2024-12-23T00:00:00Z",
      "updated_at": "2024-12-23T00:00:00Z"
    },
    "classification": {
      "auto_category": "scheduling",
      "auto_priority": "high",
      "was_overridden": {
        "category": false,
        "priority": false
      }
    }
  }
}
```

### 2. Get All Tasks

```http
GET /api/tasks?status=pending&category=scheduling&priority=high&search=meeting&limit=20&offset=0&sortBy=created_at&sortOrder=desc
```

**Query Parameters**
- `status` (optional): `pending` | `in_progress` | `completed`
- `category` (optional): `scheduling` | `finance` | `technical` | `safety` | `general`
- `priority` (optional): `high` | `medium` | `low`
- `assigned_to` (optional): Filter by assignee name
- `search` (optional): Search in title and description
- `limit` (optional): Number of results (1-100, default: 20)
- `offset` (optional): Pagination offset (default: 0)
- `sortBy` (optional): Field to sort by (default: `created_at`)
- `sortOrder` (optional): `asc` | `desc` (default: `desc`)

**Response** (200 OK)
```json
{
  "success": true,
  "message": "Tasks retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "title": "Task title",
      "description": "Task description",
      "category": "scheduling",
      "priority": "high",
      "status": "pending",
      "assigned_to": "John Smith",
      "due_date": "2024-12-25T10:00:00Z",
      "extracted_entities": {},
      "suggested_actions": [],
      "created_at": "2024-12-23T00:00:00Z",
      "updated_at": "2024-12-23T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 50,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

### 3. Get Task by ID

```http
GET /api/tasks/:id
```

**Response** (200 OK)
```json
{
  "success": true,
  "message": "Task retrieved successfully",
  "data": {
    "task": {
      "id": "uuid",
      "title": "Task title",
      ...
    },
    "history": [
      {
        "id": "uuid",
        "task_id": "uuid",
        "action": "created",
        "old_value": null,
        "new_value": {...},
        "changed_by": null,
        "changed_at": "2024-12-23T00:00:00Z"
      }
    ]
  }
}
```

### 4. Update Task

```http
PATCH /api/tasks/:id
```

**Request Body** (all fields optional)
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "category": "technical",
  "priority": "medium",
  "status": "in_progress",
  "assigned_to": "Jane Doe",
  "due_date": "2024-12-26T10:00:00Z"
}
```

**Response** (200 OK)
```json
{
  "success": true,
  "message": "Task updated successfully",
  "data": {
    "task": {...}
  }
}
```

### 5. Delete Task

```http
DELETE /api/tasks/:id
```

**Response** (200 OK)
```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

### 6. Get Statistics (Bonus)

```http
GET /api/tasks/statistics
```

**Response** (200 OK)
```json
{
  "success": true,
  "message": "Statistics retrieved successfully",
  "data": {
    "total": 100,
    "byStatus": {
      "pending": 50,
      "in_progress": 30,
      "completed": 20
    },
    "byCategory": {
      "scheduling": 25,
      "finance": 20,
      "technical": 30,
      "safety": 15,
      "general": 10
    },
    "byPriority": {
      "high": 30,
      "medium": 40,
      "low": 30
    }
  }
}
```

## 🤖 Classification System

The system automatically analyzes task content to determine:

### Category Detection

Based on keyword matching:

- **Scheduling**: meeting, schedule, call, appointment, deadline
- **Finance**: payment, invoice, bill, budget, cost, expense
- **Technical**: bug, fix, error, install, repair, maintain
- **Safety**: safety, hazard, inspection, compliance, PPE
- **General**: Default when no keywords match

### Priority Detection

- **High**: urgent, asap, immediately, today, critical, emergency
- **Medium**: soon, this week, important
- **Low**: Default

### Entity Extraction

- **Dates/Times**: Using chrono-node for natural language date parsing
- **Persons**: After keywords like "with", "by", "assign to"
- **Locations**: Room numbers, building names, etc.
- **Action Verbs**: schedule, prepare, review, complete, etc.

### Suggested Actions

Auto-generated based on category:

```javascript
{
  "scheduling": ["Block calendar", "Send invite", "Prepare agenda", "Set reminder"],
  "finance": ["Check budget", "Get approval", "Generate invoice", "Update records"],
  "technical": ["Diagnose issue", "Check resources", "Assign technician", "Document fix"],
  "safety": ["Conduct inspection", "File report", "Notify supervisor", "Update checklist"],
  "general": ["Review details", "Assign owner", "Set deadline", "Track progress"]
}
```

## 🧪 Testing

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Test coverage
```bash
npm test -- --coverage
```

### Test Files

- `src/services/__tests__/classificationService.test.ts` - Classification logic tests

## 🚢 Deployment

### Deploy to Render

1. **Push to GitHub**
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Create Render Service**
   - Go to [render.com](https://render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Render will auto-detect the `render.yaml` configuration

3. **Set Environment Variables**
   - Add your Supabase credentials
   - JWT_SECRET will be auto-generated
   - Configure ALLOWED_ORIGINS for CORS

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete

### Manual Deployment

```bash
# Build the project
npm run build

# Set environment variables
export NODE_ENV=production
export PORT=3000
export SUPABASE_URL=your_url
export SUPABASE_SERVICE_ROLE_KEY=your_key
export JWT_SECRET=your_secret

# Start the server
npm start
```

## 🔐 Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| NODE_ENV | Environment mode | Yes | development |
| PORT | Server port | Yes | 3000 |
| SUPABASE_URL | Supabase project URL | Yes | - |
| SUPABASE_ANON_KEY | Supabase anonymous key | Yes | - |
| SUPABASE_SERVICE_ROLE_KEY | Supabase service role key | Yes | - |
| JWT_SECRET | JWT signing secret (min 32 chars) | Yes | - |
| JWT_EXPIRES_IN | JWT expiration time | No | 7d |
| ALLOWED_ORIGINS | CORS allowed origins (comma-separated) | No | * |
| RATE_LIMIT_WINDOW_MS | Rate limit window in ms | No | 900000 |
| RATE_LIMIT_MAX_REQUESTS | Max requests per window | No | 100 |

## 🏗 Architecture

### Project Structure

```
TaskManagement_Backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── database.ts   # Supabase client setup
│   │   └── env.ts        # Environment validation
│   ├── controllers/      # Request handlers
│   │   └── taskController.ts
│   ├── middleware/       # Express middleware
│   │   ├── errorHandler.ts
│   │   └── validateRequest.ts
│   ├── repositories/     # Data access layer
│   │   └── taskRepository.ts
│   ├── routes/          # API routes
│   │   └── taskRoutes.ts
│   ├── services/        # Business logic
│   │   ├── classificationService.ts
│   │   └── __tests__/
│   ├── types/           # TypeScript types
│   │   └── index.ts
│   ├── utils/           # Utilities
│   │   ├── errors.ts
│   │   └── logger.ts
│   ├── validators/      # Zod schemas
│   │   └── taskValidator.ts
│   ├── app.ts          # Express app setup
│   └── server.ts       # Server entry point
├── database/
│   └── schema.sql      # Database schema
├── package.json
├── tsconfig.json
├── jest.config.js
├── render.yaml         # Render deployment config
└── README.md
```

### Architecture Decisions

1. **Layered Architecture**
   - Controllers: Handle HTTP requests/responses
   - Services: Business logic and classification
   - Repositories: Database operations
   - Clear separation of concerns

2. **Type Safety**
   - Full TypeScript implementation
   - Zod for runtime validation
   - Prevents type-related bugs

3. **Error Handling**
   - Custom error classes
   - Global error handler
   - Consistent error responses

4. **Database Design**
   - Normalized schema
   - Proper indexes for performance
   - JSONB for flexible data (entities, actions)
   - Audit trail via history table

5. **Security**
   - Helmet for HTTP headers
   - CORS configuration
   - Rate limiting
   - Input validation
   - Environment variable validation

6. **Scalability**
   - Pagination support
   - Efficient queries with indexes
   - Stateless design
   - Ready for horizontal scaling

## 🎯 What I'd Improve

Given more time, I would add:

1. **Authentication & Authorization**
   - JWT-based user authentication
   - Role-based access control (RBAC)
   - User management endpoints

2. **Advanced Features**
   - WebSocket support for real-time updates
   - Task attachments and file uploads
   - Email notifications for due dates
   - Task dependencies and subtasks
   - Recurring tasks

3. **AI Enhancements**
   - Integration with LLM (GPT-4, Claude) for better classification
   - Sentiment analysis
   - Automatic task prioritization based on context
   - Smart deadline suggestions

4. **Performance**
   - Redis caching layer
   - Database query optimization
   - Response compression
   - CDN for static assets

5. **Monitoring & Observability**
   - APM integration (DataDog, New Relic)
   - Distributed tracing
   - Performance metrics
   - Health checks for dependencies

6. **Testing**
   - Integration tests
   - E2E tests
   - Load testing
   - API contract testing

7. **Documentation**
   - Swagger/OpenAPI specification
   - Interactive API documentation
   - Postman collection
   - Architecture diagrams

8. **DevOps**
   - Docker containerization
   - CI/CD pipeline (GitHub Actions)
   - Automated testing
   - Database migrations
   - Environment-specific configs

## 📝 License

MIT

## 👤 Author

Built as part of the Backend + Flutter Hybrid Developer Assessment

---

**Note**: This is a production-ready backend that follows best practices for Node.js/TypeScript development. It's designed to be easily deployed to Render and integrated with a Flutter mobile app.
