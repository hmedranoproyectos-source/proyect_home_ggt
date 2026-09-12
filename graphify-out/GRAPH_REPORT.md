# Graph Report - proyect_home_ggt  (2026-09-12)

## Corpus Check
- 61 files · ~31,160 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 490 nodes · 655 edges · 44 communities (33 shown, 11 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 43 edges (avg confidence: 0.64)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d0d3b76d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Recibo_FE_Create.sql (esquema oficial - DDL)
- src/index.js
- devDependencies
- compilerOptions
- backend/CLAUDE.md (backend conventions)
- dependencies
- 01_schema.sql
- Recibo FE Create.sql
- auth.routes.js
- backend/package.json
- graphify Skill
- Find Skills
- authService.js
- seedAuth.js
- siesaConsultasService.js
- validate-infra.js
- layout.tsx
- eslint.config.mjs
- next.config.ts
- README.md
- Skills CLI (npx skills)
- emailScanProcessor.js
- adapters/siesa/ (SOAP WSDL adapter)
- frontend/CLAUDE.md (frontend conventions)
- docker-compose.yml orchestration
- ESPECIFICACIONES.md (functional spec)
- PROYECT-GGT (Aplicativo de Conciliación DIAN-SIESA)
- RC - Requisitos de Control y Validación
- ublInvoiceParser.js
- workers/index.js
- redis.js
- env.js
- seedPipeline.js
- emailQueue.js
- adjuntos_correos
- buzones
- config_buzon_fe
- correos
- detalles_facturas
- facturas
- facturas_dian

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `Recibo_FE_Create.sql (esquema oficial - DDL)` - 13 edges
3. `graphify Skill` - 13 edges
4. `backend/CLAUDE.md (backend conventions)` - 13 edges
5. `parseUblInvoice()` - 11 edges
6. `companias` - 10 edges
7. `companias` - 10 edges
8. `ESPECIFICACIONES.md (functional spec)` - 9 edges
9. `facturas` - 8 edges
10. `facturas` - 8 edges

## Surprising Connections (you probably didn't know these)
- `Recibo_FE_Create.sql (esquema oficial)` --references--> `Recibo_FE_Create.sql (esquema oficial - DDL)`  [INFERRED]
  CLAUDE.md → ESPECIFICACIONES.md
- `conciliacion.js service (validateInvoice)` --conceptually_related_to--> `validateInvoice(invoiceId) algorithm`  [INFERRED]
  backend/CLAUDE.md → ESPECIFICACIONES.md
- `phpmyadmin service (dev only)` --conceptually_related_to--> `PROYECT-GGT (Aplicativo de Conciliación DIAN-SIESA)`  [INFERRED]
  docker-compose.yml → CLAUDE.md
- `backend/CLAUDE.md (backend conventions)` --shares_data_with--> `worker service (conciliacion_worker, src/workers/index.js)`  [INFERRED]
  backend/CLAUDE.md → docker-compose.yml
- `adapters/siesa/ (SOAP WSDL adapter)` --conceptually_related_to--> `Adaptador SIESA (SOAP WS)`  [INFERRED]
  backend/CLAUDE.md → CLAUDE.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **End-to-end conciliación pipeline (Email -> Parse -> SIESA -> Dashboard)** — claude_md_email_worker, claude_md_conciliacion_worker, claude_md_siesa_soap_adapter, claude_md_entrada_almacen, claude_md_causacion_contable, claude_md_dashboard_socketio [EXTRACTED 1.00]
- **Docker Compose orchestrated services** — docker_compose_yml_mysql_service, docker_compose_yml_redis_service, docker_compose_yml_phpmyadmin_service, docker_compose_yml_backend_service, docker_compose_yml_worker_service, docker_compose_yml_frontend_service, docker_compose_yml_nginx_service [EXTRACTED 1.00]
- **Multiempresa auth flow (login, roles, session, id_cia filtering)** — backend_claude_md_login_multiempresa_flow, backend_claude_md_auth_service_js, backend_claude_md_auth_middleware_js, frontend_claude_md_nextauth_session, especificaciones_md_usuarios_roles, claude_md_multiempresa_id_cia [INFERRED 0.85]

## Communities (44 total, 11 thin omitted)

### Community 0 - "Recibo_FE_Create.sql (esquema oficial - DDL)"
Cohesion: 0.19
Nodes (16): conciliacion.js service (validateInvoice), RC-06 tabla de auditoría (pendiente de diseño), config_buzon_fe table, detalles_facturas table, detalles_ordenes_compras table, entradas_almacen table, equivalencias_proveedores table, estados_documentos table (chained state machine) (+8 more)

### Community 1 - "src/index.js"
Cohesion: 0.12
Nodes (14): app, authRoutes, configRoutes, cors, db, env, express, http (+6 more)

### Community 2 - "devDependencies"
Cohesion: 0.07
Nodes (28): eslint, eslint-config-next, dependencies, next, react, react-dom, devDependencies, eslint (+20 more)

### Community 3 - "compilerOptions"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 4 - "backend/CLAUDE.md (backend conventions)"
Cohesion: 0.20
Nodes (12): middleware/auth.js (requireAuth, requirePreSession, requirePermission), authService.js (multiempresa login), backend/CLAUDE.md (backend conventions), conciliacionWorker.js (BullMQ consumer), adapters/dian/ (DIAN document adapter), emailWorker.js (cron/scheduler node-imap), excelMapper.js (Excel column mapping), Login multiempresa 2-step flow (POST /api/auth/login, /select-company) (+4 more)

### Community 5 - "dependencies"
Cohesion: 0.06
Nodes (33): adm-zip, dependencies, adm-zip, bcrypt, bullmq, cors, dotenv, express (+25 more)

### Community 6 - "01_schema.sql"
Cohesion: 0.21
Nodes (22): adjuntos_correos, buzones, companias, config_buzon_fe, correos, detalles_entrada_almacen, detalles_facturas, detalles_ordenes_compras (+14 more)

### Community 7 - "Recibo FE Create.sql"
Cohesion: 0.21
Nodes (22): adjuntos_correos, buzones, companias, config_buzon_fe, correos, detalles_entrada_almacen, detalles_facturas, detalles_ordenes_compras (+14 more)

### Community 8 - "auth.routes.js"
Cohesion: 0.08
Nodes (17): authService, authController, express, loginLimiter, rateLimit, { requireAuth, requirePreSession }, router, emailConnectionService (+9 more)

### Community 9 - "backend/package.json"
Cohesion: 0.11
Nodes (18): author, description, devDependencies, nodemon, keywords, license, main, name (+10 more)

### Community 10 - "graphify Skill"
Cohesion: 0.11
Nodes (18): graphify slash-command trigger rule, known gap - SQL schema nodes vs doc semantic nodes not linked, Graphify consulta de contexto (project graph usage), graphify add / --watch reference, graphify export flags reference (wiki, neo4j, falkordb, svg, graphml, mcp, benchmark), graphify extraction subagent prompt spec, graphify GitHub clone and cross-repo merge reference, graphify hook install / claude install reference (+10 more)

### Community 11 - "Find Skills"
Cohesion: 0.14
Nodes (13): Common Skill Categories, Find Skills, How to Help Users Find Skills, Step 1: Understand What They Need, Step 2: Check the Leaderboard First, Step 3: Search for Skills, Step 4: Verify Quality Before Recommending, Step 5: Present Options to the User (+5 more)

### Community 12 - "authService.js"
Cohesion: 0.26
Nodes (12): bcrypt, db, env, findUserByUsername(), getCompaniasForUser(), getRolesAndPermisos(), jwt, login() (+4 more)

### Community 13 - "seedAuth.js"
Cohesion: 0.29
Nodes (11): bcrypt, COMPANIA_DEFAULT, db, ensureRolPermiso(), ensureUsuarioRol(), getOrCreateCompania(), getOrCreatePermisoVerFacturas(), getOrCreateRolAdministrador() (+3 more)

### Community 14 - "siesaConsultasService.js"
Cohesion: 0.07
Nodes (26): env, getClient(), soap, buildPvstrParametros(), CONSULTAS, ejecutarConsulta(), env, { getClient } (+18 more)

### Community 15 - "validate-infra.js"
Cohesion: 0.33
Nodes (5): base, { execSync }, fs, input, path

### Community 16 - "layout.tsx"
Cohesion: 0.40
Nodes (3): geistMono, geistSans, metadata

### Community 23 - "emailScanProcessor.js"
Cohesion: 0.12
Nodes (22): AdmZip, expandirZip(), extension(), EXTENSIONES_INTERES, extraerAdjuntos(), path, buildImapConfig(), countMessages() (+14 more)

### Community 24 - "adapters/siesa/ (SOAP WSDL adapter)"
Cohesion: 0.29
Nodes (7): adapters/siesa/ (SOAP WSDL adapter), Causación contable, Dashboard en tiempo real (Socket.io), Entrada de Almacén (estado 0 - Elaboración), Adaptador SIESA (SOAP WS), siesa-soap-adapter skill (proposed), Dashboard / Listado de facturas screen (RR-01, RR-04)

### Community 25 - "frontend/CLAUDE.md (frontend conventions)"
Cohesion: 0.22
Nodes (9): Multiempresa / id_cia convention, companias table, RR-05 línea de tiempo de factura, RR - Requisitos de Reportes, Next.js 16 agent rules warning (breaking changes), Detalle de factura screen (RR-05 timeline), frontend/CLAUDE.md (frontend conventions), frontend-design skill usage (+1 more)

### Community 26 - "docker-compose.yml orchestration"
Cohesion: 0.44
Nodes (9): backend service (conciliacion_backend), docker-compose.yml orchestration, frontend service (conciliacion_frontend), mysql service (conciliacion_mysql), nginx service (reverse proxy), phpmyadmin service (dev only), redis service (conciliacion_redis), worker service (conciliacion_worker, src/workers/index.js) (+1 more)

### Community 27 - "ESPECIFICACIONES.md (functional spec)"
Cohesion: 0.25
Nodes (8): ublParser.js (UBL 2.1 tag extraction), ubl-invoice-parsing skill (proposed), BullMQ queue architecture (Scheduler/Worker/retry), ESPECIFICACIONES.md (functional spec), Estado 'En Elaboración' (SIESA Estado 0) business rule, RA - Requisitos de Automatización, RI - Requisitos de Información (UBL 2.1 extraction), RP - Requisitos del Proceso

### Community 28 - "PROYECT-GGT (Aplicativo de Conciliación DIAN-SIESA)"
Cohesion: 0.50
Nodes (4): Worker de conciliación (BullMQ), Email Worker (node-imap + mailparser), PROYECT-GGT (Aplicativo de Conciliación DIAN-SIESA), Recibo_FE_Create.sql (esquema oficial)

### Community 29 - "RC - Requisitos de Control y Validación"
Cohesion: 0.50
Nodes (4): RC-02 alertas rojo/amarillo, RC-04 duplicidad (UNIQUE id_cia, id_proveedor, prefijo_fe, consecutivo_fe), RC - Requisitos de Control y Validación, Vista de conciliación screen (RC-01/RC-02/RC-03)

### Community 30 - "ublInvoiceParser.js"
Cohesion: 0.11
Nodes (27): ESTADOS, CODIGOS_IMPUESTO, DocumentoNoFacturaError, DOCUMENTOS_NO_FACTURA, extractLines(), extractParty(), extractTaxes(), first() (+19 more)

### Community 31 - "workers/index.js"
Cohesion: 0.20
Nodes (9): registrarSchedulerEscaneo(), bootstrap(), conciliacionWorker, connection, emailWorker, env, { procesarEscaneo }, {
  registrarSchedulerEscaneo,
  EMAIL_QUEUE_NAME,
  EMAIL_SCAN_PATTERN,
} (+1 more)

### Community 32 - "redis.js"
Cohesion: 0.22
Nodes (7): connection, env, IORedis, conciliacionQueue, connection, env, { Queue }

### Community 33 - "env.js"
Cohesion: 0.29
Nodes (5): env, mysql, pool, missing, REQUIRED_VARS

### Community 34 - "seedPipeline.js"
Cohesion: 0.38
Nodes (6): db, env, ESTADOS, main(), seedBuzon(), seedEstados()

### Community 35 - "emailQueue.js"
Cohesion: 0.40
Nodes (4): connection, emailQueue, env, { Queue }

## Ambiguous Edges - Review These
- `facturas table` → `facturas_dian table`  [AMBIGUOUS]
  ESPECIFICACIONES.md · relation: conceptually_related_to

## Knowledge Gaps
- **215 isolated node(s):** `name`, `version`, `description`, `main`, `start` (+210 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `facturas table` and `facturas_dian table`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `backend/CLAUDE.md (backend conventions)` connect `backend/CLAUDE.md (backend conventions)` to `Recibo_FE_Create.sql (esquema oficial - DDL)`, `adapters/siesa/ (SOAP WSDL adapter)`, `docker-compose.yml orchestration`, `ESPECIFICACIONES.md (functional spec)`, `PROYECT-GGT (Aplicativo de Conciliación DIAN-SIESA)`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `Recibo_FE_Create.sql (esquema oficial - DDL)` connect `Recibo_FE_Create.sql (esquema oficial - DDL)` to `backend/CLAUDE.md (backend conventions)`, `graphify Skill`, `frontend/CLAUDE.md (frontend conventions)`, `ESPECIFICACIONES.md (functional spec)`, `PROYECT-GGT (Aplicativo de Conciliación DIAN-SIESA)`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Why does `PROYECT-GGT (Aplicativo de Conciliación DIAN-SIESA)` connect `PROYECT-GGT (Aplicativo de Conciliación DIAN-SIESA)` to `frontend/CLAUDE.md (frontend conventions)`, `docker-compose.yml orchestration`, `ESPECIFICACIONES.md (functional spec)`, `backend/CLAUDE.md (backend conventions)`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _215 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `src/index.js` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._