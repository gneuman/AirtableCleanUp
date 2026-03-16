# Diario de Ingeniería - Gabriel Neuman

## Proyecto: Airtable Duplicate Cleaner 🚀
**Fecha: lunes, 16 de marzo de 2026**

### Resumen del día:
Hoy hemos transformado una idea inicial de limpieza de Airtable en una herramienta universal, de código abierto y lista para producción (Vercel).

### Tareas Completadas:
1.  **Motor Universal de Escaneo**: Implementamos una lógica de comparación dinámica que permite elegir cualquier campo (Startup Name, Website, Email, etc.) y encontrar duplicados basados en cualquiera de ellos (Lógica OR).
2.  **Normalización Inteligente**: El sistema ahora limpia URLs (quita protocolos, www y slash final) y normaliza nombres (quita signos de puntuación y espacios extras) para una comparación precisa.
3.  **Interfaz de Dashboard**: Creamos una vista de panel con barra lateral para configuración persistente (LocalStorage).
4.  **Selección de Maestro Manual**: Añadimos la capacidad de elegir qué registro del grupo debe ser el "Master" antes de procesar.
5.  **Filtro de Pendientes**: Implementamos un filtro para ver solo registros donde el checkbox de "Posible Duplicado" esté vacío en Airtable, optimizando la vista de trabajo.
6.  **Acciones Automatizadas**:
    -   **Marcado Masivo**: El sistema marca el checkbox y vincula todos los duplicados encontrados en el Link Record del Maestro.
    -   **Seguridad**: Añadimos un botón para "desligar" falsos positivos antes de realizar el merge.
7.  **Preparación Open Source**: Añadimos `.gitignore`, `package.json` configurado para Vercel y un `README.md` detallado con la historia del creador y links a [gabrielneuman.com](https://gabrielneuman.com).

### Notas para el Artículo de hoy:
*   **Enfoque**: La importancia de herramientas que den control humano sobre procesos automáticos (como la selección manual de maestros y el descarte de falsos positivos).
*   **Arquitectura**: Cómo el uso de Serverless Functions (Vercel) y LocalStorage permite crear herramientas potentes sin necesidad de una base de datos propia.

---
*Log generado por Gemini CLI en colaboración con Gabriel Neuman.*
