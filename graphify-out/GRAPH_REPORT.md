# Graph Report - proyect_home_ggt  (2026-09-14)

## Corpus Check
- 110 files · ~42,067 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 720 nodes · 1129 edges · 60 communities (43 shown, 17 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 60 edges (avg confidence: 0.6)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fb1a5d88`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Recibo_FE_Create.sql (esquema oficial - DDL)
- informes/page.tsx
- dependencies
- compilerOptions
- backend/CLAUDE.md (backend conventions)
- dependencies
- 01_schema.sql
- Recibo FE Create.sql
- auth.js
- backend/package.json
- graphify Skill
- Find Skills
- authService.js
- seedAuth.js
- siesaConsultasService.js
- validate-infra.js
- sesion.ts
- auditoria_acciones
- eslint.config.mjs
- next.config.ts
- README.md
- Skills CLI (npx skills)
- emailConnectionService.js
- adapters/siesa/ (SOAP WSDL adapter)
- frontend/CLAUDE.md (frontend conventions)
- docker-compose.yml orchestration
- ESPECIFICACIONES.md (functional spec)
- tema.ts
- roles.controller.js
- ublInvoiceParser.js
- src/index.js
- env.js
- workers/index.js
- seedPipeline.js
- companias.controller.js
- adjuntos_correos
- buzones
- config_buzon_fe
- correos
- detalles_facturas
- facturas
- facturas_dian
- emailScanProcessor.js
- app/layout.tsx
- permisos.controller.js
- auditoriaService.js
- auth.routes.js
- attachmentExtractor.js
- auditoria.routes.js
- config.routes.js
- conciliacionQueue.js
- config.controller.js
- usuarios.controller.js
- companias.routes.js
- permisos.routes.js
- roles.routes.js
- usuarios.routes.js
- db.js

## God Nodes (most connected - your core abstractions)
1. `colores` - 17 edges
2. `compilerOptions` - 16 edges
3. `Recibo_FE_Create.sql (esquema oficial - DDL)` - 13 edges
4. `graphify Skill` - 13 edges
5. `backend/CLAUDE.md (backend conventions)` - 13 edges
6. `useSesion()` - 11 edges
7. `parseUblInvoice()` - 11 edges
8. `companias` - 10 edges
9. `companias` - 10 edges
10. `leerSesion()` - 9 edges

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
- 3-file cycle: `frontend/lib/api.ts -> frontend/lib/sesion.ts -> frontend/lib/servicios/companiasApi.ts -> frontend/lib/api.ts`
- 3-file cycle: `frontend/lib/api.ts -> frontend/lib/sesion.ts -> frontend/lib/servicios/authApi.ts -> frontend/lib/api.ts`

## Hyperedges (group relationships)
- **End-to-end conciliación pipeline (Email -> Parse -> SIESA -> Dashboard)** — claude_md_email_worker, claude_md_conciliacion_worker, claude_md_siesa_soap_adapter, claude_md_entrada_almacen, claude_md_causacion_contable, claude_md_dashboard_socketio [EXTRACTED 1.00]
- **Docker Compose orchestrated services** — docker_compose_yml_mysql_service, docker_compose_yml_redis_service, docker_compose_yml_phpmyadmin_service, docker_compose_yml_backend_service, docker_compose_yml_worker_service, docker_compose_yml_frontend_service, docker_compose_yml_nginx_service [EXTRACTED 1.00]
- **Multiempresa auth flow (login, roles, session, id_cia filtering)** — backend_claude_md_login_multiempresa_flow, backend_claude_md_auth_service_js, backend_claude_md_auth_middleware_js, frontend_claude_md_nextauth_session, especificaciones_md_usuarios_roles, claude_md_multiempresa_id_cia [INFERRED 0.85]

## Communities (60 total, 17 thin omitted)

### Community 0 - "Recibo_FE_Create.sql (esquema oficial - DDL)"
Cohesion: 0.19
Nodes (16): conciliacion.js service (validateInvoice), RC-06 tabla de auditoría (pendiente de diseño), config_buzon_fe table, detalles_facturas table, detalles_ordenes_compras table, entradas_almacen table, equivalencias_proveedores table, estados_documentos table (chained state machine) (+8 more)

### Community 1 - "informes/page.tsx"
Cohesion: 0.07
Nodes (42): BandejaPage(), handleExportar(), DashboardPage(), KPI, FacturaPage(), FilaResumen(), TabComparativo(), handleExportar() (+34 more)

### Community 2 - "dependencies"
Cohesion: 0.05
Nodes (40): axios, @emotion/react, @emotion/styled, eslint, eslint-config-next, dependencies, axios, @emotion/react (+32 more)

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

### Community 8 - "auth.js"
Cohesion: 0.28
Nodes (6): auditoriaService, env, extractToken(), jwt, requireAuth(), requirePreSession()

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
Cohesion: 0.16
Nodes (14): authService, bcrypt, db, env, findUserByUsername(), getCompaniasForUser(), getRolesAndPermisos(), jwt (+6 more)

### Community 13 - "seedAuth.js"
Cohesion: 0.24
Nodes (13): bcrypt, COMPANIA_DEFAULT, db, ensureRolPermiso(), ensureUsuarioRol(), getOrCreateCompania(), getOrCreatePermiso(), getOrCreatePermisoVerFacturas() (+5 more)

### Community 14 - "siesaConsultasService.js"
Cohesion: 0.07
Nodes (26): env, getClient(), soap, buildPvstrParametros(), CONSULTAS, ejecutarConsulta(), env, { getClient } (+18 more)

### Community 15 - "validate-infra.js"
Cohesion: 0.33
Nodes (5): base, { execSync }, fs, input, path

### Community 16 - "sesion.ts"
Cohesion: 0.13
Nodes (21): CompaniaPreSesion, LoginPage(), handleSeleccionCia(), handleSubmit(), HomePage(), GuardarRuta(), Props, login() (+13 more)

### Community 17 - "auditoria_acciones"
Cohesion: 0.50
Nodes (3): companias, auditoria_acciones, usuarios

### Community 23 - "emailConnectionService.js"
Cohesion: 0.24
Nodes (9): buildImapConfig(), countMessages(), env, fetchUnreadMessages(), Imap, marcarComoLeido(), finish(), { simpleParser } (+1 more)

### Community 24 - "adapters/siesa/ (SOAP WSDL adapter)"
Cohesion: 0.22
Nodes (9): adapters/siesa/ (SOAP WSDL adapter), Causación contable, Worker de conciliación (BullMQ), Dashboard en tiempo real (Socket.io), Email Worker (node-imap + mailparser), Entrada de Almacén (estado 0 - Elaboración), Adaptador SIESA (SOAP WS), siesa-soap-adapter skill (proposed) (+1 more)

### Community 25 - "frontend/CLAUDE.md (frontend conventions)"
Cohesion: 0.20
Nodes (10): Multiempresa / id_cia convention, PROYECT-GGT (Aplicativo de Conciliación DIAN-SIESA), Recibo_FE_Create.sql (esquema oficial), companias table, RC-02 alertas rojo/amarillo, Next.js 16 agent rules warning (breaking changes), Vista de conciliación screen (RC-01/RC-02/RC-03), frontend/CLAUDE.md (frontend conventions) (+2 more)

### Community 26 - "docker-compose.yml orchestration"
Cohesion: 0.44
Nodes (9): backend service (conciliacion_backend), docker-compose.yml orchestration, frontend service (conciliacion_frontend), mysql service (conciliacion_mysql), nginx service (reverse proxy), phpmyadmin service (dev only), redis service (conciliacion_redis), worker service (conciliacion_worker, src/workers/index.js) (+1 more)

### Community 27 - "ESPECIFICACIONES.md (functional spec)"
Cohesion: 0.15
Nodes (13): ublParser.js (UBL 2.1 tag extraction), ubl-invoice-parsing skill (proposed), BullMQ queue architecture (Scheduler/Worker/retry), ESPECIFICACIONES.md (functional spec), Estado 'En Elaboración' (SIESA Estado 0) business rule, RA - Requisitos de Automatización, RC-04 duplicidad (UNIQUE id_cia, id_proveedor, prefijo_fe, consecutivo_fe), RC - Requisitos de Control y Validación (+5 more)

### Community 28 - "tema.ts"
Cohesion: 0.10
Nodes (33): TabCompanias(), TabRoles(), TabUsuarios(), activo(), BarraLateral(), handleCerrar(), ITEMS, CampoFiltro() (+25 more)

### Community 30 - "ublInvoiceParser.js"
Cohesion: 0.10
Nodes (30): ESTADOS, CODIGOS_IMPUESTO, DocumentoNoFacturaError, DOCUMENTOS_NO_FACTURA, extractLines(), extractParty(), extractTaxes(), first() (+22 more)

### Community 31 - "src/index.js"
Cohesion: 0.09
Nodes (19): app, auditoriaRoutes, authRoutes, companiasRoutes, configRoutes, cors, db, env (+11 more)

### Community 32 - "env.js"
Cohesion: 0.18
Nodes (9): missing, REQUIRED_VARS, connection, env, IORedis, connection, emailQueue, env (+1 more)

### Community 33 - "workers/index.js"
Cohesion: 0.20
Nodes (9): registrarSchedulerEscaneo(), bootstrap(), conciliacionWorker, connection, emailWorker, env, { procesarEscaneo }, {
  registrarSchedulerEscaneo,
  EMAIL_QUEUE_NAME,
  EMAIL_SCAN_PATTERN,
} (+1 more)

### Community 34 - "seedPipeline.js"
Cohesion: 0.38
Nodes (6): db, env, ESTADOS, main(), seedBuzon(), seedEstados()

### Community 44 - "emailScanProcessor.js"
Cohesion: 0.29
Nodes (7): conciliacionQueue, db, { extraerAdjuntos }, {
  fetchUnreadMessages,
  marcarComoLeido,
}, { ingestarCorreo }, procesarEscaneo(), resolverBuzon()

### Community 45 - "app/layout.tsx"
Cohesion: 0.29
Nodes (5): inter, metadata, Props, ProveedoresApp(), tema

### Community 48 - "auth.routes.js"
Cohesion: 0.29
Nodes (6): authController, express, loginLimiter, rateLimit, { requireAuth, requirePreSession }, router

### Community 49 - "attachmentExtractor.js"
Cohesion: 0.43
Nodes (6): AdmZip, expandirZip(), extension(), EXTENSIONES_INTERES, extraerAdjuntos(), path

### Community 50 - "auditoria.routes.js"
Cohesion: 0.40
Nodes (4): auditoriaController, express, { requireAuth }, router

### Community 51 - "config.routes.js"
Cohesion: 0.40
Nodes (4): configController, express, { requireAuth, requirePermission }, router

### Community 52 - "conciliacionQueue.js"
Cohesion: 0.40
Nodes (4): conciliacionQueue, connection, env, { Queue }

### Community 55 - "companias.routes.js"
Cohesion: 0.40
Nodes (4): companiasController, express, { requireAuth }, router

### Community 56 - "permisos.routes.js"
Cohesion: 0.40
Nodes (4): express, permisosController, { requireAuth }, router

### Community 57 - "roles.routes.js"
Cohesion: 0.40
Nodes (4): express, { requireAuth }, rolesController, router

### Community 58 - "usuarios.routes.js"
Cohesion: 0.40
Nodes (4): express, { requireAuth }, router, usuariosController

### Community 59 - "db.js"
Cohesion: 0.50
Nodes (3): env, mysql, pool

## Ambiguous Edges - Review These
- `facturas table` → `facturas_dian table`  [AMBIGUOUS]
  ESPECIFICACIONES.md · relation: conceptually_related_to

## Knowledge Gaps
- **279 isolated node(s):** `authService`, `express`, `rateLimit`, `authController`, `{ requireAuth, requirePreSession }` (+274 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `facturas table` and `facturas_dian table`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `backend/CLAUDE.md (backend conventions)` connect `backend/CLAUDE.md (backend conventions)` to `Recibo_FE_Create.sql (esquema oficial - DDL)`, `adapters/siesa/ (SOAP WSDL adapter)`, `frontend/CLAUDE.md (frontend conventions)`, `docker-compose.yml orchestration`, `ESPECIFICACIONES.md (functional spec)`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **Why does `Recibo_FE_Create.sql (esquema oficial - DDL)` connect `Recibo_FE_Create.sql (esquema oficial - DDL)` to `frontend/CLAUDE.md (frontend conventions)`, `graphify Skill`, `ESPECIFICACIONES.md (functional spec)`, `backend/CLAUDE.md (backend conventions)`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **Why does `PROYECT-GGT (Aplicativo de Conciliación DIAN-SIESA)` connect `frontend/CLAUDE.md (frontend conventions)` to `adapters/siesa/ (SOAP WSDL adapter)`, `docker-compose.yml orchestration`, `ESPECIFICACIONES.md (functional spec)`, `backend/CLAUDE.md (backend conventions)`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **What connects `authService`, `express`, `rateLimit` to the rest of the system?**
  _279 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `informes/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06721215663354763 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.04878048780487805 - nodes in this community are weakly interconnected._