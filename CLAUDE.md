# Log Analyzer

Herramienta web local (Flask) para analizar logs de servidor web.

## Formato de logs

```
[server]:::[domain]:::ip1,ip2 - - [dd/Mon/yyyy:HH:MM:SS +0000] "METHOD /path HTTP/1.1" status bytes "referer" "user-agent" "extra-id"
```

## Como ejecutar

```bash
pip install -r requirements.txt
python app.py
```

Abrir `http://localhost:5000` en el navegador.

## Estructura

- `parser.py` - Regex parsing, LogEntry dataclass
- `bot_detector.py` - Clasificacion User-Agent + verificacion IP Googlebot
- `analyzer.py` - Funciones de agregacion para reportes
- `csv_export.py` - Generacion CSV
- `app.py` - Flask app, rutas, upload, session management
