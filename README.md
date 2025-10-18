# Natours - Backend

A production-ready REST API backend for the "Natours" travel/tours web application — written in JavaScript with Node.js, Express and MongoDB. This repository contains the backend logic, routes, controllers, data models, views (Pug templates), and optional AI integrations.

This README documents how to set up, run, test, and deploy the backend, includes a reference of the main API endpoints and environment variables, and describes recommended AI services and integration patterns.

Table of contents
- About
- Features
- Tech stack & language composition
- Prerequisites
- Quick start (development)
- Running in production
- Environment variables (including AI)
- Common scripts
- Project structure
- API overview (auth, tours, users, reviews)
- AI Services (use-cases, endpoints, implementation patterns)
- Database seeding
- Security & best practices
- Logging, monitoring & performance
- Testing
- Deployment notes
- Troubleshooting
- Contributing
- License
- Contact
- Acknowledgements
- Notes

About
-----
Natours-backend is the API server for the Natours application. It exposes endpoints for managing tours, users, reviews and handles authentication/authorization, image uploads, query filtering, pagination, and aggregation features used by a separate frontend.

Features
--------
- RESTful API for tours, users and reviews
- Authentication (JWT) and role-based access control
- File/image upload and processing (if included)
- Query filtering, sorting, field limiting and pagination
- Data validation and sanitization (NoSQL injection and XSS protections)
- Rate limiting, CORS and HTTP security headers
- Aggregation pipelines for stats & monthly planning
- Pug templates for optional server-side rendered views
- Optional AI-powered features: semantic search, recommendations, chat, summarization

Tech stack & repository language composition
--------------------------------------------
- Node.js + Express
- MongoDB with Mongoose
- JavaScript (ES6+): 50.1%
- Pug templates: 20.2%
- HTML: 16.5%
- CSS: 13.2%

Prerequisites
-------------
- Node.js (recommended LTS, e.g., 18.x or later)
- npm or yarn
- MongoDB (local or Atlas)
- Optional: Image processing dependencies (sharp, libvips) if image handling is enabled

Quick start (development)
-------------------------
1. Clone the repo
   git clone https://github.com/Mohamedzaiid/natours-backend.git
   cd natours-backend

2. Install dependencies
   npm install

3. Create a .env file in the project root (see "Environment variables" below).

4. Start in development mode
   npm run dev
   (Typically starts nodemon which reloads on changes.)

5. Server URL
   http://localhost:3000 (or PORT from .env)

Running in production
---------------------
1. Set NODE_ENV=production and provide production .env values.
2. Start:
   NODE_ENV=production npm start

Process managers:
- pm2 start server.js --name natours
- Use Docker for containerized deployments

Environment variables
---------------------
Create a .env file in the project root. Required keys will depend on features used; recommended variables:

App & DB
- PORT=3000
- NODE_ENV=development
- DATABASE=mongodb+srv://<USER>:<PASSWORD>@cluster0.mongodb.net/natours?retryWrites=true&w=majority
- DATABASE_LOCAL=mongodb://localhost:27017/natours

JWT & Cookies
- JWT_SECRET=your_jwt_secret_here
- JWT_EXPIRES_IN=90d
- COOKIE_EXPIRES_IN=90

Email (if used)
- EMAIL_HOST=smtp.example.com
- EMAIL_PORT=587
- EMAIL_USERNAME=username
- EMAIL_PASSWORD=password
- EMAIL_FROM="Natours <noreply@natours.com>"

Cloudinary / Uploads (if used)
- CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>

AI Provider (optional)
- AI_PROVIDER=openai       # openai | anthropic | cohere | azure | vertex
- OPENAI_API_KEY=sk-...
- AZURE_OPENAI_ENDPOINT=https://...
- AZURE_OPENAI_KEY=...
- AI_MODEL_CHAT=gpt-4o-mini
- AI_MODEL_EMBEDDING=text-embedding-3-large
- AI_EMBEDDING_DIM=1536
- AI_MAX_TOKENS=1024
- AI_REQUEST_TIMEOUT=10000

Never commit your .env file or any secrets to source control.

Common scripts
--------------
(Verify exact scripts in package.json; common examples below)
- npm run dev — start in development (nodemon)
- npm start — start in production
- npm run lint — run ESLint
- npm run test — run test suite
- npm run seed:import — import sample data
- npm run seed:delete — delete seeded data

