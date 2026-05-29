# API Integration Guide

## Architecture

YesBill Mobile uses two API surfaces:
- **FastAPI** (REST + SSE): `AppConfig.apiBaseUrl` (e.g., `https://yesbill.onrender.com`)
- **Supabase** (direct queries): `AppConfig.supabaseUrl` (via `supabase_flutter`)

## Authentication

All FastAPI requests include: `Authorization: Bearer <supabase_jwt>`
Supabase direct queries are auto-authorized via RLS using the active session.

## FastAPI Endpoints

### Auth

| Method | Path | Dart Method | Description |
|--------|------|-------------|-------------|
| POST | `/auth/login` | `AuthRemoteDs.login()` | Email/password sign in |
| POST | `/auth/register` | `AuthRemoteDs.register()` | Sign up |
| POST | `/auth/logout` | `AuthRemoteDs.logout()` | Sign out |
| GET | `/auth/profile` | via supabase `user_profiles` | Get profile |

### Bills

| Method | Path | Dart Method | Description |
|--------|------|-------------|-------------|
| POST | `/bills/generate` | `BillsRemoteDs.generateBill()` | AI bill generation |
| GET | `/bills/generated` | `BillsRemoteDs.listGeneratedBills()` | All generated bills |
| GET | `/bills/generated/:id` | `BillsRemoteDs.getBillById()` | Single bill detail |
| GET | `/bills/generated/month/:ym` | `BillsRemoteDs.listBillsForMonth()` | Bills by month |
| DELETE | `/bills/generated/:id` | `BillsRemoteDs.deleteBill()` | Delete bill |
| PATCH | `/bills/generated/:id/paid` | `BillsRemoteDs.markBillPaid()` | Mark paid |

### Chat (SSE)

| Method | Path | Dart Method | Description |
|--------|------|-------------|-------------|
| GET | `/chat/conversations` | `ChatRemoteDs.listConversations()` | List conversations |
| POST | `/chat/conversations` | `ChatRemoteDs.createConversation()` | Create conversation |
| PATCH | `/chat/conversations/:id` | `ChatRemoteDs.renameConversation()` | Rename |
| DELETE | `/chat/conversations/:id` | `ChatRemoteDs.deleteConversation()` | Delete |
| POST | `/chat/conversations/:id/messages` | `ChatRemoteDs.streamChatMessage()` | **SSE Stream** |
| POST | `/chat/agent/conversations/:id/messages` | `ChatRemoteDs.streamAgentMessage()` | **SSE Stream (agent)** |
| POST | `/chat/agent/execute` | `ChatRemoteDs.executeAgentAction()` | Execute action |
| GET | `/chat/models` | `ChatRemoteDs.getAvailableModels()` | List AI models |
| GET | `/chat/analytics/summary` | `ChatRemoteDs.getAnalyticsSummary()` | AI usage stats |

### AI Settings

| Method | Path | Dart Method | Description |
|--------|------|-------------|-------------|
| GET | `/ai/settings` | `AiSettingsRemoteDs.getAllSettings()` | All provider configs |
| POST | `/ai/settings` | `AiSettingsRemoteDs.saveSettings()` | Create config |
| PATCH | `/ai/settings/:provider` | `AiSettingsRemoteDs.updateSettings()` | Update config |
| DELETE | `/ai/settings/:provider` | `AiSettingsRemoteDs.deleteSettings()` | Delete config |
| POST | `/ai/validate-key` | `AiSettingsRemoteDs.validateKey()` | Validate API key |
| GET | `/ai/providers` | `AiSettingsRemoteDs.getProviders()` | List providers |

## Supabase Direct Queries

### Services (`user_services`)

| Operation | Repository Method | Used In |
|-----------|-----------------|---------|
| SELECT all | `ServicesRepo.getAll()` | `/services` screen |
| SELECT active | `ServicesRepo.getActive()` | Calendar, bill generation |
| SELECT by ID | `ServicesRepo.getById()` | Service detail |
| INSERT | `ServicesRepo.create()` | Add service |
| UPDATE | `ServicesRepo.update()` | Edit service |
| DELETE | `ServicesRepo.delete()` | Delete service |

### Calendar (`service_confirmations`)

| Operation | Repository Method | Used In |
|-----------|-----------------|---------|
| SELECT by month | `CalendarRepo.getMonthConfirmations()` | Calendar screen |
| UPSERT | `CalendarRepo.upsertConfirmation()` | Day status toggle |
| SELECT by service+month | `CalendarRepo.getServiceMonthConfirmations()` | Service calendar |
| STREAM by month | `CalendarRepo.streamMonthConfirmations()` | Real-time calendar updates |

### Profile (`user_profiles`)

| Operation | Repository Method | Used In |
|-----------|-----------------|---------|
| SELECT | `ProfileRepo.getProfile()` | Settings, dashboard |
| UPDATE | `ProfileRepo.updateProfile()` | Profile settings |
| Storage upload | `ProfileRepo.uploadAvatar()` | Avatar change |

## Request Headers

All FastAPI requests (via Dio AuthInterceptor):
```
Authorization: Bearer <supabase_jwt>
Content-Type: application/json
Accept: application/json
```

SSE requests (via dart:io HttpClient):
```
Authorization: Bearer <supabase_jwt>
Content-Type: application/json
Accept: text/event-stream
Cache-Control: no-cache
X-User-Timezone: Asia/Kolkata
```

## Local Development

Set `API_BASE_URL=http://10.0.2.2:8000` for Android emulator to reach host machine localhost.

Run backend:
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```
