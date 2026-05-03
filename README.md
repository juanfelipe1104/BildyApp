# BildyApp API

API REST para la gestión de usuarios, compañías, clientes, proyectos y albaranes.

La aplicación incluye autenticación JWT, validación con Zod, documentación Swagger, generación y firma de PDFs, subida de archivos a Cloudinary, WebSockets con Socket.IO, tests automatizados con Jest/Supertest, Docker y GitHub Actions.

---

## Tabla de contenidos

- [BildyApp API](#bildyapp-api)
  - [Tabla de contenidos](#tabla-de-contenidos)
  - [Tecnologías principales](#tecnologías-principales)
  - [Funcionalidades](#funcionalidades)
    - [User / Auth](#user--auth)
    - [Company](#company)
    - [Client](#client)
    - [Project](#project)
    - [DeliveryNote](#deliverynote)
    - [Dashboard](#dashboard)
    - [PostgreSQL + Prisma](#postgresql--prisma)
    - [WebSockets](#websockets)
    - [Infraestructura](#infraestructura)
  - [Estructura del proyecto](#estructura-del-proyecto)
  - [Variables de entorno](#variables-de-entorno)
    - [Descripción de variables](#descripción-de-variables)
  - [Instalación local](#instalación-local)
  - [Ejecución con Docker](#ejecución-con-docker)
    - [Migraciones de Prisma en Docker](#migraciones-de-prisma-en-docker)
  - [Documentación Swagger](#documentación-swagger)
  - [Tests y cobertura](#tests-y-cobertura)
  - [WebSockets](#websockets-1)
    - [Namespace](#namespace)
    - [Autenticación](#autenticación)
    - [Rooms](#rooms)
    - [Eventos emitidos](#eventos-emitidos)
    - [Ejemplo de cliente](#ejemplo-de-cliente)
  - [Health check](#health-check)
  - [GitHub Actions](#github-actions)
  - [Endpoints principales](#endpoints-principales)
    - [User/Auth](#userauth)
    - [Company](#company-1)
    - [Client](#client-1)
    - [Project](#project-1)
    - [DeliveryNote](#deliverynote-1)
    - [Dashboard](#dashboard-1)
    - [Audit](#audit)
    - [Health](#health)
  - [Query params comunes](#query-params-comunes)
    - [Paginación](#paginación)
    - [Ordenación](#ordenación)
    - [Soft delete / hard delete](#soft-delete--hard-delete)
    - [Filtros de albaranes](#filtros-de-albaranes)
  - [Notas de implementación](#notas-de-implementación)
    - [Invitación de usuarios](#invitación-de-usuarios)
    - [Seguridad por compañía](#seguridad-por-compañía)
    - [Albaranes firmados](#albaranes-firmados)
    - [WebSockets y rooms](#websockets-y-rooms)
    - [Logging con Slack](#logging-con-slack)
    - [Dashboard con aggregation pipeline](#dashboard-con-aggregation-pipeline)
    - [PostgreSQL + Prisma](#postgresql--prisma-1)
  - [Scripts disponibles](#scripts-disponibles)

---

## Tecnologías principales

- Node.js
- Express
- TypeScript
- MongoDB
- Mongoose
- Zod
- JWT
- Bcrypt
- Nodemailer
- Cloudinary
- PDFKit
- Socket.IO
- Swagger / OpenAPI
- Jest
- Supertest
- mongodb-memory-server
- Docker
- GitHub Actions

---

## Funcionalidades

### User / Auth

- Registro de usuario.
- Validación mediante código.
- Login con JWT.
- Refresh token.
- Logout.
- Cambio de contraseña.
- Soft delete y hard delete de usuario.
- Invitación de usuarios a una compañía.
- Roles `admin` y `guest`.
- Estados `pending` y `verified`.

### Company

- Creación/asociación de compañía.
- Soporte para usuario freelance.
- Subida de logo a Cloudinary.
- Asociación de usuarios invitados a la compañía del administrador.

### Client

- Crear, listar, obtener, actualizar y eliminar clientes.
- Soft delete y hard delete.
- Restauración de clientes archivados.
- Filtros, paginación y ordenación.
- Protección por compañía.

### Project

- Crear, listar, obtener, actualizar y eliminar proyectos.
- Asociación obligatoria con cliente.
- Validación de que el cliente pertenece a la compañía.
- Soft delete y hard delete.
- Restauración de proyectos archivados.
- Bloqueo de borrado si el proyecto está activo.
- Filtros, paginación y ordenación.

### DeliveryNote

- Crear albaranes de material.
- Crear albaranes de horas.
- Soporte para horas totales o array de trabajadores.
- Listado con filtros, paginación y ordenación.
- Filtros por rango de fechas.
- Generación de PDF.
- Firma de albarán con imagen.
- Subida de firma y PDF firmado a Cloudinary.
- Bloqueo de borrado de albaranes firmados.
- Protección por compañía.

### Dashboard

- Endpoint de estadísticas globales de la compañía.
- Uso de aggregation pipeline de MongoDB mediante Mongoose.
- Métricas incluidas:
  - Total de clientes.
  - Total de proyectos.
  - Total de albaranes.
  - Albaranes firmados y pendientes.
  - Albaranes por mes.
  - Horas totales por proyecto.
  - Materiales por cliente.
  - Proyectos activos e inactivos.

### PostgreSQL + Prisma

- Integración complementaria con PostgreSQL usando Prisma ORM.
- Persistencia principal mantenida en MongoDB/Mongoose.
- Registro de eventos de auditoría en PostgreSQL.
- Gestión del esquema mediante `prisma/schema.prisma`.
- Migraciones con Prisma Migrate.

### WebSockets

- Namespace `/notifications`.
- Rooms por compañía.
- Eventos en tiempo real:
  - `client:new`
  - `project:new`
  - `deliverynote:new`
  - `deliverynote:signed`

### Infraestructura

- Endpoint `/health`.
- Graceful shutdown.
- Dockerfile multi-stage.
- Docker Compose con API y MongoDB.
- Workflow de GitHub Actions para build, tests, coverage y docker build.

---

## Estructura del proyecto

```txt
src/
├── app.ts
├── index.ts
├── config/
│   ├── db.ts
│   ├── env.ts
│   ├── mail.ts
│   └── swagger.ts
├── controllers/
│   ├── client.controller.ts
│   ├── deliveryNote.controller.ts
│   ├── health.controller.ts
│   ├── project.controller.ts
│   └── user.controller.ts
├── middlewares/
├── models/
├── routes/
├── services/
├── sockets/
│   └── socket.ts
├── types/
├── utils/
└── validators/

tests/
├── setup/
│   ├── helpers.ts
│   ├── mocks.ts
│   └── setup.ts
├── user.test.ts
├── client.test.ts
├── project.test.ts
└── deliveryNote.test.ts
```

---

## Variables de entorno

El proyecto utiliza variables de entorno.

Crea un archivo `.env` en la raíz a partir de `.env.example`.

```bash
cp .env.example .env
```

Ejemplo:

```env
NODE_ENV=development
PORT=3000

DB_URI=mongodb://127.0.0.1:27017
DB_NAME=bildyapp

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bildyapp_audit
DIRECT_URL=your_direct_url_supabase

JWT_SECRET=minimum_32_characters

SLACK_WEBHOOK=your_slack_webhook

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
```

### Descripción de variables

| Variable | Descripción |
|---|---|
| `NODE_ENV` | Entorno de ejecución: `development`, `test` o `production`. |
| `PORT` | Puerto donde se levanta la API. |
| `DB_URI` | URI de conexión a MongoDB. |
| `DB_NAME` | Nombre de la base de datos. |
| `DATABASE_URL` | URL de conexión a PostgreSQL usada por Prisma. |
| `DIRECT_URL` | URL de conexión a Supabase PostgreSQL usada por Prisma. Si no se tiene Supabase, poner la misma URL que en DATABASE_URL |
| `JWT_SECRET` | Clave secreta para firmar tokens JWT. |
| `SLACK_WEBHOOK` | Webhook de Slack para logging de errores 5XX. |
| `CLOUDINARY_CLOUD_NAME` | Nombre de Cloudinary. |
| `CLOUDINARY_API_KEY` | API key de Cloudinary. |
| `CLOUDINARY_API_SECRET` | API secret de Cloudinary. |
| `EMAIL_USER` | Cuenta de email usada por Nodemailer. |
| `EMAIL_PASSWORD` | Contraseña o app password del email. |

---

## Instalación local

Instalar dependencias:

```bash
npm install
```

Generar el cliente de prisma:

```bash
npm run prisma:generate
```

Ejecutar en modo desarrollo:

```bash
npm run dev
```

Compilar TypeScript:

```bash
npm run build
```

Ejecutar la versión compilada en local:

```bash
npm start
```

La API quedará disponible en:

```txt
http://localhost:3000
```

---

## Ejecución con Docker

El proyecto incluye `Dockerfile` multi-stage y `docker-compose.yml`.

Construir y levantar contenedores:

```bash
docker-compose up --build
```

Levantar en segundo plano:

```bash
docker-compose up -d --build
```

Detener contenedores:

```bash
docker-compose down
```

La API queda disponible en:

```txt
http://localhost:3000
```

MongoDB se ejecuta dentro de Docker Compose y no se expone al host local.

La API se conecta internamente mediante:

```txt
mongodb://mongodb:27017
```

### Migraciones de Prisma en Docker

El proyecto usa PostgreSQL + Prisma como módulo complementario para los logs de auditoría.

Si se levanta PostgreSQL mediante Docker Compose, hay que aplicar las migraciones de Prisma:

```bash
docker-compose up -d --build
docker-compose exec api npx prisma migrate deploy
docker-compose restart api
```

---

## Documentación Swagger

La documentación Swagger está disponible en:

```txt
http://localhost:3000/api-docs
```

Para probar endpoints protegidos:

1. Registra o inicia sesión con un usuario.
2. Copia el `access_token`.
3. Pulsa el botón **Authorize** en Swagger.
4. Introduce:

```txt
Bearer <access_token>
```

Swagger documenta endpoints de:

- User/Auth
- Company
- Client
- Project
- DeliveryNote
- Health
- Uploads multipart
- Query params
- Schemas globales

---

## Tests y cobertura

El proyecto usa:

- Jest
- Supertest
- mongodb-memory-server
- Mocks para servicios externos:
  - Nodemailer
  - Cloudinary
  - Slack/logger

Ejecutar tests:

```bash
npm test
```

Ejecutar tests en modo watch:

```bash
npm run test:watch
```

Ejecutar cobertura:

```bash
npm run test:coverage
```

Los tests cubren:

- User/Auth
- Company
- Client
- Project
- DeliveryNote
- Permisos por compañía
- Soft delete / hard delete
- Restore
- PDF
- Firma
- Validaciones de Zod
- Casos positivos y negativos principales

El proyecto supera el 70 % de cobertura requerido.

---

## WebSockets

La API usa Socket.IO para notificaciones en tiempo real.

### Namespace

```txt
/notifications
```

### Autenticación

El cliente debe conectarse enviando el JWT:

```js
const socket = io("http://localhost:3000/notifications", {
    auth: {
        token: accessToken
    }
});
```

El servidor valida:

- Token JWT válido.
- Usuario existente.
- Usuario verificado.
- Usuario asociado a una compañía.

### Rooms

Cada usuario entra automáticamente en una room asociada a su compañía:

```txt
company:<companyId>
```

El cliente no elige la room. El servidor la determina a partir del usuario autenticado.

### Eventos emitidos

| Evento | Cuándo se emite |
|---|---|
| `client:new` | Cuando se crea un cliente. |
| `project:new` | Cuando se crea un proyecto. |
| `deliverynote:new` | Cuando se crea un albarán. |
| `deliverynote:signed` | Cuando se firma un albarán. |

### Ejemplo de cliente

El repositorio incluye un HTML de prueba para conectarse a WebSockets y visualizar eventos recibidos.

Flujo recomendado:

1. Obtener un `access_token`.
2. Pegar el token en el HTML de prueba.
3. Abrir el HTML en navegador.
4. Crear clientes/proyectos/albaranes desde Swagger.
5. Ver los eventos aparecer en pantalla.

---

## Health check

La API incluye un endpoint de salud:

```http
GET /health
```

Respuesta esperada:

```json
{
  "status": "ok",
  "db": "connected",
  "uptime": 123.45,
  "timestamp": "2026-05-02T10:00:00.000Z"
}
```

Si MongoDB no está conectado, devuelve estado `503`.

---

## GitHub Actions

El repositorio incluye un workflow de CI en:

```txt
.github/workflows/ci.yml
```

El workflow ejecuta:

```txt
npm ci
npm run build
npm test
npm run test:coverage
docker build
```

Se dispara en:

- `push` a `main`
- `pull_request` hacia `main`

Esto permite comprobar automáticamente que el proyecto instala, compila, pasa los tests y construye la imagen Docker.

---

## Endpoints principales

### User/Auth

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/api/user/register` | Registrar usuario. |
| `PUT` | `/api/user/validation` | Validar usuario con código. |
| `POST` | `/api/user/login` | Iniciar sesión. |
| `POST` | `/api/user/refresh` | Refrescar sesión. |
| `POST` | `/api/user/logout` | Cerrar sesión. |
| `GET` | `/api/user` | Obtener usuario autenticado. |
| `PUT` | `/api/user/register` | Completar datos personales. |
| `PUT` | `/api/user/password` | Cambiar contraseña. |
| `POST` | `/api/user/invite` | Invitar usuario a la compañía. |
| `DELETE` | `/api/user` | Eliminar usuario. |

### Company

| Método | Endpoint | Descripción |
|---|---|---|
| `PATCH` | `/api/user/company` | Crear/asociar compañía. |
| `PATCH` | `/api/user/logo` | Subir logo de compañía. |

### Client

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/api/client` | Crear cliente. |
| `GET` | `/api/client` | Listar clientes. |
| `GET` | `/api/client/archived` | Listar clientes archivados. |
| `GET` | `/api/client/:id` | Obtener cliente. |
| `PUT` | `/api/client/:id` | Actualizar cliente. |
| `DELETE` | `/api/client/:id` | Eliminar cliente. |
| `PATCH` | `/api/client/:id/restore` | Restaurar cliente. |

### Project

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/api/project` | Crear proyecto. |
| `GET` | `/api/project` | Listar proyectos. |
| `GET` | `/api/project/archived` | Listar proyectos archivados. |
| `GET` | `/api/project/:id` | Obtener proyecto. |
| `PUT` | `/api/project/:id` | Actualizar proyecto. |
| `DELETE` | `/api/project/:id` | Eliminar proyecto. |
| `PATCH` | `/api/project/:id/restore` | Restaurar proyecto. |

### DeliveryNote

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/api/deliverynote` | Crear albarán. |
| `GET` | `/api/deliverynote` | Listar albaranes. |
| `GET` | `/api/deliverynote/:id` | Obtener albarán. |
| `GET` | `/api/deliverynote/pdf/:id` | Generar/descargar PDF. |
| `PATCH` | `/api/deliverynote/:id/sign` | Firmar albarán. |
| `DELETE` | `/api/deliverynote/:id` | Eliminar albarán. |

### Dashboard

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/dashboard` | Obtener estadísticas agregadas de la compañía. |

### Audit

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/audit` | Obtener los últimos logs de auditoría de la compañía. |

### Health

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/health` | Estado de la API y MongoDB. |

---

## Query params comunes

### Paginación

```txt
?page=1&limit=10
```

### Ordenación

Ascendente:

```txt
?sort=createdAt
```

Descendente:

```txt
?sort=-createdAt
```

Ejemplos:

```txt
/api/client?sort=-createdAt
/api/project?sort=-name
/api/deliverynote?sort=-workDate
```

### Soft delete / hard delete

```txt
?soft=true
?soft=false
```

Por defecto, si no se indica, se aplica borrado lógico.

### Filtros de albaranes

```txt
/api/deliverynote?format=material
/api/deliverynote?signed=true
/api/deliverynote?signed=false
/api/deliverynote?from=2026-04-01&to=2026-04-30
```

---

## Notas de implementación

### Invitación de usuarios

El endpoint de invitación recibe solo el email del invitado.

El servidor genera:

- contraseña temporal
- código de verificación

Y envía un email con instrucciones:

```txt
Has sido invitado a la compañía X por Y.
Esta es tu contraseña temporal.
Este es tu código de verificación.
Verifica tu usuario y cambia tu contraseña.
```

En entornos distintos de producción, la respuesta incluye también `verificationCode` y `temporaryPassword` para facilitar pruebas automatizadas.

En producción, esos valores no se devuelven en la respuesta.

---

### Seguridad por compañía

Los recursos principales están aislados por compañía:

```txt
Client
Project
DeliveryNote
```

Un usuario solo puede acceder a recursos de su propia compañía.

---

### Albaranes firmados

Un albarán firmado:

- queda marcado como `signed = true`
- guarda `signatureUrl`
- guarda `pdfUrl`
- no puede borrarse

---

### WebSockets y rooms

Los eventos en tiempo real se emiten solo a la room correspondiente a la compañía del usuario:

```txt
company:<companyId>
```

Esto evita enviar eventos a usuarios de otras compañías.

---

### Logging con Slack

Los errores 5XX pueden enviarse a Slack mediante webhook.

Los errores 4XX no se envían a Slack porque corresponden a errores de cliente esperados.

---

### Dashboard con aggregation pipeline

El endpoint `GET /api/dashboard` usa aggregation pipelines de MongoDB mediante Mongoose.

Se utilizan etapas como:

```txt
$match
$group
$project
$lookup
$unwind
$sort
$addFields
```

Esto permite calcular estadísticas directamente en MongoDB sin traer todos los documentos a memoria de Node.js.

Las métricas se calculan siempre filtrando por la compañía del usuario autenticado.

---

### PostgreSQL + Prisma

Además de MongoDB/Mongoose, el proyecto incluye una integración complementaria con PostgreSQL usando Prisma ORM.

La persistencia principal de la aplicación continúa en MongoDB. PostgreSQL se usa como módulo adicional para almacenar eventos de auditoría en la tabla `audit_logs`.

Eventos registrados:

- Invitación de usuarios.
- Creación de clientes.
- Creación de proyectos.
- Creación de albaranes.
- Firma de albaranes.

El schema se define en:

```txt
prisma/schema.prisma
```

Las migraciones se gestionan con Prisma Migrate:

```bash
npm run prisma:migrate
```

Para regenerar Prisma Client:

```bash
npm run prisma:generate
```

Para aplicar migraciones existentes, por ejemplo en Docker o producción:

```bash
npx prisma migrate deploy
```

El endpoint relacionado es:

```http
GET /api/audit
```

Este endpoint devuelve los últimos logs de auditoría asociados a la compañía del usuario autenticado.

---

## Scripts disponibles

```json
{
  "dev": "tsx watch --env-file=.env src/index.ts",
  "build": "tsc",
  "start": "node --env-file=.env dist/index.js",
  "test": "node --env-file=tests/.env.test --experimental-vm-modules node_modules/jest/bin/jest.js --runInBand",
  "test:watch": "node --env-file=tests/.env.test --experimental-vm-modules node_modules/jest/bin/jest.js --watch --runInBand",
  "test:coverage": "node --env-file=tests/.env.test --experimental-vm-modules node_modules/jest/bin/jest.js --coverage --runInBand"
}
```

---