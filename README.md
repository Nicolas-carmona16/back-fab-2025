## CourierSync – Feature 3 Backend (GraphQL)

Backend GraphQL escrito en Node.js/TypeScript que expone todos los contratos necesarios para el frontend `courier-sync-feature3-frontend`.

### Tecnologías
- Node.js 20 + TypeScript
- Apollo Server 4 sobre Express 5
- Prisma ORM 7 + PostgreSQL
- JWT (acceso y refresh), bcrypt, Zod

### Configuración
1. Copia `env.example` a `.env` y ajusta valores:
   ```
   PORT=4000
   DATABASE_URL="postgresql://<user>:<pass>@localhost:5432/couriersync"
   JWT_ACCESS_SECRET="cambia-esto"
   JWT_REFRESH_SECRET="cambia-esto"
   ACCESS_TOKEN_TTL="15m"
   REFRESH_TOKEN_TTL="7d"
   ```
2. Instala dependencias:
   ```bash
   npm install
   ```
3. Genera el cliente de Prisma y corre migraciones:
   ```bash
   npx prisma migrate dev --name init
   ```
4. Levanta el servidor en modo desarrollo:
   ```bash
   npm run dev
   ```

El endpoint GraphQL queda disponible en `http://localhost:${PORT}/graphql` y expone el `SDL` usado por el frontend (consultas de usuarios, catálogos, autenticación, encuestas, etc.).

### Scripts
| Script | Descripción |
| --- | --- |
| `npm run dev` | Servidor con `ts-node-dev` |
| `npm run build` | Compila a `dist/` |
| `npm start` | Ejecuta la compilación |
| `npm run prisma:generate` | Regenera el cliente Prisma |
| `npm run prisma:migrate` | Ejecuta `prisma migrate dev` |
| `npm run lint` | Type-check |

### Probar en Postman
1. **Inicia el backend**
   ```bash
   npm run dev
   ```
   Asegúrate de tener la base de datos corriendo y las variables en `.env`.

2. **Crear la petición base**
   - Método: `POST`
   - URL: `http://localhost:4000/graphql`
   - Headers:
     - `Content-Type: application/json`
     - (Opcional para solicitudes autenticadas) `Authorization: Bearer <token>`

3. **Registrar un usuario (opcional)**
   ```json
   {
     "query": "mutation Register($input: RegisterInput!) { registerUser(input: $input) { accessToken refreshToken usuario { idUsuario nombre correo } } }",
     "variables": {
       "input": {
         "nombre": "Cliente Demo",
         "correo": "cliente@demo.com",
         "password": "Demo1234",
         "telefono": "3000000000",
         "detalleDireccion": "Calle 10 #23",
         "departamentoNombre": "Antioquia",
         "ciudadNombre": "Medellín",
         "rolNombre": "CLIENTE"
       }
     }
   }
   ```
   El backend creará los catálogos que no existan y devolverá `accessToken` y `refreshToken`.

4. **Login**
   ```json
   {
     "query": "mutation Login($email: String!, $password: String!) { login(email: $email, password: $password) { accessToken refreshToken usuario { idUsuario nombre correo } } }",
     "variables": {
       "email": "cliente@demo.com",
       "password": "Demo1234"
     }
   }
   ```
   Copia el `accessToken`.

5. **Consultas protegidas (ejemplo `searchUsuarios`)**
   - En la pestaña “Authorization” de Postman selecciona **Bearer Token** y pega el `accessToken`.
   - Usa este body:
   ```json
   {
     "query": "query Usuarios($q: String) { searchUsuarios(q: $q, page: 0, size: 10) { content { idUsuario nombre correo nombreRol } pageInfo { totalElements } } }",
     "variables": {
       "q": ""
     }
   }
   ```

6. **Mutaciones adicionales**
   - `createUsuario`, `updateUsuario`, `createDepartamento`, `createCiudad`, `createRol` y `submitSurvey` se consumen de la misma forma cambiando el `query`.
   - Para refrescar tokens usa:
   ```json
   {
     "query": "mutation Refresh($token: String!) { refreshToken(refreshToken: $token) { accessToken refreshToken usuario { idUsuario } } }",
     "variables": { "token": "<REFRESH_TOKEN>" }
   }
   ```

Con esto puedes guardar los requests en una colección Postman, reutilizar el token y automatizar pruebas del frontend contra este backend.
### Esquema GraphQL
- Queries: `me`, `usuarioById`, `searchUsuarios`, `roles`, `departamentos`, `ciudadesByDepartamento`, `searchCiudades`, `surveys`.
- Mutations: `registerUser`, `login`, `refreshToken`, `logout`, `create/update/deleteUsuario`, `createDepartamento`, `createCiudad`, `createRol`, `submitSurvey`.

Los tipos (`Usuario`, `UsuarioPage`, `RolPage`, etc.) y los `input` coinciden 1:1 con los usados en el frontend existente, garantizando compatibilidad total.

