# CLAUDE.md — backend

Contexto local del backend. Lee primero el `CLAUDE.md` de la raíz.

## Stack
- Node.js + Express.js (API REST)
- MySQL 8.0+ (mysql2, usar prepared statements / query params — nunca
  interpolar strings en SQL, hay datos de proveedores/NIT externos)
- BullMQ + Redis como broker de colas (procesamiento asíncrono de
  conciliación, ver `ESPECIFICACIONES.md` §Cola de conciliación)
- `node-imap` + `mailparser` — Email Worker
- `xml2js` — parseo de XML SOAP (SIESA) y UBL 2.1 (DIAN)
- `xlsx` (SheetJS) — carga de Excel insumo DIAN (RI-03/04)
- `axios` — llamadas HTTP/SOAP salientes
- `socket.io` — eventos en tiempo real hacia el dashboard (RR-04)
- `adm-zip` o similar — extracción de adjuntos .zip con PDF+XML

## Estructura sugerida

```
backend/
├── src/
│   ├── api/                 # rutas Express (controllers, routers)
│   │   ├── auth/             # login multiempresa, roles/permisos
│   │   ├── facturas/
│   │   ├── proveedores/
│   │   ├── ordenes-compra/
│   │   └── reportes/
│   ├── workers/
│   │   ├── emailWorker.js    # cron/scheduler node-imap, cada 10 min 07-19h
│   │   └── conciliacionWorker.js  # consumidor BullMQ
│   ├── queues/
│   │   └── conciliacionQueue.js   # definición de la cola BullMQ
│   ├── adapters/
│   │   ├── siesa/            # adaptador SOAP SIESA (WSDL, xml2js)
│   │   └── dian/             # adaptador documentos electrónicos DIAN
│   ├── services/
│   │   ├── ublParser.js      # extracción tags UBL 2.1
│   │   ├── conciliacion.js   # validateInvoice(invoiceId) — ver DET §2
│   │   └── excelMapper.js    # carga/mapeo columnas Excel (DET §5)
│   ├── models/                # capa de acceso a datos MySQL
│   ├── sockets/               # emisión eventos socket.io
│   ├── middleware/            # auth, multiempresa (id_cia), auditoría
│   └── config/                 # env, conexión DB, conexión redis
├── .env.example
└── package.json
```

## Reglas de negocio clave que el código debe respetar

Extraídas del DER/DET (ver `ESPECIFICACIONES.md` para el detalle completo
con sus IDs RP/RI/RC/RA/RR):

- **RP-06 / RP-07**: escaneo de buzón cada 10 min entre 07:00–19:00; una
  factura detectada debe estar visible en el aplicativo en ≤2 minutos.
- **RP-08**: una vez validada en el aplicativo, el envío a SIESA es
  **síncrono**, no encolado.
- **RC-02 (alertas)**: rojo si diferencia de valor total > 0.01%;
  amarillo si difieren cantidades pero el valor total coincide.
- **RC-04 (duplicidad)**: el esquema oficial implementa esto como
  `UNIQUE(id_cia, id_proveedor, prefijo_fe, consecutivo_fe)` en la tabla
  `facturas` (más estricto que "NIT + Prefijo + Número": usa
  `id_proveedor` en vez de NIT crudo). Si el insert choca contra ese
  unique, mover el correo a carpeta "Duplicados" + generar alerta, no
  reprocesar.
- **RC-06 (auditoría)**: cada acción (creación, modificación, validación,
  contabilización) registra usuario, fecha/hora, tipo de operación,
  IP y `data_before`/`data_after` (JSON). ⚠️ **La tabla de auditoría no
  existe en `Recibo_FE_Create.sql`** — hay que diseñarla y agregarla a
  `mysql-init/` antes de implementar el middleware (ver propuesta en
  `ESPECIFICACIONES.md` §7.6).
- **RA-04 (causación)**: solo se dispara tras "Entrada de Almacén" exitosa
  en SIESA — no antes.
- **Estado `Estado: '0'` en SIESA** = "En Elaboración", obligatorio para
  que contabilidad revise antes de cierre definitivo (regla de negocio,
  no opcional). En el esquema oficial, `facturas.id_estado` y
  `entradas_almacen.id_estado` son FK a `estados_documentos` (catálogo
  encadenado vía `id_estado_siguiente`, no un ENUM) — el estado "En
  Elaboración" debe existir como fila de ese catálogo, no como string
  hardcodeado en el código.
- **Factura sin Orden de Compra**: se permite el registro pero se marca
  "Sin Validación de Compra" y requiere aprobación manual de un
  supervisor — no debe autocompletarse como validada.
- **Reintentos BullMQ**: backoff exponencial (ej. 30s, 1m, 2m...), límite
  máximo de reintentos configurable por variable de entorno, no hardcoded.

## Email Worker — algoritmo (DET §1)
1. Conectar a `contabilidad@gigante.com` (config vía `config_buzon_fe` /
   env, nunca hardcodeado).
