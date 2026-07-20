# CLAUDE.md — Aplicativo de Conciliación DIAN - SIESA

Este archivo es leído por Claude Code al iniciar sesión en este repositorio.
Es el documento maestro; `backend/CLAUDE.md` y `frontend/CLAUDE.md` contienen
detalle específico de cada subproyecto y se leen además de este.

## 1. Qué es este proyecto

**PROYECT-GGT**: aplicativo de conciliación entre **facturas electrónicas
DIAN** (XML UBL 2.1, recibidas por correo) y el ERP **SIESA** (Web
Services SOAP), para El Gigante del Hogar (Colombia). Automatiza: recepción
centralizada de FE, extracción de datos UBL, cruce contra Órdenes de Compra
en SIESA, generación automática de "Entrada de Almacén" + causación
contable, y reporting en línea. Ver `ESPECIFICACIONES.md` para el detalle
funcional completo (requisitos RP/RI/RC/RA/RR).

Contexto de negocio (no técnico) — proceso actual sin este sistema:
dispersión de canales (correo, portal DIAN, físico, ERP), registro manual,
~6.000 documentos/mes, sin trazabilidad ni conciliación estandarizada.

## 2. Stack y arquitectura

```
raiz/
├── frontend/        Next.js 16.2.10, NextAuth.js, Material UI, axios
├── backend/         Node.js, Express.js, MySQL 8+, BullMQ + Redis,
│                     node-imap, mailparser, xml2js, xlsx (SheetJS), Socket.io
├── nginx/            proxy reverso + balanceador
├── mysql-init/       scripts .sql de inicialización de esquema/seed
├── .gitignore
└── docker-compose.yml
```

Todo el stack corre orquestado con **Docker Compose**. Servicios esperados
en `docker-compose.yml`: `frontend`, `backend` (API), `worker` (BullMQ
worker — puede ser el mismo código del backend con otro entrypoint),
`mysql`, `redis`, `nginx`, `phpmyadmin` (administración visual de MySQL en
desarrollo). `backend` y `worker` comparten imagen/código.

Flujo de alto nivel:
1. **Email Worker** (node-imap + mailparser) escanea el buzón oficial de
   contabilidad cada 10 min (07:00–19:00), detecta adjuntos, extrae PDF/XML
   (incluyendo .zip), valida UBL 2.1.
2. Datos parseados se guardan en MySQL; se encola un **job de conciliación**
   en BullMQ (Redis como broker).
3. **Worker de conciliación** consulta el Web Service SOAP de SIESA
   (adaptador SIESA), cruza líneas de la FE contra la Orden de Compra,
   genera alertas (rojo/amarillo) según RC-02.
4. Si pasa validación (o usuario aprueba manualmente), se dispara
   sincrónicamente el WS de SIESA para crear "Entrada de Almacén" en
   estado `0` (Elaboración) y luego la causación contable.
5. Dashboard en tiempo real vía **Socket.io** (`new_invoice`, cambios de
   estado); frontend consume vía NextAuth-protected API + sockets.

## 3. Convenciones globales

- Idioma de dominio: nombres de tablas, campos y reglas de negocio en
  **español** (ya definidos en el DDT/DER — no traducir). Código
  (variables, funciones) en **inglés**, salvo términos de dominio DIAN/SIESA
  que no tienen traducción естественная (ej. `nit`, `causacion`).
- Multiempresa: casi toda entidad de negocio cuelga de `companias`
  (`id_cia`). Nunca asumir una sola compañía activa — filtrar siempre por
  `id_cia` en queries y en el contexto de sesión del usuario autenticado.
- Toda acción sensible (creación, modificación, validación, contabilización)
  debe quedar en la tabla de auditoría (RC-06 — no existe todavía en el
  esquema oficial, ver `ESPECIFICACIONES.md` §7.6 para la propuesta de
  diseño) — no es opcional.
- Secretos y config sensible **solo por variables de entorno** (`.env`,
  nunca hardcodeados). Cada subcarpeta tiene su propio `.env.example`.
- **phpMyAdmin es solo para desarrollo local.** No debe exponerse en
  ambientes de producción/staging (quitar el servicio o restringirlo por
  red/IP en el `docker-compose` de esos ambientes); sus credenciales
  también salen de variables de entorno, nunca hardcodeadas.
- Commits: convencionales (`feat:`, `fix:`, `chore:`, `docs:`), en español
  o inglés pero consistente por PR.

## 4. Antes de escribir código

1. Lee `ESPECIFICACIONES.md` para el requisito relacionado (código RP-xx,
   RC-xx, RA-xx, etc.) antes de implementar — no inventar reglas de negocio.
2. Si vas a tocar el esquema de BD, el **esquema oficial es
   `Recibo_FE_Create.sql`** (debe vivir en `mysql-init/`) — no el diagrama
   preliminar ni las tablas `proc_*`/`sys_*` que se habían propuesto en
   una iteración anterior del DDT (esas quedaron descartadas, ver nota al
   inicio de `ESPECIFICACIONES.md` §7). Antes de escribir migraciones o
   modelos, revisa `ESPECIFICACIONES.md` §7, que documenta el esquema real
   tabla por tabla y señala 3 inconsistencias del DDL pendientes de
   confirmar con el equipo de BD (FK de `ordenes_compras.id_proveedor`,
   tipo de `facturas.notas_fe`, y la **tabla de auditoría RC-06 que no
   existe todavía y hay que diseñar**).
