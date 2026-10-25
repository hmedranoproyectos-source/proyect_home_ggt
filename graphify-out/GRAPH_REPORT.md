# Graph Report - proyect_home_ggt  (2026-10-25)

## Corpus Check
- 154 files · ~75,226 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1116 nodes · 1802 edges · 104 communities (72 shown, 32 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 129 edges (avg confidence: 0.56)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7e5bf823`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Recibo_FE_Create.sql (esquema oficial - DDL)
- datos-mock.ts
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
- facturasDianExcelParser.js
- siesaConsultasService.js
- validate-infra.js
- ordenesCompraService.js
- auditoria_acciones
- eslint.config.mjs
- next.config.ts
- README.md
- Skills CLI (npx skills)
- env.js
- PROYECT-GGT (Aplicativo de Conciliación DIAN-SIESA)
- frontend/CLAUDE.md (frontend conventions)
- docker-compose.yml orchestration
- ESPECIFICACIONES.md (functional spec)
- tab-buzon.tsx
- auditar
- invoiceIngestService.js
- src/index.js
- workers/index.js
- sesion-contexto.tsx
- seedPipeline.js
- rolesService.js
- adjuntos_correos
- buzones
- config_buzon_fe
- correos
- detalles_facturas
- facturas
- facturas_dian
- facturas.routes.js
- app/layout.tsx
- scripts
- auditoriaService.js
- WEB SERVICE PARA IMPORTACION DE DATOS
- emailConnectionService.js
- barra-lateral.tsx
- config.routes.js
- bullmq
- cors
- express
- imap
- ioredis
- roles.routes.js
- usuarios.routes.js
- entradaAlmacenService.js
- morgan
- TabUsuarios
- facturasErpService.js
- roles
- modal-ingresar-factura.tsx
- [id]/page.tsx
- permisos.routes.js
- bandeja/page.tsx
- tab-usuarios.tsx
- auth.routes.js
- seedAuth.js
- TabCompanias
- facturas_erp
- informes/page.tsx
- configBuzonService.js
- permisos-rutas.ts
- Plano SIESA/UnoEE — Documento de Entradas y Devoluciones de Almacén
- usuariosService.js
- companias.controller.js
- db.js
- entradasAlmacen.routes.js
- dotenv
- express-rate-limit
- mailparser
- multer
- socket.io
- xlsx
- detalles_entrada_almacen
- detalles_ordenes_compras
- entradas_almacen
- ordenes_compras
- dashboard/page.tsx
- config.controller.js
- informes.routes.js
- emailScanProcessor.js
- tab-conciliacion.tsx
- attachmentExtractor.js
- tipos.ts
- dashboardService.js
- dashboard.routes.js

## God Nodes (most connected - your core abstractions)
1. `colores` - 21 edges
2. `compilerOptions` - 16 edges
3. `TabRoles()` - 14 edges
4. `tienePermiso()` - 14 edges
5. `api` - 14 edges
6. `useSesion()` - 13 edges
7. `TabUsuarios()` - 13 edges
8. `formatoMoneda()` - 13 edges
9. `Recibo_FE_Create.sql (esquema oficial - DDL)` - 13 edges
10. `graphify Skill` - 13 edges

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

## Communities (104 total, 32 thin omitted)

### Community 0 - "Recibo_FE_Create.sql (esquema oficial - DDL)"
Cohesion: 0.19
Nodes (16): conciliacion.js service (validateInvoice), RC-06 tabla de auditoría (pendiente de diseño), config_buzon_fe table, detalles_facturas table, detalles_ordenes_compras table, entradas_almacen table, equivalencias_proveedores table, estados_documentos table (chained state machine) (+8 more)

### Community 1 - "datos-mock.ts"
Cohesion: 0.14
Nodes (14): colorEvento(), ModalTrazabilidad(), Props, ATENCION_IDS, buscarFactura(), ESTADOS, FACTURAS, LINEAS_BASE (+6 more)

### Community 2 - "dependencies"
Cohesion: 0.05
Nodes (42): axios, @emotion/react, @emotion/styled, eslint, eslint-config-next, dependencies, axios, @emotion/react (+34 more)

### Community 3 - "compilerOptions"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 4 - "backend/CLAUDE.md (backend conventions)"
Cohesion: 0.20
Nodes (12): middleware/auth.js (requireAuth, requirePreSession, requirePermission), authService.js (multiempresa login), backend/CLAUDE.md (backend conventions), conciliacionWorker.js (BullMQ consumer), adapters/dian/ (DIAN document adapter), emailWorker.js (cron/scheduler node-imap), excelMapper.js (Excel column mapping), Login multiempresa 2-step flow (POST /api/auth/login, /select-company) (+4 more)

### Community 5 - "dependencies"
Cohesion: 0.15
Nodes (13): adm-zip, dependencies, adm-zip, bcrypt, jsonwebtoken, mysql2, soap, xml2js (+5 more)

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

### Community 13 - "facturasDianExcelParser.js"
Cohesion: 0.13
Nodes (19): { auditar }, { ExcelFormatoInvalidoError }, facturasDianImportService, importarExcel(), ENCABEZADOS_REQUERIDOS, ExcelFormatoInvalidoError, mapearFila(), normalizarConsecutivo() (+11 more)

### Community 14 - "siesaConsultasService.js"
Cohesion: 0.07
Nodes (27): env, getClient(), soap, buildPvstrParametros(), CONSULTAS, ejecutarConsulta(), env, { getClient } (+19 more)

### Community 15 - "validate-infra.js"
Cohesion: 0.33
Nodes (5): base, { execSync }, fs, input, path

### Community 16 - "ordenesCompraService.js"
Cohesion: 0.18
Nodes (14): actualizarEstadoFactura(), auditoriaService, buscarOrdenCompraEnSiesa(), calcularRangoBusqueda(), conciliarOrdenCompra(), db, ESTADOS, formatearFechaSiesa() (+6 more)

### Community 17 - "auditoria_acciones"
Cohesion: 0.50
Nodes (3): companias, auditoria_acciones, usuarios

### Community 23 - "env.js"
Cohesion: 0.13
Nodes (13): missing, REQUIRED_VARS, connection, env, IORedis, conciliacionQueue, connection, env (+5 more)

### Community 24 - "PROYECT-GGT (Aplicativo de Conciliación DIAN-SIESA)"
Cohesion: 0.18
Nodes (11): adapters/siesa/ (SOAP WSDL adapter), Causación contable, Worker de conciliación (BullMQ), Dashboard en tiempo real (Socket.io), Email Worker (node-imap + mailparser), Entrada de Almacén (estado 0 - Elaboración), PROYECT-GGT (Aplicativo de Conciliación DIAN-SIESA), Recibo_FE_Create.sql (esquema oficial) (+3 more)

### Community 25 - "frontend/CLAUDE.md (frontend conventions)"
Cohesion: 0.22
Nodes (9): Multiempresa / id_cia convention, companias table, RR-05 línea de tiempo de factura, RR - Requisitos de Reportes, Next.js 16 agent rules warning (breaking changes), Detalle de factura screen (RR-05 timeline), frontend/CLAUDE.md (frontend conventions), frontend-design skill usage (+1 more)

### Community 26 - "docker-compose.yml orchestration"
Cohesion: 0.44
Nodes (9): backend service (conciliacion_backend), docker-compose.yml orchestration, frontend service (conciliacion_frontend), mysql service (conciliacion_mysql), nginx service (reverse proxy), phpmyadmin service (dev only), redis service (conciliacion_redis), worker service (conciliacion_worker, src/workers/index.js) (+1 more)

### Community 27 - "ESPECIFICACIONES.md (functional spec)"
Cohesion: 0.17
Nodes (12): ublParser.js (UBL 2.1 tag extraction), ubl-invoice-parsing skill (proposed), BullMQ queue architecture (Scheduler/Worker/retry), ESPECIFICACIONES.md (functional spec), Estado 'En Elaboración' (SIESA Estado 0) business rule, RA - Requisitos de Automatización, RC-02 alertas rojo/amarillo, RC-04 duplicidad (UNIQUE id_cia, id_proveedor, prefijo_fe, consecutivo_fe) (+4 more)

### Community 28 - "tab-buzon.tsx"
Cohesion: 0.16
Nodes (19): CIFRADOS, ETIQUETAS_CARPETAS, mensajeErrorBuzon(), TabBuzon(), cargarCarpetasClasificador(), handleContar(), handleGuardar(), handleProbar() (+11 more)

### Community 29 - "auditar"
Cohesion: 0.15
Nodes (12): guardarBuzon(), actualizarPermisos(), { auditar }, crear(), eliminar(), rolesService, actualizar(), { auditar } (+4 more)

### Community 30 - "invoiceIngestService.js"
Cohesion: 0.06
Nodes (44): conciliacionDianErpService, CODIGOS_IMPUESTO, DocumentoNoFacturaError, DOCUMENTOS_NO_FACTURA, extractLines(), extractParty(), extractTaxes(), first() (+36 more)

### Community 31 - "src/index.js"
Cohesion: 0.07
Nodes (24): app, auditoriaRoutes, authRoutes, companiasRoutes, configRoutes, cors, dashboardRoutes, db (+16 more)

### Community 32 - "workers/index.js"
Cohesion: 0.12
Nodes (16): connection, emailQueue, env, { Queue }, registrarSchedulerEscaneo(), registrarSchedulerFacturasErp(), bootstrap(), { conciliarOrdenCompra } (+8 more)

### Community 33 - "sesion-contexto.tsx"
Cohesion: 0.12
Nodes (23): CompaniaPreSesion, LoginPage(), handleSeleccionCia(), handleSubmit(), login(), LoginOk, LoginResultado, LoginSeleccionCompania (+15 more)

### Community 34 - "seedPipeline.js"
Cohesion: 0.23
Nodes (11): bcrypt, crypto, db, env, ESTADOS, main(), nextId(), seedBuzon() (+3 more)

### Community 44 - "facturas.routes.js"
Cohesion: 0.08
Nodes (17): { DOWNLOADS_BASE_PATH }, facturasService, fs, path, express, facturasController, facturasDianImportController, facturasErpController (+9 more)

### Community 45 - "app/layout.tsx"
Cohesion: 0.29
Nodes (5): inter, metadata, Props, ProveedoresApp(), tema

### Community 46 - "scripts"
Cohesion: 0.29
Nodes (7): scripts, dev, seed:auth, seed:pipeline, start, test, worker

### Community 48 - "WEB SERVICE PARA IMPORTACION DE DATOS"
Cohesion: 0.14
Nodes (13): 1. `CrearConexionXML`, 2. `ImportarXML`, Cómo probarlo, Ejemplo: importación de clientes POS, Métodos expuestos aplicables para importación, Notas, Objetivo, Objetivo general (+5 more)

### Community 49 - "emailConnectionService.js"
Cohesion: 0.17
Nodes (14): buildImapConfig(), configBuzonService, countMailboxes(), finish(), siguiente(), countMessages(), fetchUnreadMessages(), Imap (+6 more)

### Community 50 - "barra-lateral.tsx"
Cohesion: 0.24
Nodes (8): activo(), BarraLateral(), handleCerrar(), ICONOS, EncabezadoPagina(), ITEMS_MENU, useSesion(), estilosPanel

### Community 51 - "config.routes.js"
Cohesion: 0.40
Nodes (4): configController, express, { requireAuth, requirePermission }, router

### Community 57 - "roles.routes.js"
Cohesion: 0.40
Nodes (4): express, { requireAuth, requirePermission }, rolesController, router

### Community 58 - "usuarios.routes.js"
Cohesion: 0.40
Nodes (4): express, { requireAuth, requirePermission }, router, usuariosController

### Community 59 - "entradaAlmacenService.js"
Cohesion: 0.16
Nodes (14): assertSinOrdenCompra(), buildLinea451(), buildLinea470(), entradaAlmacenService, ESTADOS_ENTRADA_ALMACEN, auditoriaService, { buildLinea451, buildLinea470, assertSinOrdenCompra }, crearDetalles() (+6 more)

### Community 61 - "TabUsuarios"
Cohesion: 0.15
Nodes (11): TabUsuarios(), confirmarEliminar(), guardarEdicion(), guardarUsuario(), actualizarUsuario(), crearUsuario(), EdicionUsuario, eliminarUsuario() (+3 more)

### Community 62 - "facturasErpService.js"
Cohesion: 0.14
Nodes (17): auditoriaService, calcularRangoUltimoMes(), CAMPOS_REQUERIDOS, camposFaltantes(), db, formatearFechaSiesa(), { getUsuarioSistemaId }, importarDesdeSiesa() (+9 more)

### Community 65 - "modal-ingresar-factura.tsx"
Cohesion: 0.14
Nodes (22): CampoFormulario, CAMPOS, CAMPOS_CON_CATALOGO, DefinicionCampo, extraerCodigo(), extraerEtiqueta(), FORMULARIO_VACIO, ModalIngresarFactura() (+14 more)

### Community 67 - "[id]/page.tsx"
Cohesion: 0.19
Nodes (15): FacturaPage(), handlePrevisualizarPdf(), FilaResumen(), ModalOrdenCompra(), Props, ResumenFila(), ModalPreviewPdf(), Props (+7 more)

### Community 68 - "permisos.routes.js"
Cohesion: 0.40
Nodes (4): express, permisosController, { requireAuth }, router

### Community 69 - "bandeja/page.tsx"
Cohesion: 0.15
Nodes (13): BandejaPage(), handleExportar(), ESTADOS, ChipEstado(), ChipEstadoProps, ChipSiesa(), ChipSiesaProps, ChipUsuarioProps (+5 more)

### Community 70 - "tab-usuarios.tsx"
Cohesion: 0.15
Nodes (18): TabRoles(), confirmarEliminarRol(), guardarPermisos(), guardarRol(), sxBotonAzul, sxBotonVerde, sxEncabezadoTabla, sxTabsAzul (+10 more)

### Community 71 - "auth.routes.js"
Cohesion: 0.29
Nodes (6): authController, express, loginLimiter, rateLimit, { requireAuth, requirePreSession }, router

### Community 72 - "seedAuth.js"
Cohesion: 0.24
Nodes (13): bcrypt, COMPANIA_DEFAULT, db, ensureRolPermiso(), ensureUsuarioRol(), getOrCreateCompania(), getOrCreatePermiso(), getOrCreatePermisoVerFacturas() (+5 more)

### Community 73 - "TabCompanias"
Cohesion: 0.33
Nodes (5): TabCompanias(), confirmarEliminar(), guardarCompania(), crearCompania(), eliminarCompania()

### Community 75 - "informes/page.tsx"
Cohesion: 0.14
Nodes (17): formatoFecha(), isoDesdeFormatoFecha(), TabComparativo(), handleCargar(), handleExportar(), TabFacturasDian(), TabFacturasErp(), COMPARATIVO (+9 more)

### Community 76 - "configBuzonService.js"
Cohesion: 0.20
Nodes (11): asegurarCarpeta(), db, defaults(), env, fs, guardar(), mapearPublico(), obtenerPorCia() (+3 more)

### Community 78 - "permisos-rutas.ts"
Cohesion: 0.25
Nodes (12): HomePage(), GuardarRuta(), Props, PERMISO_GESTIONAR_COMPANIAS, PERMISO_GESTIONAR_CONFIG_EMAIL, PERMISO_GESTIONAR_ROLES, PERMISO_GESTIONAR_USUARIOS, permisoRequerido() (+4 more)

### Community 79 - "Plano SIESA/UnoEE — Documento de Entradas y Devoluciones de Almacén"
Cohesion: 0.22
Nodes (8): Checklist antes de escribir código (nuevo servicio de dominio), Código escrito (2026-09-30), Origen de cada campo del registro 451 (confirmado 2026-09-30, caso `referencia_oc` nulo), Origen de cada campo del registro 470 (confirmado 2026-09-30), Plano SIESA/UnoEE — Documento de Entradas y Devoluciones de Almacén, Registro tipo 451 — Documento (versión 02), Registro tipo 470 — Movimiento de Entradas de Almacén (versión 01), Relación con el esquema del proyecto

### Community 81 - "companias.controller.js"
Cohesion: 0.12
Nodes (9): { auditar }, companiasService, crear(), eliminar(), companiasController, express, { requireAuth, requirePermission }, router (+1 more)

### Community 82 - "db.js"
Cohesion: 0.20
Nodes (5): permisosService, env, mysql, pool, db

### Community 83 - "entradasAlmacen.routes.js"
Cohesion: 0.40
Nodes (4): entradasAlmacenController, express, { requireAuth, requirePermission }, router

### Community 95 - "dashboard/page.tsx"
Cohesion: 0.19
Nodes (9): DashboardPage(), KPI, GraficoBarras(), Props, api, RECIBIDAS_7_DIAS, REGISTRO_SIESA, obtenerResumenDashboard() (+1 more)

### Community 96 - "config.controller.js"
Cohesion: 0.17
Nodes (6): { auditar }, CARPETAS_CLASIFICADOR, CIFRADOS, configBuzonService, emailConnectionService, PROTOCOLOS

### Community 97 - "informes.routes.js"
Cohesion: 0.40
Nodes (4): express, informesController, { requireAuth }, router

### Community 98 - "emailScanProcessor.js"
Cohesion: 0.21
Nodes (11): {
  CARPETA_PROCESADOS,
  CARPETA_DUPLICADOS,
  CARPETA_ERROR_FORMATO,
  CARPETA_NOTA_CREDITO,
  CARPETA_NOTA_DEBITO,
}, clasificarCorreo(), conciliacionQueue, db, encolarConciliaciones(), ESTADOS, { extraerAdjuntos }, {
  fetchUnreadMessages,
  marcarComoLeido,
  moveMessage,
} (+3 more)

### Community 99 - "tab-conciliacion.tsx"
Cohesion: 0.24
Nodes (9): COLOR_ESTADO, ESTADOS, TabConciliacion(), handleConciliar(), handleExportar(), siNo(), obtenerConciliacionDianErp(), EstadoConciliacion (+1 more)

### Community 100 - "attachmentExtractor.js"
Cohesion: 0.29
Nodes (9): AdmZip, esCorreoAdjunto(), expandirZip(), extension(), EXTENSIONES_INTERES, extraerAdjuntos(), path, { simpleParser } (+1 more)

### Community 101 - "tipos.ts"
Cohesion: 0.24
Nodes (8): ConfigBuzonApp, CrearEntradaAlmacenResponse, FacturaAtencionApp, FilaConciliacionDianErp, LineaFacturaApp, LineaOrdenCompraApp, OrdenCompraApp, ParametrosFormularioEntradaAlmacen

### Community 102 - "dashboardService.js"
Cohesion: 0.22
Nodes (4): dashboardService, ESTADOS, db, ESTADOS

### Community 103 - "dashboard.routes.js"
Cohesion: 0.40
Nodes (4): dashboardController, express, { requireAuth }, router

## Ambiguous Edges - Review These
- `facturas table` → `facturas_dian table`  [AMBIGUOUS]
  ESPECIFICACIONES.md · relation: conceptually_related_to

## Knowledge Gaps
- **420 isolated node(s):** `dashboardService`, `db`, `ESTADOS`, `KPI`, `Props` (+415 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **32 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `facturas table` and `facturas_dian table`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `xlsx` connect `xlsx` to `tab-conciliacion.tsx`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `xlsx` connect `xlsx` to `dependencies`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `xlsx`, `socket.io`, `backend/package.json`, `bullmq`, `cors`, `express`, `dotenv`, `express-rate-limit`, `imap`, `ioredis`, `mailparser`, `morgan`, `multer`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **What connects `dashboardService`, `db`, `ESTADOS` to the rest of the system?**
  _420 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `datos-mock.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1437908496732026 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.046511627906976744 - nodes in this community are weakly interconnected._