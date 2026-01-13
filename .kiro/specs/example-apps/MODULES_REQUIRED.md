# Required Modules for Example Apps

This document tracks which modules need to be created for each example app.

---

## Module Creation Priority

### Phase 1 Modules (Beginner)

**Built-in (Already Available):**
- ✅ Logger
- ✅ Config

**Need to Create:**
1. **In-Memory Storage** (App 1.1, 1.3)
   - Simple key-value store
   - TTL support
   - Used in: Todo API, URL Shortener

2. **HTTP Client** (App 1.2)
   - Fetch wrapper
   - Error handling
   - Used in: Weather API

3. **Email** (App 1.4)
   - SMTP/SendGrid support
   - Template rendering
   - Used in: Contact Form API

4. **File Storage** (App 1.5)
   - Local file operations
   - Directory management
   - Used in: Notes API

5. **Validation** (App 1.3, 1.4)
   - Schema validation
   - Type checking
   - Used in: URL Shortener, Contact Form

---

### Phase 2 Modules (Intermediate)

**Need to Create:**
6. **PostgreSQL** (App 2.1, 2.2, 2.3, 2.4, 2.5)
   - Connection pooling
   - Query builder
   - Transactions
   - Used in: All Phase 2 apps

7. **Redis** (App 2.1, 2.2, 2.3, 2.4, 2.5)
   - Cache operations
   - Pub/sub
   - Used in: All Phase 2 apps

8. **JWT Auth** (App 2.1, 2.2, 2.3, 2.4, 2.5)
   - Token generation
   - Token verification
   - Middleware
   - Used in: All Phase 2 apps

9. **Stripe** (App 2.2)
   - Payment intents
   - Webhooks
   - Used in: E-commerce API

10. **Queue** (App 2.2, 2.3, 2.5)
    - Background jobs
    - BullMQ integration
    - Used in: E-commerce, Social Media, Analytics

11. **WebSocket** (App 2.3)
    - Real-time connections
    - Broadcasting
    - Used in: Social Media API

12. **S3 Storage** (App 2.4)
    - File uploads
    - Signed URLs
    - Used in: File Upload Service

13. **Elasticsearch** (App 2.5)
    - Full-text search
    - Aggregations
    - Used in: Analytics Dashboard

---

### Phase 3 Modules (Advanced)

**Need to Create:**
14. **Multi-Tenant** (App 3.1)
    - Tenant resolution
    - Database isolation
    - Used in: Multi-Tenant SaaS

15. **Feature Flags** (App 3.1)
    - Flag evaluation
    - User targeting
    - Used in: Multi-Tenant SaaS

16. **Kafka** (App 3.2, 3.3)
    - Event streaming
    - Consumer groups
    - Used in: Event-Driven, Real-Time Collaboration

17. **Event Store** (App 3.2)
    - Event persistence
    - Event replay
    - Used in: Event-Driven Microservices

18. **Presence** (App 3.3)
    - User presence tracking
    - Online/offline status
    - Used in: Real-Time Collaboration

19. **Temporal** (App 3.4)
    - Workflow orchestration
    - Durable execution
    - Used in: Workflow Orchestration

20. **API Gateway** (App 3.5)
    - Request routing
    - Service composition
    - Used in: API Gateway + Microservices

21. **Circuit Breaker** (App 3.5)
    - Fault tolerance
    - Fallback handling
    - Used in: API Gateway + Microservices

22. **Distributed Tracing** (App 3.5)
    - OpenTelemetry integration
    - Trace visualization
    - Used in: API Gateway + Microservices

---

## Module Development Order

### Priority 1 (Phase 1 - Week 1-2)
1. In-Memory Storage
2. Validation
3. HTTP Client
4. Email
5. File Storage

### Priority 2 (Phase 2 - Week 3-6)
6. PostgreSQL ⭐ (Critical)
7. Redis ⭐ (Critical)
8. JWT Auth ⭐ (Critical)
9. Queue
10. WebSocket

