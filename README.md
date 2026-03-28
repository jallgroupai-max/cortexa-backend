# Cortexa Backend

Backend API para Cortexa AI Studio. Express + Prisma + PostgreSQL + JWT.

## Requisitos

- Node.js 20+
- Docker y Docker Compose
- npm

## Inicio rápido

### 1. Levantar PostgreSQL con Docker

```bash
docker compose up postgres -d
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

### 4. Ejecutar migraciones

```bash
npx prisma migrate dev
```

### 5. Ejecutar seed (datos de ejemplo)

```bash
npm run db:seed
```

### 6. Iniciar servidor

```bash
npm run dev
```

El servidor estará en `http://localhost:3001`.

### Levantar todo con Docker Compose

```bash
docker compose up --build
```

## Usuario demo

- Email: `demo@cortexa.ai`
- Password: `demo123456`

## Endpoints API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/api/auth/register` | Registrar usuario |
| POST | `/api/auth/login` | Iniciar sesión |
| POST | `/api/auth/request-reset` | Solicitar reseteo de contraseña |
| POST | `/api/auth/reset-password` | Resetear contraseña con token |
| GET | `/api/auth/me` | Usuario actual |
| GET | `/api/users/profile` | Obtener perfil |
| PUT | `/api/users/profile` | Actualizar perfil |
| GET | `/api/agents` | Listar agentes |
| POST | `/api/agents` | Crear agente |
| GET | `/api/agents/:id` | Obtener agente |
| PUT | `/api/agents/:id` | Actualizar agente |
| DELETE | `/api/agents/:id` | Eliminar agente |
| GET | `/api/workflows` | Listar workflows |
| POST | `/api/workflows` | Crear workflow |
| GET | `/api/workflows/:id` | Obtener workflow |
| PUT | `/api/workflows/:id` | Actualizar workflow |
| DELETE | `/api/workflows/:id` | Eliminar workflow |
| POST | `/api/workflows/:id/duplicate` | Duplicar workflow |
| GET | `/api/workspaces` | Listar workspaces |
| POST | `/api/workspaces` | Crear workspace |
| PUT | `/api/workspaces/:id` | Actualizar workspace |
| DELETE | `/api/workspaces/:id` | Eliminar workspace |
| GET | `/api/workspaces/:id/members` | Listar miembros |
| POST | `/api/workspaces/:id/members` | Invitar miembro |
| DELETE | `/api/workspaces/:id/members/:memberId` | Eliminar miembro |
| PUT | `/api/workspaces/members/:memberId/permissions` | Actualizar permisos |
| GET | `/api/knowledge-sources/agent/:agentId` | Listar fuentes por agente |
| POST | `/api/knowledge-sources` | Crear fuente |
| POST | `/api/knowledge-sources/batch` | Crear fuentes en lote |
| PATCH | `/api/knowledge-sources/:id/status` | Actualizar estado |
| DELETE | `/api/knowledge-sources/:id` | Eliminar fuente |
| GET | `/api/billing/orders` | Listar órdenes de facturación |

## Tests

```bash
npm test
```

## Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express
- **ORM**: Prisma
- **Base de datos**: PostgreSQL
- **Autenticación**: JWT (bcryptjs)
- **Validación**: Zod
- **Contenedores**: Docker + Docker Compose
