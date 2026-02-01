# Requisitos - Log Analyzer Web GUI

## Estado Actual

### Funcionalidades Existentes
- [x] Subida de múltiples archivos (ya implementado con `multiple` en input)
- [x] Drag & drop de archivos
- [x] Detección de 48+ patrones de bots
- [x] Estadísticas generales: Total requests, URLs únicas, IPs únicas, bytes totales
- [x] Distribución de status codes
- [x] Métodos HTTP
- [x] Categorías de bots
- [x] Top bots (nombre, categoría, hits, URLs, verificado)
- [x] Top URLs (URL, hits, bot, human, bytes)
- [x] Tráfico por fecha
- [x] Export JSON

---

## Fase 1: UI con Pestañas (Tabs)

### Objetivo
Reorganizar la UI en secciones/pestañas similar a Screaming Frog Log Analyzer.

### Pestañas a Implementar

1. **Overview** (Dashboard)
   - Stats cards actuales (total requests, unique URLs, IPs, bytes)
   - Bot vs Human split
   - Status codes distribution
   - Traffic by date chart

2. **URLs**
   - Tabla con todas las URLs
   - Columnas: URL, Total Hits, Bot Hits, Human Hits, Avg Bytes, Status Codes
   - Ordenable y filtrable
   - Búsqueda

3. **Bots**
   - Tabla con todos los bots detectados
   - Columnas: Bot Name, Category, Total Hits, Unique URLs, Verified
   - Sub-vista: Ver URLs accedidas por cada bot

4. **Google Bots** (Pestaña especial - PRIORITARIA)
   - Filtrar solo bots de Google (Googlebot, Googlebot-Image, AdsBot-Google, etc.)
   - Por cada URL accedida por Google:
     - URL
     - Hits (cantidad de veces)
     - Avg Bytes (promedio de bytes)
     - Status Code(s) con conteo
   - Verificación de Googlebot (IPs legítimas)

5. **Status Codes**
   - Breakdown detallado por código
   - URLs que retornan cada status code
   - Identificar inconsistencias (misma URL, diferentes status codes)

6. **AI Bots**
   - Filtro específico para bots LLM
   - GPTBot, ClaudeBot, PerplexityBot, etc.
   - Comparativa de comportamiento entre bots

---

## Fase 2: Mejoras de Datos (Inspirado en Screaming Frog v6.0)

### Métricas Adicionales por URL
- [ ] Average Bytes (ya tenemos total, calcular promedio)
- [ ] Days Since Last Crawled (basado en última fecha de request)
- [ ] First Seen / Last Seen dates
- [ ] Hit trend (incremento/decremento)

### Métricas Adicionales por Bot
- [ ] Total bytes transferidos
- [ ] Average response size
- [ ] Error rate (% de 4xx/5xx)
- [ ] URLs con errores

### Bytes Tab (nuevo)
- [ ] Total bytes por URL
- [ ] Average bytes por URL
- [ ] Bytes por día
- [ ] Identificar archivos pesados

---

## Fase 3: Filtros y Búsqueda

### Filtros Globales
- [ ] Rango de fechas
- [ ] Tipo de bot (Search Engine, LLM, SEO Tool, etc.)
- [ ] Status code range (2xx, 3xx, 4xx, 5xx)
- [ ] Método HTTP
- [ ] Dominio (si hay múltiples)
- [ ] Servidor

### Búsqueda
- [ ] Búsqueda por URL (parcial)
- [ ] Búsqueda por User Agent
- [ ] Regex support

---

## Fase 4: Export y Reporting

- [ ] Export CSV por pestaña
- [ ] Export JSON completo
- [ ] Generar reporte PDF (resumen ejecutivo)

---

## Referencia: Screaming Frog Log Analyzer

**Fuentes consultadas:**
- [Screaming Frog Log File Analyser](https://www.screamingfrog.co.uk/log-file-analyser/)
- [Monitor AI Bots Tutorial](https://www.screamingfrog.co.uk/log-file-analyser/tutorials/monitor-ai-bots-in-the-log-file-analyser/)
- [Log File Analyser v6.0 Update](https://www.screamingfrog.co.uk/blog/log-file-analyser-6-0/)

### Funcionalidades Clave de SF a Replicar
1. **URLs Tab**: Cada URL con métricas (frecuencia, response codes, bytes, tiempos)
2. **Response Codes Tab**: Breakdown de status codes, flag de inconsistencias
3. **User Agents Tab**: Datos agregados por tipo de bot
4. **Bot Verification**: Verificar IPs de Googlebot/Bingbot contra listas públicas
5. **Bytes Tab**: Total bytes, avg bytes, bytes por día
6. **Days Since Last Crawled**: Columna que muestra antigüedad del crawl

---

## Prioridad de Implementación

| Prioridad | Tarea | Estado |
|-----------|-------|--------|
| 1 | Implementar sistema de pestañas en UI | COMPLETADO |
| 2 | Pestaña "Google Bots" con hits, avg bytes, status codes por URL | COMPLETADO |
| 3 | Mejorar tracking de datos (avg bytes, status codes por URL-bot) | COMPLETADO |
| 4 | Pestaña "AI Bots" | COMPLETADO |
| 5 | Pestaña "Status Codes" con detección de inconsistencias | COMPLETADO |
| 6 | Pestaña "URLs" con búsqueda y paginación | COMPLETADO |
| 7 | Filtros por bot en Google/AI tabs | COMPLETADO |
| 8 | Export CSV por pestaña | COMPLETADO |
| 9 | Filtros globales (fecha, dominio, servidor) | COMPLETADO |
| 10 | Sorting en tablas (click en headers) | COMPLETADO |

---

## Notas Técnicas

### Cambios necesarios en script.js

Para la pestaña Google Bots necesitamos trackear por cada combinación URL + Bot:
```javascript
// Estructura propuesta
hitsByBotUrl: {
  'Googlebot': {
    '/page1': {
      hits: 10,
      totalBytes: 50000,
      statusCodes: { 200: 8, 304: 2 },
      firstSeen: '2025-01-01',
      lastSeen: '2025-01-31'
    }
  }
}
```

### Google Bots a Filtrar
- Googlebot
- Googlebot-Image
- Googlebot-Video
- Googlebot-News
- Storebot-Google
- Google-InspectionTool
- GoogleOther
- AdsBot-Google
- Mediapartners-Google
- Google-Extended