### Priority 3 (Phase 2 - Week 7-8)
11. Stripe
12. S3 Storage
13. Elasticsearch

### Priority 4 (Phase 3 - Week 9-12)
14. Multi-Tenant
15. Feature Flags
16. Kafka
17. Event Store
18. Presence

### Priority 5 (Phase 3 - Week 13-16)
19. Temporal
20. API Gateway
21. Circuit Breaker
22. Distributed Tracing

---

## Module Dependencies

```
Phase 1 Apps
├── App 1.1 (Todo API)
│   ├── Logger ✅
│   ├── Config ✅
│   └── In-Memory Storage ⏳
├── App 1.2 (Weather API)
│   ├── Logger ✅
│   ├── Config ✅
│   └── HTTP Client ⏳
├── App 1.3 (URL Shortener)
│   ├── Logger ✅
│   ├── Config ✅
│   ├── In-Memory Storage ⏳
│   └── Validation ⏳
├── App 1.4 (Contact Form)
│   ├── Logger ✅
│   ├── Config ✅
│   ├── Email ⏳
│   └── Validation ⏳
└── App 1.5 (Notes API)
    ├── Logger ✅
    ├── Config ✅
    └── File Storage ⏳

Phase 2 Apps
├── App 2.1 (Blog Platform)
│   ├── PostgreSQL ⏳
│   ├── Redis ⏳
│   ├── JWT Auth ⏳
│   ├── Logger ✅
│   └── Config ✅
├── App 2.2 (E-commerce)
│   ├── PostgreSQL ⏳
│   ├── Redis ⏳
│   ├── JWT Auth ⏳
│   ├── Stripe ⏳
│   ├── Queue ⏳
│   └── Email ⏳
├── App 2.3 (Social Media)
│   ├── PostgreSQL ⏳
│   ├── Redis ⏳
│   ├── JWT Auth ⏳
│   ├── WebSocket ⏳
│   └── Queue ⏳
├── App 2.4 (File Upload)
│   ├── PostgreSQL ⏳
│   ├── Redis ⏳
│   ├── JWT Auth ⏳
│   ├── S3 Storage ⏳
│   └── Queue ⏳
└── App 2.5 (Analytics)
    ├── PostgreSQL ⏳
    ├── Redis ⏳
    ├── JWT Auth ⏳
    ├── Elasticsearch ⏳
    └── Queue ⏳

Phase 3 Apps
├── App 3.1 (Multi-Tenant SaaS)
│   ├── PostgreSQL ⏳
│   ├── Redis ⏳
│   ├── JWT Auth ⏳
│   ├── Stripe ⏳
│   ├── Multi-Tenant ⏳
│   ├── Feature Flags ⏳
│   ├── Email ⏳
│   └── Queue ⏳
├── App 3.2 (Event-Driven)
│   ├── PostgreSQL ⏳
│   ├── Redis ⏳
│   ├── Kafka ⏳
│   ├── Elasticsearch ⏳
│   └── Event Store ⏳
├── App 3.3 (Real-Time Collaboration)
│   ├── PostgreSQL ⏳
│   ├── Redis ⏳
│   ├── WebSocket ⏳
│   ├── Kafka ⏳
│   └── Presence ⏳
├── App 3.4 (Workflow Orchestration)
│   ├── PostgreSQL ⏳
│   ├── Redis ⏳
│   ├── Temporal ⏳
│   └── Queue ⏳
└── App 3.5 (API Gateway)
    ├── All modules
    ├── API Gateway ⏳
    ├── Circuit Breaker ⏳
    └── Distributed Tracing ⏳
```

---

## Total Module Count

- **Phase 1:** 5 modules
- **Phase 2:** 8 modules
- **Phase 3:** 9 modules
- **Total:** 22 new modules (+ 2 built-in)
