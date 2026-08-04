# Graph Report - proyect-ggt  (2026-08-03)

## Corpus Check
- 44 files · ~23,751 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 307 nodes · 385 edges · 25 communities (18 shown, 7 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.65)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `be2317f8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- src/index.js
- compilerOptions
- dependencies
- 01_schema.sql
- Recibo FE Create.sql
- auth.routes.js
- Backend Express API Service
- backend/package.json
- graphify SKILL.md — Knowledge Graph Pipeline Skill
- frontend/package.json
- authService.js
- devDependencies
- seedAuth.js
- validateInvoice() — Conciliation Algorithm
- layout.tsx
- eslint.config.mjs
- next.config.ts
- Excel Insumo DIAN Mapper (xlsx/SheetJS)
- seedAuth.js — Auth Seed Script
- docker-compose.yml — Service Orchestration
- frontend/README.md — Frontend README
- Find Skills
- validate-infra.js

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `companias` - 10 edges
3. `companias` - 10 edges
4. `graphify SKILL.md — Knowledge Graph Pipeline Skill` - 10 edges
5. `facturas` - 8 edges
6. `facturas` - 8 edges
7. `Find Skills` - 7 edges
8. `How to Help Users Find Skills` - 7 edges
9. `main()` - 7 edges
10. `include` - 7 edges

## Surprising Connections (you probably didn't know these)
- `Socket.io Real-time Dashboard Events` --references--> `Backend Express API Service`  [INFERRED]
  ESPECIFICACIONES.md → docker-compose.yml
- `Conciliación Worker (BullMQ job processor)` --calls--> `validateInvoice() — Conciliation Algorithm`  [EXTRACTED]
  CLAUDE.md → ESPECIFICACIONES.md
- `SIESA SOAP Adapter` --references--> `facturas_erp — SIESA ERP Mirror Table`  [INFERRED]
  CLAUDE.md → ESPECIFICACIONES.md
- `UBL 2.1 XML Parser` --references--> `facturas_dian — UBL XML Mirror Table`  [INFERRED]
  CLAUDE.md → ESPECIFICACIONES.md
- `auditoria_acciones — Audit Log Table (RC-06, not yet in DDL)` --references--> `Multi-company (id_cia) Filtering Convention`  [INFERRED]
  ESPECIFICACIONES.md → CLAUDE.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Docker Compose Service Orchestration** — service_mysql, service_redis, service_backend, service_worker, service_frontend, service_nginx, service_phpmyadmin [EXTRACTED 1.00]
- **Invoice Conciliation Processing Flow** — concept_email_worker, concept_ubl_parser, concept_bullmq_queue, concept_conciliacion_worker, concept_validate_invoice, concept_siesa_adapter, concept_entradas_almacen [EXTRACTED 0.95]
- **Official Database Schema Tables (Recibo_FE_Create.sql)** — concept_facturas, concept_facturas_dian, concept_facturas_erp, concept_detalles_facturas, concept_ordenes_compras, concept_entradas_almacen, concept_equivalencias_proveedores, concept_estados_documentos, concept_companias, concept_config_buzon_fe [EXTRACTED 0.95]

## Communities (25 total, 7 thin omitted)

### Community 0 - "src/index.js"
Cohesion: 0.06
Nodes (27): env, mysql, pool, missing, REQUIRED_VARS, connection, env, IORedis (+19 more)

### Community 1 - "compilerOptions"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 2 - "dependencies"
Cohesion: 0.09
Nodes (23): dependencies, bcrypt, bullmq, cors, dotenv, express, express-rate-limit, ioredis (+15 more)

### Community 3 - "01_schema.sql"
Cohesion: 0.21
Nodes (22): adjuntos_correos, buzones, companias, config_buzon_fe, correos, detalles_entrada_almacen, detalles_facturas, detalles_ordenes_compras (+14 more)

### Community 4 - "Recibo FE Create.sql"
Cohesion: 0.21
Nodes (22): adjuntos_correos, buzones, companias, config_buzon_fe, correos, detalles_entrada_almacen, detalles_facturas, detalles_ordenes_compras (+14 more)

### Community 5 - "auth.routes.js"
Cohesion: 0.13
Nodes (12): authService, authController, express, loginLimiter, rateLimit, { requireAuth, requirePreSession }, router, env (+4 more)

### Community 6 - "Backend Express API Service"
Cohesion: 0.13
Nodes (19): auditoria_acciones — Audit Log Table (RC-06, not yet in DDL), Backend Auth Middleware (requireAuth, requirePermission), BullMQ Conciliation Queue, companias — Multi-company Anchor Table, config_buzon_fe — IMAP Mailbox Config Table, Email Worker (node-imap + mailparser, 10min scan), facturas_dian — UBL XML Mirror Table, Multi-company (id_cia) Filtering Convention (+11 more)

### Community 7 - "backend/package.json"
Cohesion: 0.11
Nodes (17): author, description, devDependencies, nodemon, keywords, license, main, name (+9 more)

### Community 8 - "graphify SKILL.md — Knowledge Graph Pipeline Skill"
Cohesion: 0.16
Nodes (16): backend/CLAUDE.md — Backend Developer Guide, CLAUDE.md — Root Project Documentation, graphify add-watch.md — Add URL & Watch Folder Reference, graphify exports.md — Extra Export Formats Reference, graphify extraction-spec.md — Semantic Extraction Subagent Prompt, graphify github-and-merge.md — GitHub Clone & Cross-Repo Merge Reference, graphify hooks.md — Commit Hook & CLAUDE.md Integration Reference, graphify query.md — Query/Path/Explain Reference (+8 more)

### Community 9 - "frontend/package.json"
Cohesion: 0.07
Nodes (28): eslint, eslint-config-next, dependencies, next, react, react-dom, devDependencies, eslint (+20 more)

### Community 10 - "authService.js"
Cohesion: 0.26
Nodes (12): bcrypt, db, env, findUserByUsername(), getCompaniasForUser(), getRolesAndPermisos(), jwt, login() (+4 more)

### Community 12 - "seedAuth.js"
Cohesion: 0.29
Nodes (11): bcrypt, COMPANIA_DEFAULT, db, ensureRolPermiso(), ensureUsuarioRol(), getOrCreateCompania(), getOrCreatePermisoVerFacturas(), getOrCreateRolAdministrador() (+3 more)

### Community 13 - "validateInvoice() — Conciliation Algorithm"
Cohesion: 0.27
Nodes (10): Conciliación Worker (BullMQ job processor), detalles_facturas — Invoice Line Items Table, entradas_almacen — Warehouse Entry Table, equivalencias_proveedores — Supplier SKU Mapping Table, estados_documentos — State Machine Catalog, facturas — Core Invoice Table, facturas_erp — SIESA ERP Mirror Table, ordenes_compras — Purchase Orders Table (+2 more)

### Community 14 - "layout.tsx"
Cohesion: 0.40
Nodes (3): geistMono, geistSans, metadata

### Community 23 - "Find Skills"
Cohesion: 0.14
Nodes (13): Common Skill Categories, Find Skills, How to Help Users Find Skills, Step 1: Understand What They Need, Step 2: Check the Leaderboard First, Step 3: Search for Skills, Step 4: Verify Quality Before Recommending, Step 5: Present Options to the User (+5 more)

### Community 24 - "validate-infra.js"
Cohesion: 0.33
Nodes (5): base, { execSync }, fs, input, path

## Knowledge Gaps
- **146 isolated node(s):** `proyect_ggt_home`, `fs`, `path`, `{ execSync }`, `input` (+141 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `backend/package.json`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **What connects `proyect_ggt_home`, `fs`, `path` to the rest of the system?**
  _146 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `src/index.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06386554621848739 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.08695652173913043 - nodes in this community are weakly interconnected._
- **Should `auth.routes.js` be split into smaller, more focused modules?**
  _Cohesion score 0.1286549707602339 - nodes in this community are weakly interconnected._
- **Should `Backend Express API Service` be split into smaller, more focused modules?**
  _Cohesion score 0.1286549707602339 - nodes in this community are weakly interconnected._