Project structure (example)
---------------------------
This project commonly uses the following layout (actual may vary):
- config/
- controllers/
- models/
- routes/
- utils/
- public/
- views/
- data/                # sample data for seeding (tours.json, users.json)
- server.js or app.js  # entry point

API overview
------------
Below is a high-level overview of endpoints. Confirm exact paths and payloads in the repository code.

Auth
- POST /api/v1/users/signup
  - body: { name, email, password, passwordConfirm }
  - response: user + token

- POST /api/v1/users/login
  - body: { email, password }
  - response: token + user data

- GET /api/v1/users/logout

- POST /api/v1/users/forgotPassword
  - body: { email }

- PATCH /api/v1/users/resetPassword/:token
  - body: { password, passwordConfirm }

- PATCH /api/v1/users/updateMyPassword
  - body: { currentPassword, newPassword, newPasswordConfirm }

Users
- GET /api/v1/users — (Admin) list users
- GET /api/v1/users/:id — (Admin) get user
- PATCH /api/v1/users/updateMe — update profile / photo
- DELETE /api/v1/users/deleteMe — deactivate account

Tours
- GET /api/v1/tours — list tours (filtering, sorting, field limiting, pagination)
  - example query: /api/v1/tours?difficulty=easy&sort=-price&limit=10&page=2
- GET /api/v1/tours/:id
- POST /api/v1/tours — (Admin)
- PATCH /api/v1/tours/:id — (Admin)
- DELETE /api/v1/tours/:id — (Admin)

Special tour endpoints (if implemented)
- GET /api/v1/tours/top-5-cheap
- GET /api/v1/tours/tour-stats
- GET /api/v1/tours/monthly-plan/:year
- GET /api/v1/tours/tours-within/:distance/center/:latlng/unit/:unit
- GET /api/v1/tours/distances/:latlng/unit/:unit

Reviews
- GET /api/v1/reviews
- GET /api/v1/tours/:tourId/reviews
- POST /api/v1/tours/:tourId/reviews — (authenticated)
- PATCH /api/v1/reviews/:id — (owner)
- DELETE /api/v1/reviews/:id — (owner or admin)

Example requests
----------------
Signup
POST /api/v1/users/signup
Body:
{
  "name": "Jon Doe",
  "email": "jon@example.com",
  "password": "password123",
  "passwordConfirm": "password123"
}

Login
POST /api/v1/users/login
Body:
{
  "email": "jon@example.com",
  "password": "password123"
}

Get tours
GET /api/v1/tours?sort=-ratingsAverage,price&limit=5

AI Services (integrated guidance)
---------------------------------
This repository can be extended with AI-powered features to improve search, personalization, content generation, and support. Below is guidance to plan and implement AI features safely and effectively.

Common AI use-cases
- Semantic search for natural-language queries → relevant tours
- Personalized recommendations & upsells
- Itinerary generation (day-by-day plans)
- Chat assistant for user Q&A and support
- Auto-generated tour descriptions and marketing copy
- Image processing / ALT text generation
- Content moderation and review summarization
- Analytics augmentation (sentiment, topic extraction)

Architectural patterns
- In-process API calls for low-latency usage
- Async worker queues (Bull, Bee-Queue) for heavy tasks
- Separate AI microservice for isolation and scaling
- Use vector DBs (Pinecone, RedisVector, Weaviate, Milvus) for embeddings + nearest-neighbor search

Recommended providers
- OpenAI, Anthropic, Cohere, Azure OpenAI, Google Vertex AI — select per pricing, latency, data residency, and compliance needs.

AI environment variables (examples)
- AI_PROVIDER=openai
- OPENAI_API_KEY=sk-...
- AZURE_OPENAI_ENDPOINT=https://...
- AZURE_OPENAI_KEY=...
- AI_MODEL_CHAT=gpt-4o-mini
- AI_MODEL_EMBEDDING=text-embedding-3-large
- AI_EMBEDDING_DIM=1536
- AI_MAX_TOKENS=1024

Suggested AI endpoints (examples)
- POST /api/v1/ai/search
  - Body: { query, limit }
  - Returns: ranked tours using embeddings + vector DB lookup

- POST /api/v1/ai/recommendations
  - Body: { userId, context }
  - Returns: personalized recommended tours

- POST /api/v1/ai/itinerary
  - Body: { preferences, budget, startDate }
  - Returns: generated day-by-day itinerary

- POST /api/v1/ai/chat
  - Body: { sessionId, message }
  - Returns: assistant reply

