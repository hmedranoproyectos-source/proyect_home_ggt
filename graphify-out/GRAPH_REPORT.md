# Graph Report - proyect_home_ggt  (2026-08-17)

## Corpus Check
- 50 files · ~23,595 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 347 nodes · 448 edges · 24 communities (19 shown, 5 thin omitted)
- Extraction: 94% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 24 edges (avg confidence: 0.75)
- Token cost: 144,019 input · 0 output

## Community Hubs (Navigation)
- Especificacion Funcional (RP/RI/RC/RA/RR)
- Config Backend (DB, Redis, Server Bootstrap)
- Frontend Package Dependencies
- Frontend TypeScript Config
- Arquitectura Backend (Workers, Adapters DIAN/SIESA)
- Backend Package Dependencies
- Esquema MySQL (01_schema.sql)
- Esquema MySQL Fuente (Recibo_FE_Create.sql)
- Auth API (rutas + middleware)
- Backend Package Metadata
- Skill Graphify (docs internas)
- Skill find-skills (docs internas)
- Servicio de Autenticacion (authService.js)
- Seed de Autenticacion (seedAuth.js)
- Docker Compose (servicios)
- Hook validate-infra.js
- Frontend Layout Raiz
- Frontend ESLint Config
- Frontend Next Config
- README Raiz del Proyecto
- Skills CLI (referencia aislada)
- Postman Workspace Globals

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `graphify Skill` - 13 edges
3. `Recibo_FE_Create.sql (esquema oficial - DDL)` - 13 edges
4. `backend/CLAUDE.md (backend conventions)` - 13 edges
5. `companias` - 10 edges
6. `companias` - 10 edges
7. `ESPECIFICACIONES.md (functional spec)` - 9 edges
8. `facturas` - 8 edges
9. `facturas` - 8 edges
10. `facturas table` - 8 edges

## Surprising Connections (you probably didn't know these)
- `phpmyadmin service (dev only)` --conceptually_related_to--> `PROYECT-GGT (Aplicativo de Conciliación DIAN-SIESA)`  [INFERRED]
  docker-compose.yml → CLAUDE.md
- `Recibo_FE_Create.sql (esquema oficial)` --references--> `Recibo_FE_Create.sql (esquema oficial - DDL)`  [INFERRED]
  CLAUDE.md → ESPECIFICACIONES.md
- `conciliacion.js service (validateInvoice)` --conceptually_related_to--> `validateInvoice(invoiceId) algorithm`  [INFERRED]
  backend/CLAUDE.md → ESPECIFICACIONES.md
- `backend/CLAUDE.md (backend conventions)` --shares_data_with--> `worker service (conciliacion_worker, src/workers/index.js)`  [INFERRED]
  backend/CLAUDE.md → docker-compose.yml
- `PROYECT-GGT (Aplicativo de Conciliación DIAN-SIESA)` --references--> `backend/CLAUDE.md (backend conventions)`  [EXTRACTED]
  CLAUDE.md → backend/CLAUDE.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **End-to-end conciliación pipeline (Email -> Parse -> SIESA -> Dashboard)** — claude_md_email_worker, claude_md_conciliacion_worker, claude_md_siesa_soap_adapter, claude_md_entrada_almacen, claude_md_causacion_contable, claude_md_dashboard_socketio [EXTRACTED 1.00]
- **Docker Compose orchestrated services** — docker_compose_yml_mysql_service, docker_compose_yml_redis_service, docker_compose_yml_phpmyadmin_service, docker_compose_yml_backend_service, docker_compose_yml_worker_service, docker_compose_yml_frontend_service, docker_compose_yml_nginx_service [EXTRACTED 1.00]
- **Multiempresa auth flow (login, roles, session, id_cia filtering)** — backend_claude_md_login_multiempresa_flow, backend_claude_md_auth_service_js, backend_claude_md_auth_middleware_js, frontend_claude_md_nextauth_session, especificaciones_md_usuarios_roles, claude_md_multiempresa_id_cia [INFERRED 0.85]

## Communities (24 total, 5 thin omitted)

### Community 0 - "Especificacion Funcional (RP/RI/RC/RA/RR)"
Cohesion: 0.08
Nodes (36): conciliacion.js service (validateInvoice), Multiempresa / id_cia convention, PROYECT-GGT (Aplicativo de Conciliación DIAN-SIESA), RC-06 tabla de auditoría (pendiente de diseño), Recibo_FE_Create.sql (esquema oficial), BullMQ queue architecture (Scheduler/Worker/retry), companias table, config_buzon_fe table (+28 more)

### Community 1 - "Config Backend (DB, Redis, Server Bootstrap)"
Cohesion: 0.06
Nodes (27): env, mysql, pool, missing, REQUIRED_VARS, connection, env, IORedis (+19 more)

### Community 2 - "Frontend Package Dependencies"
Cohesion: 0.07
Nodes (28): eslint, eslint-config-next, dependencies, next, react, react-dom, devDependencies, eslint (+20 more)

### Community 3 - "Frontend TypeScript Config"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 4 - "Arquitectura Backend (Workers, Adapters DIAN/SIESA)"
Cohesion: 0.09
Nodes (24): middleware/auth.js (requireAuth, requirePreSession, requirePermission), authService.js (multiempresa login), backend/CLAUDE.md (backend conventions), conciliacionWorker.js (BullMQ consumer), adapters/dian/ (DIAN document adapter), emailWorker.js (cron/scheduler node-imap), excelMapper.js (Excel column mapping), Login multiempresa 2-step flow (POST /api/auth/login, /select-company) (+16 more)

