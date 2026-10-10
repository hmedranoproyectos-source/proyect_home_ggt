# WEB SERVICE UNOEE — Importación de datos

> Conversión a Markdown del PDF `Web service unoee - importar datos.pdf`
> (carpeta `DATA PROYECTO GIGANTE`). Las credenciales del ejemplo original
> de Clientes POS fueron reemplazadas por placeholders.
> Los esquemas `Conexion.xsd` e `Importar.xsd` son adjuntos incrustados en el
> PDF y no están transcritos aquí.

## Objetivo general

Proveer un medio por el cual se puedan consultar e importar datos al sistema
UNOEE. A continuación se describe, para cada caso, lo necesario para su consumo.

## WEB SERVICE PARA IMPORTACION DE DATOS

### Objetivo

Brindar una forma de importar información basada en los formatos de
importación definidos en el sistema.

### Prerrequisitos

- La aplicación `Impodatos.exe` debe estar en el servidor donde se va a
  instalar el web service.
- Debe estar creada al menos una conexión a la base de datos.

### Páginas expuestas

Se exponen 2 páginas web: una para crear la conexión a la base de datos con
toda la información necesaria y otra para probar el método `ImportarXML`.

| Página | Uso | Ejemplo |
|---|---|---|
| `WFConexion.aspx` | Crear conexión | `http://localhost/WSUNOEE/WFConexion.aspx` |
| `WFPruebaImportar.aspx` | Probar la importación | `http://localhost/WSUNOEE/WFPruebaImportar.aspx` |

Donde:
- `localhost` = nombre del servidor si es remoto; si es local, `localhost`.
- `WSUNOEE` = nombre del web site creado en la instalación.
- El último segmento es el nombre de la página.

### Métodos expuestos aplicables para importación

#### 1. `CrearConexionXML`

Crea la configuración de la conexión a la base de datos por programación (no
por la interfaz). Recibe como parámetro un XML que debe cumplir el esquema
`Conexion.xsd`; todos los campos son obligatorios.

| Campo | Descripción |
|---|---|
| `NombreConexion` | Nombre que identifica la conexión; se envía en el método que ejecuta la consulta |
| `TipoBD` | `SQL` para SQL Server, `ORA` para Oracle |
| `NombreBD` | Nombre de la base de datos (aplica para SQL Server) |
| `NombreServidorBD` | Nombre del servidor de BD (SQL Server) o nombre del servicio (Oracle) |
| `UsuarioBD` | Usuario de conexión a la base de datos |
| `ClaveBD` | Clave del usuario de la conexión |
| `NumConexionImpo` | Número de conexión configurada en el editor de conexiones para realizar importaciones |

Ejemplo SQL Server:

```xml
<?xml version="1.0"?>
<Conexion>
  <NombreConexion>CONEXION1</NombreConexion>
  <TipoBD>SQL</TipoBD>
  <NombreBD>UNOEE</NombreBD>
  <NombreServidorBD>NEO</NombreServidorBD>
  <UsuarioBD>sa</UsuarioBD>
  <ClaveBD>password</ClaveBD>
  <NumConexionImpo>1</NumConexionImpo>
</Conexion>
```

Ejemplo Oracle:

```xml
<?xml version="1.0"?>
<Conexion>
  <NombreConexion>CONEXION2</NombreConexion>
  <TipoBD>ORA</TipoBD>
  <NombreBD> </NombreBD>
  <NombreServidorBD>TRINITY</NombreServidorBD>
  <UsuarioBD>unoee</UsuarioBD>
  <ClaveBD>password</ClaveBD>
  <NumConexionImpo>1</NumConexionImpo>
</Conexion>
```

#### 2. `ImportarXML`

Ejecuta la importación de datos. Recibe 2 parámetros:

- **Entrada** `pvstrDatos`: XML con la información necesaria para la
  importación (esquema `Importar.xsd`).
- **Salida** `printTipoError`: tipo de error generado.

Devuelve un XML con el log generado por la importación. En el encabezado del
esquema, el atributo `targetNamespace` debe ser `urn:NM-WSUNOEE`.

Campos del primer parámetro:

| Campo | Descripción |
|---|---|
| `NombreConexion` | Conexión de BD a usar, configurada con `CrearConexionXML` o por la interfaz (`WFConexion.aspx`) |
| `IdCia` | Compañía en la cual se realiza la importación |
| `Usuario` | Usuario interno que realiza la importación |
| `Clave` | Clave del usuario interno |
| `Datos` | Elemento que reúne las líneas de la importación |
| `Linea` | Información de cada línea según los formatos de importación conocidos |