- POST /api/v1/ai/summarize-reviews
  - Body: { tourId, limit }
  - Returns: summarized reviews + sentiment

- POST /api/v1/ai/moderate
  - Body: { text }
  - Returns: moderation verdict

Semantic search flow (example)
1. Precompute embeddings for tours (title, summary, keywords).
2. Store embeddings in a vector DB (Pinecone, Weaviate, Redis, Milvus).
3. On user query:
   - Create query embedding via provider.
   - Query vector DB for nearest neighbors.
   - Optionally rerank top results with a model/prompt.
4. Return top K tours with metadata and relevance scores.

Minimal embedding pseudocode
```js
// create embedding with OpenAI-like client
const emb = await client.embeddings.create({
  model: process.env.AI_MODEL_EMBEDDING,
  input: userQuery
});
const embedding = emb.data[0].embedding;
// query your vector DB with embedding -> returns nearest tours
```

Security, privacy & compliance
- Avoid sending PII to third-party models unless necessary and allowed.
- Mask or pseudonymize data where possible.
- Log anonymized prompts/responses; avoid raw PII in logs.
- Secure and rotate API keys regularly.
- Use consent mechanisms if using user data for training/fine-tuning.

Cost control & performance
- Cache results for common queries.
- Use smaller models for classification/moderation.
- Batch embedding requests where possible.
- Use async workers for heavy generation tasks.
- Implement retries, timeouts, and graceful fallbacks.

Observability & testing
- Instrument AI calls with correlation IDs and metrics for latency/cost.
- Unit-test prompt templates and parsing.
- Use mocks for provider responses in tests.

Database seeding
----------------
If there's a data folder with sample JSON files, seeding scripts are often included.

Common usage:
- Import sample data:
  node data/import-dev-data.js --import
- Delete sample data:
  node data/import-dev-data.js --delete

Check the repository for exact script names and usage.

Security & best practices
-------------------------
- Use HTTPS in production (reverse proxy or managed hosting).
- Helmet for HTTP headers.
- Rate limiting and IP throttling.
- Data sanitization (NoSQL injection and XSS protections).
- Input validation using a validation library and Mongoose schema validation.
- Secure cookies: HttpOnly and Secure flags in production.
- Use environment variables for secrets.

Logging, monitoring & performance
---------------------------------
- Use Morgan for request logging in development.
- Production monitoring: Sentry, Datadog, or cloud provider logs.
- Use compression to speed responses.
- Index frequently queried fields (price, ratings, geospatial startLocation).
- Cache heavy endpoints (Redis) if necessary.

Testing
-------
- Tests: npm test (check package.json for framework)
- Use Supertest, Jest, Mocha, or similar for integration tests.
- For CI, use an isolated test DB or in-memory MongoDB.

Deployment notes
----------------
- Use a process manager (PM2, systemd) or container orchestration (Docker + ECS/Kubernetes).
- Use managed DB (MongoDB Atlas) for production unless self-hosting.
- Protect env vars and secrets via secret managers or host service integrations.
- Set NODE_ENV=production for production runs.

Troubleshooting
---------------
- MongoDB connection errors: verify connection string and network/IP whitelist (Atlas).
- JWT issues: check JWT_SECRET consistency across instances.
- Upload issues: confirm file system permissions or Cloudinary credentials.
- Rate limit/Quota: ensure production limits match expected traffic.

Contributing
------------
Contributions are welcome:
1. Fork the repo
2. Create a branch: git checkout -b feat/your-feature
3. Implement changes & add tests
4. Run tests & linters
5. Open a pull request with a clear description

Please follow existing code style and include tests for new features.

License
-------
Check LICENSE in the repo. If none exists, add a LICENSE file (MIT recommended for open-source projects).

Contact
-------
Repository owner: @Mohamedzaiid  
Open issues or feature requests via GitHub Issues in the repository.

Acknowledgements
----------------
This backend follows patterns common to Node.js/Express/MongoDB projects and tutorials. Thanks to the open-source community and libraries used.

Notes
-----
- This README is comprehensive and should map to the code in the repository. If some scripts or endpoints differ, refer to server.js/app.js and route/controller files for exact behavior.
- To expand documentation, consider adding:
  - Postman collection or OpenAPI/Swagger spec
  - CONTRIBUTING.md and CODE_OF_CONDUCT.md
  - Example .env.example file
  - Separate AI architecture doc (if AI usage grows)