### Community 5 - "Backend Package Dependencies"
Cohesion: 0.09
Nodes (23): dependencies, bcrypt, bullmq, cors, dotenv, express, express-rate-limit, ioredis (+15 more)

### Community 6 - "Esquema MySQL (01_schema.sql)"
Cohesion: 0.21
Nodes (22): adjuntos_correos, buzones, companias, config_buzon_fe, correos, detalles_entrada_almacen, detalles_facturas, detalles_ordenes_compras (+14 more)

### Community 7 - "Esquema MySQL Fuente (Recibo_FE_Create.sql)"
Cohesion: 0.21
Nodes (22): adjuntos_correos, buzones, companias, config_buzon_fe, correos, detalles_entrada_almacen, detalles_facturas, detalles_ordenes_compras (+14 more)

### Community 8 - "Auth API (rutas + middleware)"
Cohesion: 0.13
Nodes (12): authService, authController, express, loginLimiter, rateLimit, { requireAuth, requirePreSession }, router, env (+4 more)

### Community 9 - "Backend Package Metadata"
Cohesion: 0.11
Nodes (17): author, description, devDependencies, nodemon, keywords, license, main, name (+9 more)

### Community 10 - "Skill Graphify (docs internas)"
Cohesion: 0.11
Nodes (18): graphify slash-command trigger rule, known gap - SQL schema nodes vs doc semantic nodes not linked, Graphify consulta de contexto (project graph usage), graphify add / --watch reference, graphify export flags reference (wiki, neo4j, falkordb, svg, graphml, mcp, benchmark), graphify extraction subagent prompt spec, graphify GitHub clone and cross-repo merge reference, graphify hook install / claude install reference (+10 more)

### Community 11 - "Skill find-skills (docs internas)"
Cohesion: 0.14
Nodes (13): Common Skill Categories, Find Skills, How to Help Users Find Skills, Step 1: Understand What They Need, Step 2: Check the Leaderboard First, Step 3: Search for Skills, Step 4: Verify Quality Before Recommending, Step 5: Present Options to the User (+5 more)

### Community 12 - "Servicio de Autenticacion (authService.js)"
Cohesion: 0.26
Nodes (12): bcrypt, db, env, findUserByUsername(), getCompaniasForUser(), getRolesAndPermisos(), jwt, login() (+4 more)

### Community 13 - "Seed de Autenticacion (seedAuth.js)"
Cohesion: 0.29
Nodes (11): bcrypt, COMPANIA_DEFAULT, db, ensureRolPermiso(), ensureUsuarioRol(), getOrCreateCompania(), getOrCreatePermisoVerFacturas(), getOrCreateRolAdministrador() (+3 more)

### Community 14 - "Docker Compose (servicios)"
Cohesion: 0.44
Nodes (9): backend service (conciliacion_backend), docker-compose.yml orchestration, frontend service (conciliacion_frontend), mysql service (conciliacion_mysql), nginx service (reverse proxy), phpmyadmin service (dev only), redis service (conciliacion_redis), worker service (conciliacion_worker, src/workers/index.js) (+1 more)

### Community 15 - "Hook validate-infra.js"
Cohesion: 0.33
Nodes (5): base, { execSync }, fs, input, path

### Community 16 - "Frontend Layout Raiz"
Cohesion: 0.40
Nodes (3): geistMono, geistSans, metadata

## Ambiguous Edges - Review These
- `facturas table` → `facturas_dian table`  [AMBIGUOUS]
  ESPECIFICACIONES.md · relation: conceptually_related_to

## Knowledge Gaps
- **155 isolated node(s):** `proyect_ggt_home`, `When to Use This Skill`, `What is the Skills CLI?`, `Step 1: Understand What They Need`, `Step 2: Check the Leaderboard First` (+150 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `facturas table` and `facturas_dian table`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `backend/CLAUDE.md (backend conventions)` connect `Arquitectura Backend (Workers, Adapters DIAN/SIESA)` to `Especificacion Funcional (RP/RI/RC/RA/RR)`, `Docker Compose (servicios)`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `Recibo_FE_Create.sql (esquema oficial - DDL)` connect `Especificacion Funcional (RP/RI/RC/RA/RR)` to `Skill Graphify (docs internas)`, `Arquitectura Backend (Workers, Adapters DIAN/SIESA)`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `PROYECT-GGT (Aplicativo de Conciliación DIAN-SIESA)` connect `Especificacion Funcional (RP/RI/RC/RA/RR)` to `Arquitectura Backend (Workers, Adapters DIAN/SIESA)`, `Docker Compose (servicios)`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **What connects `proyect_ggt_home`, `When to Use This Skill`, `What is the Skills CLI?` to the rest of the system?**
  _155 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Especificacion Funcional (RP/RI/RC/RA/RR)` be split into smaller, more focused modules?**
  _Cohesion score 0.07777777777777778 - nodes in this community are weakly interconnected._
- **Should `Config Backend (DB, Redis, Server Bootstrap)` be split into smaller, more focused modules?**
  _Cohesion score 0.06386554621848739 - nodes in this community are weakly interconnected._