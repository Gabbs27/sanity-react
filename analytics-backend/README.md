# 📊 Analytics Backend

Backend Express para conectar con Google Analytics 4 API.

## 🚀 Setup Rápido

### 1. Instalar dependencias
```bash
cd analytics-backend
npm install
```

### 2. Configurar Google Analytics 4

#### A. Crear Service Account en Google Cloud

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita **Google Analytics Data API**:
   - Navigation menu → APIs & Services → Library
   - Busca "Google Analytics Data API"
   - Haz click en "Enable"

4. Crear Service Account:
   - Navigation menu → IAM & Admin → Service Accounts
   - Click "Create Service Account"
   - Nombre: `analytics-reader` (o el que prefieras)
   - Click "Create and Continue"
   - No necesitas agregar roles aquí, click "Done"

5. Crear Key:
   - Click en el service account que acabas de crear
   - Tab "Keys" → "Add Key" → "Create new key"
   - Tipo: JSON
   - Se descargará un archivo JSON

#### B. Configurar Google Analytics

1. Ve a [Google Analytics](https://analytics.google.com/)
2. Admin → Property → Property Access Management
3. Add Users → Agregar el email del service account
4. Rol: **Viewer**
5. Guarda

#### C. Obtener Property ID

1. En Google Analytics: Admin → Property → Property Settings
2. Copia el **Property ID** (número como `123456789`)

### 3. Configurar Variables de Entorno

Copia `.env.example` a `.env`:
```bash
cp .env.example .env
```

Edita `.env` con tus datos:
```env
PORT=5001
FRONTEND_URL=http://localhost:3000

# Genera un token seguro:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ADMIN_TOKEN=tu-token-super-secreto-aqui

# Desde el archivo JSON descargado:
GA4_PROPERTY_ID=123456789
GA4_CLIENT_EMAIL=analytics-reader@tu-proyecto.iam.gserviceaccount.com
GA4_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTu clave privada\n-----END PRIVATE KEY-----\n"
```

**⚠️ IMPORTANTE:** El `GA4_PRIVATE_KEY` debe incluir los saltos de línea como `\n`

### 4. Iniciar el servidor

```bash
# Desarrollo (con auto-reload)
npm run dev

# Producción
npm start
```

El servidor estará disponible en `http://localhost:5001`

## 🔐 Autenticación

El backend usa un token Bearer simple. Para hacer peticiones:

```javascript
fetch('http://localhost:5001/api/analytics?dateRange=30days', {
  headers: {
    'Authorization': `Bearer ${ADMIN_TOKEN}`
  }
})
```

## 📡 Endpoints

### `GET /health`
Health check del servidor.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-10-10T12:00:00.000Z"
}
```

### `GET /api/analytics`
Obtiene datos de Google Analytics.

**Headers:**
- `Authorization: Bearer <ADMIN_TOKEN>`

**Query Params:**
- `dateRange`: `7days` | `30days` | `90days` (default: `30days`)

**Response:**
```json
{
  "overview": {
    "totalVisits": 5000,
    "uniqueVisitors": 3000,
    "pageViews": 10000,
    "avgSessionDuration": "3:42",
    "bounceRate": "42.5%",
    "newVsReturning": { "new": 65, "returning": 35 }
  },
  "pageViews": [...],
  "topPages": [...],
  "topCountries": [...],
  "devices": [...],
  "browsers": [...],
  "realtimeUsers": 15
}
```

## 🐛 Troubleshooting

### Error: "Analytics client not initialized"
- Verifica que las credenciales en `.env` sean correctas
- Asegúrate de que `GA4_PRIVATE_KEY` tenga los `\n` correctamente

### Error: "Permission denied"
- Verifica que el service account tenga acceso en GA4
- El rol debe ser mínimo "Viewer"

### Error: "Property not found"
- Verifica que el `GA4_PROPERTY_ID` sea correcto
- Debe ser solo el número, sin prefijo "properties/"

## 🚀 Deploy

### Opción 1: Railway
```bash
railway login
railway init
railway up
```

### Opción 2: Heroku
```bash
heroku create your-analytics-backend
git push heroku main
```

### Opción 3: Vercel (Serverless)
Agregar `vercel.json`:
```json
{
  "version": 2,
  "builds": [{ "src": "server.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "/server.js" }]
}
```

No olvides configurar las variables de entorno en tu plataforma de deploy.



