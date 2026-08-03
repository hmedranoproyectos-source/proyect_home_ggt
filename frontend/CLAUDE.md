# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

# CLAUDE.md — frontend

Contexto local del frontend. Lee primero el `CLAUDE.md` de la raíz. Proyecto
ya inicializado con `npx create-next-app@latest`.

## Stack
- Next.js 16.2.10 (App Router)
- NextAuth.js — login **multiempresa** con roles y permisos
  (`usuarios` → `usuarios_roles` → `roles` → `roles_permisos` → `permisos`,
  todo filtrado por `id_cia`)
- Material UI (MUI) — componentes de UI
- axios — cliente HTTP hacia el backend Express
- socket.io-client — dashboard en tiempo real (RR-04)

## Convenciones
- Sesión NextAuth debe incluir `id_cia` (compañía activa) y el rol/permisos
  del usuario; toda llamada a la API backend debe llevar `id_cia` en el
  contexto (header o incluido en el JWT), nunca asumir una sola compañía.
- Selector de compañía visible cuando el usuario tiene acceso a más de una
  `compania` (ver tabla `usuarios_roles`, que tiene `id_cia` como parte de
  su llave).
- Componentes de datos (tablas de facturas, alertas) deben soportar
  actualización en vivo vía socket.io, no solo polling — el evento
  `new_invoice` debe reflejarse sin refresh manual.
- Paleta de alertas fija por regla de negocio (no cambiar sin actualizar
  también el backend): **rojo** = diferencia de valor > 0.01%,
  **amarillo** = diferencia solo en cantidades.

## Pantallas principales a construir (derivadas de RR-01 a RR-05)
1. **Login multiempresa** (selector de compañía + credenciales).
2. **Dashboard / Listado de facturas recibidas** — vista tipo rejilla con
   filtros dinámicos (RR-01), columna "Novedades" para errores del WS
   SIESA, actualización en línea (RR-04).
3. **Detalle de factura** — línea de tiempo: "Correo Recibido" →
   "XML Parseado" → "OC Validada" → "En Elaboración SIESA" →
   "Contabilizado" (RR-05).
4. **Vista de conciliación** — comparación factura vs Orden de Compra con
   resaltado rojo/amarillo por línea (RC-01/RC-02), botón "Validar"
   habilitado solo si no hay inconsistencias críticas (RC-03).
5. **Carga de Excel** — subida de archivo insumo DIAN con mapeo manual de
   columnas si los nombres no coinciden (RI-03, DET §5).
6. **Reportes** — facturas recibidas/registradas/con novedades/pendientes,
   exportables a Excel (RR-02).
7. **Administración** — CRUD de compañías, usuarios, roles y permisos,
   proveedores, configuración del buzón (`config_buzon_fe`).

Cuando se vaya a maquetar cualquiera de estas pantallas, usar la skill
`frontend-design` para definir dirección visual antes de escribir el
componente Next.js/MUI.

## Documentación de librerías
Antes de implementar componentes con Next.js, NextAuth.js o Material UI,
usa **Context7** (`query-docs`) para confirmar la sintaxis/API actual en
vez de asumirla por memoria — Next.js 16 y MUI cambian API entre
versiones mayores.

## Variables de entorno esperadas (`.env.local` / `.env.example`)
```
NEXT_PUBLIC_API_URL=
NEXTAUTH_URL=
NEXTAUTH_SECRET=
NEXT_PUBLIC_SOCKET_URL=
```
