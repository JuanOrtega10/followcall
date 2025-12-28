# Follow Call

Sistema para crear agentes de ElevenLabs que automatizan las llamadas de seguimiento. Permite crear agentes conversacionales de voz para cualquier tipo de seguimiento: atención al cliente, encuestas, verificación de servicios, recopilación de información, etc.

## Características

- 🎯 **Configuración de Agentes**: Define objetivos y genera automáticamente system prompts estructurados usando IA
- 🤖 **Integración con ElevenLabs**: Crea y gestiona agentes conversacionales de voz
- 📊 **Estructuración de Datos**: Define qué información recolectar y extrae datos estructurados de las conversaciones
- 🎨 **Interfaz Moderna**: Diseño dark theme inspirado en MOCKLAB
- 🔄 **Tiempo Real**: Vista de llamada en tiempo real con transcripción

## Tecnologías

- **Next.js 16.0.10+** (App Router)
- **React 19.2.2+**
- **TypeScript 5.x**
- **Tailwind CSS**
- **Vercel AI SDK** (para generación de prompts y structured outputs)
- **ElevenLabs API** (para agentes conversacionales)

## Configuración

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

#### Desarrollo Local

Copia `.env.example` a `.env.local` y completa con tus credenciales:

```bash
cp .env.example .env.local
```

Edita `.env.local` con tus API keys:

```env
ELEVENLABS_API_KEY=tu_api_key_aqui
OPENAI_API_KEY=tu_api_key_aqui
# O ANTHROPIC_API_KEY=tu_api_key_aqui
```

#### Producción (Vercel)

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Navega a **Settings** → **Environment Variables**
3. Agrega las siguientes variables de entorno:
   - `ELEVENLABS_API_KEY` = tu API key de ElevenLabs
   - `OPENAI_API_KEY` = tu API key de OpenAI (o `ANTHROPIC_API_KEY` si usas Anthropic)
4. Asegúrate de seleccionar los entornos correctos (Production, Preview, Development)
5. Haz clic en **Save**
6. Redespliega tu aplicación para que los cambios surtan efecto

**⚠️ Importante:** La API key de ElevenLabs debe estar configurada en Vercel para que las llamadas funcionen en producción. El código obtiene la API key del servidor a través de una API route segura.

### 3. Obtener API Keys

**ElevenLabs:**
1. Crear cuenta en [ElevenLabs](https://elevenlabs.io)
2. Ir a Settings → API Keys
3. Generar nueva API key

**OpenAI (para AI SDK):**
1. Crear cuenta en [OpenAI Platform](https://platform.openai.com)
2. Ir a API Keys
3. Crear nueva secret key

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Uso

### Crear un Agente

1. Ve a la página principal y haz clic en "Nuevo Agente"
2. Ingresa el nombre del agente
3. Define el objetivo (ej: "Quiero realizar llamadas de seguimiento para recopilar información sobre la satisfacción de los clientes")
4. Haz clic en "Generar System Prompt" - esto generará automáticamente:
   - Un system prompt estructurado para ElevenLabs
   - Un schema de datos que define qué información recolectar
5. Ingresa el Voice ID de ElevenLabs
6. Haz clic en "Crear Agente"

### Probar un Agente

1. Desde la lista de agentes, haz clic en "Probar Agente"
2. Se abrirá la vista de llamada en tiempo real
3. La llamada se conectará automáticamente
4. Puedes ver la transcripción en tiempo real
5. Al finalizar, el transcript se estructurará automáticamente según el schema definido

## Estructura del Proyecto

```
followcall/
├── app/                    # Next.js App Router
│   ├── api/ai/            # API Routes para AI SDK
│   ├── agent/             # Páginas de gestión de agentes
│   └── call/              # Vista de llamada en tiempo real
├── components/            # Componentes React
├── lib/                   # Utilidades y funciones
│   ├── ai/               # Funciones de AI SDK
│   └── elevenlabs/       # Cliente de ElevenLabs
├── types/                # Tipos TypeScript
└── styles/               # Estilos globales
```

## Notas Importantes

- Las variables de entorno sin `NEXT_PUBLIC_` solo están disponibles en el servidor
- Todas las llamadas a AI SDK se hacen desde API Routes para proteger las API keys
- Los agentes se guardan en localStorage (no hay backend por ahora)
- El sistema de tiempo real de ElevenLabs requiere implementación completa del WebSocket API

## Próximos Pasos

- [ ] Implementar conexión WebSocket completa con ElevenLabs Real-Time API
- [ ] Agregar persistencia de datos (base de datos)
- [ ] Implementar autenticación de usuarios
- [ ] Agregar más opciones de personalización de voz
- [ ] Exportar transcripts estructurados

## Licencia

MIT
