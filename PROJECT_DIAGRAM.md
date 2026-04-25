# POS SaaS Project Diagram

Use this file as your north-star map while building.

## 1) Current State (Phase 1)

```mermaid
flowchart LR
    Client[Client / Postman / App] --> Gateway[API Gateway<br/>Nginx]
    Gateway --> TenantService[Tenant Service<br/>POST /tenants]

    subgraph Data
      CPDB[(MySQL: control_plane)]
      TenantDB[(MySQL: tenant_<id>)]
    end

    TenantService --> CPDB
    TenantService --> TenantDB

    Rabbit[(RabbitMQ)]
    Redis[(Redis)]
    TenantService -. reserved for later phases .- Rabbit
    TenantService -. reserved for later phases .- Redis
```

## 2) Target End-State (Phase 6 Vision)

```mermaid
flowchart LR
    Client[Client] --> Gateway[API Gateway]

    Gateway --> Auth[Auth Service]
    Gateway --> Tenant[Tenant Service]
    Gateway --> Product[Product Service]
    Gateway --> Inventory[Inventory Service]
    Gateway --> Sales[Sales Service]
    Gateway --> Reporting[Reporting Service]

    Tenant --> CPDB[(Control Plane DB)]
    Tenant --> TenantDB[(Tenant DB per shop)]
    Product --> TenantDB
    Inventory --> TenantDB
    Sales --> TenantDB

    Sales -- SaleCompleted --> MQ[(RabbitMQ)]
    MQ --> Inventory
    MQ --> Reporting
    Reporting --> RDB[(Reporting DB / CQRS)]

    Redis[(Redis Cache)] --- Product
    Redis --- Reporting
```

## 3) What You Are Actually Building

```mermaid
flowchart TD
    A[M1: Provision tenants safely] --> B[M2: Core sync APIs]
    B --> C[M3: Event-driven sales flow]
    C --> D[M4: CQRS reporting]
    D --> E[M5: Scale + reliability tests]
```

## 4) Core Event Flow (Sales)

```mermaid
sequenceDiagram
    participant C as Client
    participant G as API Gateway
    participant S as Sales Service
    participant MQ as RabbitMQ
    participant I as Inventory Service
    participant R as Reporting Service
    participant TDB as Tenant DB
    participant RDB as Reporting DB

    C->>G: POST /sales
    G->>S: Forward request
    S->>TDB: Insert sales + sale_items
    S->>MQ: Publish SaleCompleted(event_id, tenant_id, payload)
    MQ->>I: Deliver SaleCompleted
    I->>TDB: Decrease stock (idempotent)
    MQ->>R: Deliver SaleCompleted
    R->>RDB: Upsert daily_sales (idempotent)
```

## 5) Mental Model

- Tenant Service controls onboarding and database-per-tenant lifecycle.
- Business writes happen in tenant DBs (products, inventory, sales).
- RabbitMQ moves domain events between services asynchronously.
- Reporting service builds read-optimized aggregates (CQRS).
- API Gateway is the single entry point for clients.