3. Usa **Context7** (MCP ya configurado) con la herramienta `query-docs`
   para consultar documentación actualizada de librerías (React, Next.js,
   Material UI, MySQL, Node.js, `node-imap`, `mailparser`, `bullmq`,
   `next-auth`, `xml2js`, `xlsx`, `socket.io`) antes de asumir una API por
   memoria o de proponer cambios en el código — estas librerías cambian
   entre versiones mayores.

## 5. Comandos frecuentes (ajustar cuando exista package.json real)

```bash
docker compose up -d --build      # levantar todo el stack
docker compose logs -f backend    # logs API
docker compose logs -f worker     # logs BullMQ worker
docker compose exec mysql mysql -u root -p   # acceso a MySQL por CLI
# phpMyAdmin: http://localhost:<PHPMYADMIN_PORT> (definido en .env), acceso visual a MySQL
```

## 6. Skills de Claude recomendadas para este proyecto

| Skill | Cuándo se usa aquí |
|---|---|
| **frontend-design** (built-in) | Al diseñar/mockear pantallas del Dashboard de conciliación, listado de facturas, alertas rojo/amarillo, línea de tiempo de una factura (RR-05) antes de codificarlas en Next.js + MUI. |
| **xlsx** (built-in) | Para inspeccionar/crear archivos Excel de prueba (insumo DIAN, mapeo de columnas RI-03/DET §5) usados en pruebas de conciliación. |
| **docx** (built-in) | Para mantener actualizados los documentos DER/DET/DDT/formato de requerimientos cuando cambien reglas de negocio. |
| **pdf** / **pdf-reading** (built-in) | Para leer/generar los REQ-xxx en PDF (formato GT-TII-F-015) y para extraer/inspeccionar PDFs de facturas electrónicas durante pruebas del Email Worker. |
| **skill-creator** (built-in) | Recomendado crear 2 skills propias del proyecto (ver punto siguiente). |
| **Context7 MCP** (ya configurado) | Documentación viva de librerías del stack — úsalo en vez de confiar en memoria de entrenamiento para APIs de `bullmq`, `next-auth`, `node-imap`, etc. |

### Skills propias sugeridas (crear con `skill-creator`)
No existen todavía — proponer crearlas cuando se implemente el código
correspondiente, para que cualquier instancia de Claude Code las reutilice:

- **`ubl-invoice-parsing`**: qué tags UBL 2.1 se extraen (RI-01: NIT/Nombre
  de `cac:AccountingSupplierParty`, número en `cbc:ID`, líneas en
  `cac:InvoiceLine`, impuestos en `cac:TaxTotal`, OC en
  `cac:OrderReference`), reglas de validación de formato, y qué hacer si
  el XML no es válido (mover a `ERROR_FORMATO`).
- **`siesa-soap-adapter`**: estructura del WSDL de SIESA, mapeo de
  `Tipo_Documento: 'COM'`, `Estado: '0'`, manejo de errores del WS
  (periodo cerrado, NIT no existe) y su despliegue en la columna
  "Novedades" del dashboard.

## 7. Ver también
- `ESPECIFICACIONES.md` — especificación funcional y técnica consolidada.
- `backend/CLAUDE.md` — convenciones específicas de backend.
- `frontend/CLAUDE.md` — convenciones específicas de frontend.

## 8. Consulta de contexto con Graphify

**Graphify** (`Graphify-Labs/graphify`, paquete PyPI `graphifyy`) construye un
grafo de conocimiento del repo — código (AST vía tree-sitter), el DDL de
`mysql-init/`, y los `.md`/`.docx`/`.pdf` de `ESPECIFICACIONES.md` y el
DER/DET/DDT — y lo deja en `graphify-out/` (`graph.json`, `GRAPH_REPORT.md`,
`graph.html`).

- `graphify-out/graph.json`, `GRAPH_REPORT.md` y `graph.html` **sí se
  commitean** (mapa de contexto compartido por el equipo); solo
  `graphify-out/cost.json` está en `.gitignore`.
- Antes de leer archivo por archivo o de hacer `grep` amplio, prefiere:
  `graphify query "<pregunta>"` (subgrafo acotado), `graphify explain
  "<concepto>"` (nodo + vecinos) o `graphify path "<A>" "<B>"` (relación
  entre dos entidades). Solo cae a lectura directa o `GRAPH_REPORT.md`
  cuando estas consultas no traen suficiente contexto.
- El grafo se reconstruye solo: hay un hook de git (`post-commit`,
  `post-checkout`, instalado con `graphify hook install`) que lo actualiza
  automáticamente en cada commit/checkout — no hay que correrlo a mano
  salvo cambios grandes de esquema o documentación (`graphify extract .`)
  o extracción semántica de docs nuevos (requiere `ANTHROPIC_API_KEY` u
  otra key de LLM en el entorno, nunca en este archivo).
- Nota conocida: los nodos derivados de código SQL (ej. tabla
  `facturas_erp` de `mysql-init/01_schema.sql`) y los nodos semánticos
  derivados de docs (ej. "facturas_erp — SIESA ERP Mirror Table" de
  `ESPECIFICACIONES.md §7.4`) no siempre quedan enlazados entre sí —
  son entidades separadas en el grafo aunque describan lo mismo. Si un
  `graphify path` entre un término de esquema y uno de negocio no
  encuentra camino, no asumas que la relación no existe en el proyecto.
