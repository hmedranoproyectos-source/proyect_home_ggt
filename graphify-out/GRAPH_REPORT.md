# Graph Report - proyect_home_ggt  (2026-09-19)

## Corpus Check
- 117 files · ~51,102 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 828 nodes · 1344 edges · 68 communities (44 shown, 24 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 84 edges (avg confidence: 0.57)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `87d7ef6d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Recibo_FE_Create.sql (esquema oficial - DDL)
- tipos.ts
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
- db.js
- siesaConsultasService.js
- validate-infra.js
- siesa.routes.js
- auditoria_acciones
- eslint.config.mjs
- next.config.ts
- README.md
- Skills CLI (npx skills)
- env.js
- adapters/siesa/ (SOAP WSDL adapter)
- frontend/CLAUDE.md (frontend conventions)
- docker-compose.yml orchestration
- ESPECIFICACIONES.md (functional spec)
- tab-usuarios.tsx
- roles.controller.js
- invoiceIngestService.js
- src/index.js
- workers/index.js
- sesion-contexto.tsx
- siesaService.js
- companias.controller.js
- adjuntos_correos
- buzones
- config_buzon_fe
- correos
- detalles_facturas
- facturas
- facturas_dian
- rolesService.js
- app/layout.tsx
- scripts
- auditoriaService.js
- auth.routes.js
- emailScanProcessor.js
- adm-zip
- config.routes.js
- bullmq
- cors
- express
- imap
- ioredis
- roles.routes.js
- usuarios.routes.js
- jsonwebtoken
- morgan
- mysql2
- xml2js
- roles
- emailQueue.js
- permisos.routes.js

## God Nodes (most connected - your core abstractions)
1. `colores` - 18 edges
2. `compilerOptions` - 16 edges
3. `tienePermiso()` - 14 edges
4. `TabRoles()` - 14 edges
5. `useSesion()` - 13 edges
6. `TabUsuarios()` - 13 edges
7. `Recibo_FE_Create.sql (esquema oficial - DDL)` - 13 edges
8. `graphify Skill` - 13 edges
9. `backend/CLAUDE.md (backend conventions)` - 13 edges
10. `auditar()` - 10 edges

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

## Communities (68 total, 24 thin omitted)

### Community 0 - "Recibo_FE_Create.sql (esquema oficial - DDL)"
Cohesion: 0.19
Nodes (16): conciliacion.js service (validateInvoice), RC-06 tabla de auditoría (pendiente de diseño), config_buzon_fe table, detalles_facturas table, detalles_ordenes_compras table, entradas_almacen table, equivalencias_proveedores table, estados_documentos table (chained state machine) (+8 more)

### Community 1 - "tipos.ts"
Cohesion: 0.06
Nodes (44): BandejaPage(), handleExportar(), DashboardPage(), KPI, FacturaPage(), FilaResumen(), TabComparativo(), handleExportar() (+36 more)

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
Cohesion: 0.15
Nodes (13): dependencies, bcrypt, dotenv, express-rate-limit, mailparser, soap, socket.io, bcrypt (+5 more)

### Community 6 - "01_schema.sql"
Cohesion: 0.21
Nodes (22): adjuntos_correos, buzones, companias, config_buzon_fe, correos, detalles_entrada_almacen, detalles_facturas, detalles_ordenes_compras (+14 more)

### Community 7 - "Recibo FE Create.sql"
Cohesion: 0.21
Nodes (22): adjuntos_correos, buzones, companias, config_buzon_fe, correos, detalles_entrada_almacen, detalles_facturas, detalles_ordenes_compras (+14 more)

### Community 8 - "auth.js"
Cohesion: 0.19
Nodes (10): auditoriaController, express, { requireAuth }, router, auditoriaService, env, extractToken(), jwt (+2 more)

### Community 9 - "backend/package.json"
Cohesion: 0.17
Nodes (11): author, description, devDependencies, nodemon, keywords, license, main, name (+3 more)

### Community 10 - "graphify Skill"
Cohesion: 0.11
Nodes (18): graphify slash-command trigger rule, known gap - SQL schema nodes vs doc semantic nodes not linked, Graphify consulta de contexto (project graph usage), graphify add / --watch reference, graphify export flags reference (wiki, neo4j, falkordb, svg, graphml, mcp, benchmark), graphify extraction subagent prompt spec, graphify GitHub clone and cross-repo merge reference, graphify hook install / claude install reference (+10 more)

### Community 11 - "Find Skills"
Cohesion: 0.14
Nodes (13): Common Skill Categories, Find Skills, How to Help Users Find Skills, Step 1: Understand What They Need, Step 2: Check the Leaderboard First, Step 3: Search for Skills, Step 4: Verify Quality Before Recommending, Step 5: Present Options to the User (+5 more)

### Community 12 - "authService.js"
Cohesion: 0.16
Nodes (14): authService, bcrypt, db, env, findUserByUsername(), getCompaniasForUser(), getRolesAndPermisos(), jwt (+6 more)

### Community 13 - "db.js"
Cohesion: 0.06
Nodes (27): permisosService, env, mysql, pool, bcrypt, COMPANIA_DEFAULT, db, ensureRolPermiso() (+19 more)

### Community 14 - "siesaConsultasService.js"
Cohesion: 0.19
Nodes (12): env, getClient(), soap, buildPvstrParametros(), CONSULTAS, ejecutarConsulta(), env, { getClient } (+4 more)

### Community 15 - "validate-infra.js"
Cohesion: 0.33
Nodes (5): base, { execSync }, fs, input, path

### Community 16 - "siesa.routes.js"
Cohesion: 0.17
Nodes (7): siesaService, consultasController, express, { requireAuth, requirePermission }, router, siesaController, siesaConsultasService

### Community 17 - "auditoria_acciones"
Cohesion: 0.50
Nodes (3): companias, auditoria_acciones, usuarios

### Community 23 - "env.js"
Cohesion: 0.18
Nodes (9): missing, REQUIRED_VARS, connection, env, IORedis, conciliacionQueue, connection, env (+1 more)

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

### Community 28 - "tab-usuarios.tsx"
Cohesion: 0.05
Nodes (65): CIFRADOS, mensajeErrorBuzon(), TabBuzon(), handleContar(), handleGuardar(), handleProbar(), TabCompanias(), confirmarEliminar() (+57 more)

### Community 29 - "roles.controller.js"
Cohesion: 0.15
Nodes (12): guardarBuzon(), actualizarPermisos(), { auditar }, crear(), eliminar(), rolesService, actualizar(), { auditar } (+4 more)

### Community 30 - "invoiceIngestService.js"
Cohesion: 0.08
Nodes (35): ESTADOS, CODIGOS_IMPUESTO, DocumentoNoFacturaError, DOCUMENTOS_NO_FACTURA, extractLines(), extractParty(), extractTaxes(), first() (+27 more)

### Community 31 - "src/index.js"
Cohesion: 0.09
Nodes (19): app, auditoriaRoutes, authRoutes, companiasRoutes, configRoutes, cors, db, env (+11 more)

### Community 32 - "workers/index.js"
Cohesion: 0.20
Nodes (9): registrarSchedulerEscaneo(), bootstrap(), conciliacionWorker, connection, emailWorker, env, { procesarEscaneo }, {
  registrarSchedulerEscaneo,
  EMAIL_QUEUE_NAME,
  EMAIL_SCAN_PATTERN,
} (+1 more)

### Community 33 - "sesion-contexto.tsx"
Cohesion: 0.11
Nodes (28): CompaniaPreSesion, LoginPage(), handleSeleccionCia(), handleSubmit(), HomePage(), GuardarRuta(), Props, permisoRequerido() (+20 more)

### Community 34 - "siesaService.js"
Cohesion: 0.32
Nodes (7): buildPvstrDatos(), env, { getClient }, importarXML(), parseErrorDataSet(), xml2js, xmlBuilder

### Community 35 - "companias.controller.js"
Cohesion: 0.18
Nodes (8): { auditar }, companiasService, crear(), eliminar(), companiasController, express, { requireAuth, requirePermission }, router

### Community 45 - "app/layout.tsx"
Cohesion: 0.29
Nodes (5): inter, metadata, Props, ProveedoresApp(), tema

### Community 46 - "scripts"
Cohesion: 0.29
Nodes (7): scripts, dev, seed:auth, seed:pipeline, start, test, worker

### Community 48 - "auth.routes.js"
Cohesion: 0.29
Nodes (6): authController, express, loginLimiter, rateLimit, { requireAuth, requirePreSession }, router

### Community 49 - "emailScanProcessor.js"
Cohesion: 0.05
Nodes (44): { auditar }, CIFRADOS, configBuzonService, emailConnectionService, PROTOCOLOS, AdmZip, expandirZip(), extension() (+36 more)

### Community 51 - "config.routes.js"
Cohesion: 0.40
Nodes (4): configController, express, { requireAuth, requirePermission }, router

### Community 57 - "roles.routes.js"
Cohesion: 0.40
Nodes (4): express, { requireAuth, requirePermission }, rolesController, router

### Community 58 - "usuarios.routes.js"
Cohesion: 0.40
Nodes (4): express, { requireAuth, requirePermission }, router, usuariosController

### Community 65 - "emailQueue.js"
Cohesion: 0.40
Nodes (4): connection, emailQueue, env, { Queue }

### Community 68 - "permisos.routes.js"
Cohesion: 0.40
Nodes (4): express, permisosController, { requireAuth }, router

## Ambiguous Edges - Review These
- `facturas table` → `facturas_dian table`  [AMBIGUOUS]
  ESPECIFICACIONES.md · relation: conceptually_related_to

## Knowledge Gaps
- **305 isolated node(s):** `configBuzonService`, `emailConnectionService`, `{ auditar }`, `PROTOCOLOS`, `CIFRADOS` (+300 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **24 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `facturas table` and `facturas_dian table`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `colores` connect `tab-usuarios.tsx` to `sesion-contexto.tsx`, `tipos.ts`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **Why does `backend/CLAUDE.md (backend conventions)` connect `backend/CLAUDE.md (backend conventions)` to `Recibo_FE_Create.sql (esquema oficial - DDL)`, `adapters/siesa/ (SOAP WSDL adapter)`, `frontend/CLAUDE.md (frontend conventions)`, `docker-compose.yml orchestration`, `ESPECIFICACIONES.md (functional spec)`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **Why does `Recibo_FE_Create.sql (esquema oficial - DDL)` connect `Recibo_FE_Create.sql (esquema oficial - DDL)` to `frontend/CLAUDE.md (frontend conventions)`, `graphify Skill`, `ESPECIFICACIONES.md (functional spec)`, `backend/CLAUDE.md (backend conventions)`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **What connects `configBuzonService`, `emailConnectionService`, `{ auditar }` to the rest of the system?**
  _305 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `tipos.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06400409626216078 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.04878048780487805 - nodes in this community are weakly interconnected._