2. Buscar correos `UNSEEN`.
3. Por cada correo, localizar adjuntos `.zip`/`.xml`; si es `.zip`
   extraer PDF + XML.
4. Si el XML no es UBL 2.1 válido → mover correo a `ERROR_FORMATO`.
5. Si es válido → extraer datos (ver tags RI-01), guardar en DB, encolar
   job de conciliación, mover correo a `PROCESADOS`.

## Conector SIESA (DET §3)
- SOAP (WSDL), usar `xml2js` para parsear a objeto de dominio limpio
  (mismo shape de salida que el adaptador DIAN, para que el servicio de
  conciliación no le importe el origen).
- Envío: `Tipo_Documento: 'COM'`, `Estado: '0'`.
- `Notas`: `"Generado automáticamente por Aplicativo Conciliación - Ref: [Email_ID]"`.
- Si el WS retorna error (periodo cerrado, NIT no existe, etc.), capturar
  el string de error y exponerlo en la columna "Novedades" del dashboard
  — nunca tragarse el error silenciosamente.

## Manejo de errores (según DER/backend context ya en memoria)
- Fallas de vectorización/no-críticas → no bloqueantes, log + continuar.
- Fallas críticas (conexión SIESA/MySQL) → bloqueantes + alerta por email
  (placeholder SMTP pendiente de configurar).

## Variables de entorno esperadas (`.env.example` a crear)
```
DB_HOST=
DB_PORT=3306
DB_USER=
DB_PASSWORD=
DB_NAME=
REDIS_HOST=
REDIS_PORT=6379
IMAP_HOST=
IMAP_PORT=
IMAP_USER=
IMAP_PASSWORD=
SIESA_WSDL_URL=
SIESA_USER=
SIESA_PASSWORD=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
BULLMQ_MAX_RETRIES=5
JWT_SECRET=
```

## Antes de tocar el esquema de BD
El esquema oficial es `Recibo_FE_Create.sql` (debe copiarse a
`mysql-init/`). Revisar `ESPECIFICACIONES.md` §7 para el detalle tabla por
tabla y 3 puntos pendientes de confirmar con el equipo de BD: la FK
`ordenes_compras.id_proveedor → facturas_erp` (parece error, debería ser
`proveedores`), el tipo `int(10)` de `facturas.notas_fe`, y la tabla de
auditoría (RC-06) que no existe y hay que diseñar. No usar como
referencia las tablas `proc_*`/`sys_*` de versiones anteriores de este
documento — quedaron descartadas.

## Documentación de librerías
Antes de implementar cualquier módulo con una librería externa (Express,
mysql2, BullMQ, node-imap, mailparser, xml2js, xlsx, socket.io), usa
**Context7** (`query-docs`) para confirmar la sintaxis actual en vez de
asumirla por memoria.

## Autenticación multiempresa (login + roles/permisos)

Implementado en `src/api/auth/`, `src/services/authService.js` y
`src/middleware/auth.js`. Flujo de 2 pasos porque un usuario puede tener
acceso a varias `companias` vía `usuarios_roles`:

1. `POST /api/auth/login { usuario, clave }` — si el usuario tiene 1 sola
   compañía, responde con el token final directo; si tiene varias,
   responde `{ requiereSeleccionCompania: true, token, companias }` con un
   token de pre-sesión (5 min, solo `{ id_usuario }`).
2. `POST /api/auth/select-company { id_cia }` con
   `Authorization: Bearer <token de pre-sesión>` — arma el token final
   `{ id_usuario, id_cia, roles, permisos, exp }`.
3. `GET /api/auth/me` (protegido con `requireAuth`) — devuelve `req.user`
   decodificado, útil para probar el middleware.

Middleware disponible: `requireAuth`, `requirePreSession`,
`requirePermission(nombrePermiso)`. Todo endpoint de negocio nuevo debe
usar `requireAuth` como mínimo y filtrar sus queries por
`req.user.id_cia`.

`/api/auth/login` tiene rate limiting (5 intentos/minuto por IP vía
`express-rate-limit`) para mitigar fuerza bruta.

### Variables de entorno adicionales
Agregar a `.env` (no están en el `.env.example` original, se documentan
aquí porque el archivo `.env`/`.env.example` no es editable desde esta
sesión):
```
JWT_EXPIRES_IN=8h          # opcional, default 8h si no se define
SEED_ADMIN_PASSWORD=       # obligatoria solo para correr el seed de auth
```

### Seed de datos de prueba
`src/seeds/seedAuth.js` crea (de forma idempotente — se puede correr más
de una vez sin duplicar) una compañía, el usuario `admin` (clave hasheada
con bcrypt desde `SEED_ADMIN_PASSWORD`), el rol `Administrador`, el
permiso `ver_facturas` y las relaciones `roles_permisos` /
`usuarios_roles` que los conectan.

```bash
# define SEED_ADMIN_PASSWORD en backend/.env antes de correrlo
docker compose exec backend npm run seed:auth
```