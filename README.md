# BildyApp

Backend REST desarrollado con **Node.js**, **Express**, **MongoDB/Mongoose** y **Zod**.

El proyecto implementa gestión de usuarios, autenticación con **JWT + refresh tokens**, compañías, subida de logo con **Multer**, validación con **Zod**, borrado lógico, control de roles y eventos con **EventEmitter**.

---

## Tecnologías usadas

- **Node.js 22+**
- **Express 5**
- **MongoDB + Mongoose**
- **Zod**
- **JWT**
- **bcryptjs**
- **Multer**
- **Helmet**
- **express-rate-limit**
- **express-mongo-sanitize**

---

## Requisitos previos

Antes de ejecutar el proyecto se necesita tener instalado:

- **Node.js 22 o superior**
- **npm**
- **MongoDB** en local o una conexión remota

---

## Instalación

Clonar el repositorio e instalar dependencias:

```bash
git clone https://github.com/juanfelipe1104/BildyApp.git
cd BildyApp
npm install
```

---

## Variables de entorno

Crear un archivo `.env` en la raíz del proyecto a partir de `.env.example`.

```
NODE_ENV=development
PORT=3000
DB_URI=mongodb://127.0.0.1:27017
DB_NAME=bildyapp
JWT_SECRET=una_clave_de_al_menos_32_caracteres
```

### Descripcion de variables
`NODE_ENV`: entorno de ejecución (`development`, `production`, `test`)
`PORT`: puerto donde se levantará el servidor
`DB_URI`: URI de conexión a MongoDB
`DB_NAME`: nombre de la base de datos
`JWT_SECRET`: clave usada para firmar los access tokens JWT

---

## Estructura del proyecto
```
src/
├── config/
│   ├── db.js
│   └── env.js
├── controllers/
│   └── user.controller.js
├── middleware/
│   ├── auth.midddleware.js
│   ├── error-handler.js
│   ├── rate-limit.js
│   ├── role.middleware.js
│   ├── upload.js
│   └── validate.js
├── models/
│   ├── Company.js
│   ├── RefreshToken.js
│   └── User.js
├── plugins/
│   └── softDelete.plugin.js
├── routes/
│   └── user.routes.js
├── services/
│   └── notification.service.js
├── utils/
│   ├── AppError.js
│   ├── handleJWT.js
│   └── handlePassword.js
├── validators/
│   └── user.validator.js
├── app.js
└── index.js
```

---

## Características principales
- Registro y login de usuarios
- Validación de email mediante código
- Completar perfil de usuario
- Registro de compañía
- Subida de logo con Multer
- Obtener datos del usuario autenticado
- Refresh token y logout
- Cambio de contraseña
- Borrado lógico y borrado físico
- Invitación de usuarios a una compañía
- Control de roles (admin, guest)
- Eventos con EventEmitter
- Seguridad básica con:
    - helmet
    - express-rate-limit
    - express-mongo-sanitize

---

## Modelos principales

### User

Campos principales:

- email
- password
- name
- lastName
- nif
- role
- status
- verificationCode
- verificationAttempts
- company
- address

Incluye:

- virtual fullName
- plugin de soft delete

### Company

Campos principales:

- owner
- name
- cif
- address
- logo
- isFreelance

### RefreshToken

Se usa para gestionar sesiones persistentes:

- token
- usuario
- expiración
- revocación

---

## Endpoints

Base URL:

```bash
http://localhost:3000/api/user
```

---

### Registrar usuario

**POST** `/register`

Body:

```json
{
  "email": "usuario@correo.com",
  "password": "12345678"
}
```

---

### Validar email

**PUT** `/validation`

Requiere JWT.

Body:

```json
{
  "code": "123456"
}
```

---

### Login

**POST** `/login`

Body:

```json
{
  "email": "usuario@correo.com",
  "password": "12345678"
}
```

---

### Completar datos del usuario

**PUT** `/register`

Requiere JWT.

Body:

```json
{
  "name": "Juan",
  "lastName": "Rodriguez",
  "nif": "12345678A",
  "address": {
    "street": "Calle Mayor",
    "number": "12",
    "postal": "28001",
    "city": "Madrid",
    "province": "Madrid"
  }
}
```

---

### Registrar compañía

**PATCH** `/company`

Requiere JWT.

Body empresa:

```json
{
  "isFreelance": false,
  "name": "Mi Empresa SL",
  "cif": "B12345678",
  "address": {
    "street": "Gran Via",
    "number": "15",
    "postal": "28013",
    "city": "Madrid",
    "province": "Madrid"
  }
}
```

Body freelance:

```json
{
    "isFreelance": true
}
```

---

### Subir logo de la compañía

**PATCH** `/logo`

Requiere JWT y rol admin.

Tipo de body: `multipart/form-data`

Campo:

logo --> archivo de imagen (jpg, png, webp)

---

### Obtener usuario autenticado

**GET** `/`

Requiere JWT.

Devuelve el usuario con su compañía asociada.

---

### Refresh de sesión

**POST** `/refresh`

Body:

```json
{
  "refreshToken": "token_refresh"
}
```

---

### Logout

**POST** `/logout`

Requiere JWT.

Invalida las sesiones activas del usuario.

---

### Borrar usuario

**DELETE** `/`

Requiere JWT.

Query params:

- `soft=true` para borrado lógico
- `soft=false` para borrado físico

Ejemplo:

```bash
DELETE /api/user?soft=true
```

---

### Cambiar contraseña

**PUT** `/password`

Requiere JWT.

Body:

```json
{
  "currentPassword": "12345678",
  "newPassword": "87654321"
}
```

---

### Invitar usuario a una compañía

**POST** `/invite`

Requiere JWT y rol admin.

Body:

```json
{
  "email": "invitado@correo.com",
  "password": "12345678"
}
```

El usuario invitado se crea con:

- la misma company
- rol guest

---

## Autenticación

Los endpoints protegidos requieren header:

```http
Authorization: Bearer <access_token>
```

La aplicación usa:

- access token JWT
- refresh token persistido en base de datos

---

## Seguridad aplicada

El proyecto incluye:

- Helmet para cabeceras HTTP seguras
- express-mongo-sanitize para evitar inyecciones NoSQL
- express-rate-limit para limitar peticiones
- Validación de entradas con Zod
- Contraseñas hasheadas con bcryptjs

---

## Gestión de archivos

Las imágenes subidas como logo se almacenan en la carpeta:

```bash
/uploads
```

Y se sirven estáticamente desde:

```bash
/uploads/<nombre-del-archivo>
```

---

## Eventos

Se implementan eventos con `EventEmitter` para registrar acciones relevantes del ciclo de vida del usuario:

- `user:registered`
- `user:verified`
- `user:invited`
- `user:deleted`

Actualmente estos eventos se registran por consola.

---

## Validación

La validación de datos se realiza con **Zod**.

Se usan, entre otras, estas características:

- validaciones de formato
- `refine()` para reglas dependientes de varios campos
- `discriminatedUnion()` para diferenciar compañías freelance y no freelance

---

## Pruebas de endpoints

El proyecto incluye una colección de Postman en `/postman/` para probar todos los endpoints.

### Recomendación de uso en Postman

Crear variables de entorno o cargar el environment adjunto en `/postman/`:

- `baseUrl` = `http://localhost:3000/api/user`
- `accessToken`
- `refreshToken`

Y reutilizarlas en las requests.

Ejemplo de header:

```http
Authorization: Bearer {{accessToken}}
```
