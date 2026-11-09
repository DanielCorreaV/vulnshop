# VulnShop Lab (app web intencionalmente vulnerable)

Catálogo de libros obtenido de la API pública Open Library (sin API key).

Incluye 3 temas de color, favoritos (localStorage) y menú responsive.

Sitio estático para practicar con OWASP ZAP. **Solo uso educativo.**

## Publicar en GitHub Pages
1. Crea un repo y sube estos archivos a la raíz.
2. Settings → Pages → Deploy from a branch → `main` / `(root)`.

## Probar en local (recomendado para el escaneo activo)
    python3 -m http.server 8080   # http://localhost:8080

## Vulnerabilidades sembradas (para tu informe)
| # | Vulnerabilidad | Dónde | Cómo probar |
|---|----------------|-------|-------------|
| 1 | DOM XSS (innerHTML) | index.html / app.js | `?q=<img src=x onerror=alert(1)>` |
| 2 | DOM XSS (jQuery .html + hash) | app.js | `index.html#<img src=x onerror=alert(1)>` |
| 3 | XSS almacenado (localStorage) | Libro de visitas | publicar `<img src=x onerror=alert(1)>` |
| 4 | XSS reflejado en login | login.html | `?user=<b>x</b>&pass=1` |
| 5 | Open redirect | app.js | `?next=https://example.org` |
| 6 | eval() con entrada de usuario | app.js | `?calc=2+2` |
| 7 | jQuery 1.12.4 obsoleto | index.html | Alerta de librería vulnerable |
| 8 | Recursos externos sin SRI | index.html | |
| 9 | Contenido mixto HTTP | index.html | |
| 10 | Enlaces `target=_blank` sin `rel=noopener` | index.html | |
| 11 | Credenciales/API keys en código y comentarios | app.js, index.html | |
| 12 | Contraseña por GET + autocomplete | login.html | |
| 13 | Autenticación y autorización solo en cliente | login.html, admin.html | `localStorage.setItem('role','admin')` |
| 14 | Cookie sin Secure/HttpOnly/SameSite | app.js | |
| 15 | Archivos sensibles expuestos | robots.txt, backup/ | |
| 17 | Datos de API de terceros insertados con innerHTML | app.js (catálogo) | Confianza ciega en Open Library |
| 18 | Parámetro sin codificar en llamada a API | app.js | `?q=x&limit=500` |
| 19 | Favoritos desde localStorage insertados con innerHTML (manipulables) | favoritos.html / app.js | `localStorage.setItem('favorites', JSON.stringify([{key:'1',title:'<img src=x onerror=alert(1)>',author:'a',year:1,cover:''}]))` y recarga favoritos.html |
| 20 | Fuentes de Google sin SRI | todas las páginas | |
| 16 | Sin CSP, X-Frame-Options, X-Content-Type-Options, etc. | Cabeceras HTTP | ZAP alerta pasiva |