Ejemplo (formato de importación de terceros):

```xml
<?xml version='1.0' encoding='utf-8'?>
<Importar>
  <NombreConexion>Conexion1</NombreConexion>
  <IdCia>1</IdCia>
  <Usuario>jairc</Usuario>
  <Clave>jairc</Clave>
  <Datos>
    <Linea>000000100000001001</Linea>
    <Linea>000000200460001001116786088 00100101 </Linea>
    <Linea>000000300460001001180431764 01200101 </Linea>
    <Linea>000000400460001001100000    00100201 </Linea>
    <Linea>000000500460001001180431764 00100101 </Linea>
    <Linea>000000600460001001180431764 00500201 </Linea>
    <Linea>000000700460001001120040129 00100101 </Linea>
    <Linea>000000800460001001180431764 01100201 </Linea>
    <Linea>000000900460001001114890621 00100101 </Linea>
    <Linea>000001000460001001114890621 00200101 </Linea>
    <Linea>000001199990001001</Linea>
  </Datos>
</Importar>
```

> Estructura de líneas: la primera es el registro inicial (`...0000001001`) y
> la última el registro final (`...99990001001`); entre ellas van los
> registros de detalle del formato.

#### Parámetro de salida `printTipoError`

| Valor | Significado |
|---|---|
| `0` | Sin errores |
| `1` | Con errores o warnings |

El método retorna un DataSet en forma de XML con el resultado. Si
`printTipoError` es `0`, el XML no tiene datos; si es `1`, retorna los errores
o warnings respectivos.

Columnas de la tabla de resultado:

| Columna | Tipo |
|---|---|
| `f_nro_linea` | int |
| `f_tipo_reg` | string |
| `f_subtipo_reg` | string |
| `f_version` | string |
| `f_nivel` | string |
| `f_valor` | string |
| `f_detalle` | string |

Ejemplo de retorno con errores (datos; se omite el bloque `xs:schema`):

```xml
<?xml version="1.0" encoding="utf-8" ?>
<DataSet xmlns="http://tempuri.org/">
  <!-- xs:schema con los elementos de la tabla anterior -->
  <diffgr:diffgram xmlns:msdata="urn:schemas-microsoft-com:xml-msdata"
                   xmlns:diffgr="urn:schemas-microsoft-com:xml-diffgram-v1">
    <NewDataSet xmlns="">
      <Table diffgr:id="Table1" msdata:rowOrder="0">
        <f_nro_linea>3</f_nro_linea>
        <f_tipo_reg>0046</f_tipo_reg>
        <f_subtipo_reg>00</f_subtipo_reg>
        <f_version>01</f_version>
        <f_nivel>00</f_nivel>
        <f_valor>099</f_valor>
        <f_detalle>Impuestos cliente: La sucursal del cliente no existe.</f_detalle>
      </Table>
    </NewDataSet>
  </diffgr:diffgram>
</DataSet>
```

#### Ejemplo: importación de clientes POS

```xml
<?xml version='1.0' encoding='utf-8'?>
<Importar>
  <NombreConexion>unoee_invercomer</NombreConexion>
  <IdCia>1</IdCia>
  <Usuario>USUARIO_WS</Usuario>
  <Clave>CLAVE_WS</Clave>
  <Datos>
    <Linea>000000100000001001</Linea>
    <Linea>000000297400002001110101         10101 0C0PRUEBA
PRUEBA PRUEBA PRUEBA                            20201008202010080
ESPAÑA                                                             16913001ESPAÑA
300000                    no@no.com                                30000
CARGADA_VIA_PLANO
21 1</Linea>
    <Linea>000000399990001001</Linea>
  </Datos>
</Importar>
```

> Nota: en el PDF original los saltos de línea dentro de `<Linea>` son
> producto del ajuste de página; la posición exacta de los campos la define el
> formato de importación (ver `Imp-UnoEE-Clientes POS.pdf`).

### Cómo probarlo

No se pueden probar los métodos expuestos desde la página de pruebas estándar
de IIS porque `ImportarXML` recibe un parámetro por referencia. La prueba se
hace mediante la página `WFPruebaImportar.aspx`.

### Notas

- Si el cliente quiere un campo que no exista en la consulta, debe reportarse
  como un requerimiento.
- El cliente debe tener un servidor web que no sea Apache u otros: solo
  funciona con programas web de Windows (IIS).
- El web service no funciona con usuarios de dominio; solo con usuarios
  internos.
