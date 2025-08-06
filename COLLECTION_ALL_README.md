# Colección Virtual "All" - Look and Feel de Singles

## 📋 Resumen
Se ha modificado el diseño de la colección virtual "all" para que tenga el mismo look and feel que la vista de singles, manteniendo consistencia visual en toda la tienda.

## 🔧 Archivos Creados/Modificados

### Nuevos Archivos:
1. **`sections/main-collection-all.liquid`** - Plantilla principal para la colección "all"
2. **`assets/collection-filters-all.js`** - JavaScript para filtros dinámicos
3. **`templates/collection.all.json`** - Template JSON que define la estructura

## ✨ Características Implementadas

### Diseño Visual
- **Header estilo Singles**: Título de dos líneas configurables
- **Sidebar de filtros**: Mismo estilo visual que la vista de singles
- **Grid de productos**: Layout consistente con otras colecciones
- **Mascota personalizable**: Opción de subir imagen o usar emoji por defecto

### Sistema de Filtros
- **Disponibilidad**: Filtrar por productos disponibles/agotados
- **Rango de precio**: Slider dinámico basado en precios reales
- **Tipo de producto**: Detecta automáticamente TipoProducto_* tags
- **Expansión**: Filtra por Expansion_* tags
- **Rareza**: Filtra por Rareza_* tags

### Tarjetas de Producto Inteligentes
El sistema detecta automáticamente el tipo de producto basándose en las etiquetas:
- `TipoProducto_Single` → Usa `product-card-singles`
- `TipoProducto_Sellado` → Usa `product-card-sellado`
- `TipoProducto_Preventa` → Usa `product-card-preventas`
- `TipoProducto_Accesorio` → Usa `product-card-accesorios`
- **Fallback**: Si no encuentra etiquetas específicas, usa `product-card-singles`

### Funcionalidades Móviles
- **Sidebar deslizante**: Los filtros se muestran en un sidebar que se desliza desde la izquierda
- **Botón flotante**: Muestra contador de filtros activos
- **Overlay**: Fondo oscuro cuando el sidebar está abierto
- **Gestos**: Cerrar con ESC o clic en overlay

## 🎨 Configuración Visual

### Personalización desde el Admin:
- **Primera línea del título**: "CATÁLOGO DE" (por defecto)
- **Segunda línea del título**: "TODOS LOS PRODUCTOS" (por defecto)
- **Tamaño primera línea**: 2-8 rem (3.5 por defecto)
- **Tamaño segunda línea**: 2-8 rem (4.0 por defecto)
- **Imagen de mascota**: Opcional, usa emoji 🎮 por defecto

### Colores y Estilos:
- Fondo sidebar: `#2d1b69` (morado oscuro)
- Color principal: `#fbbf24` (amarillo)
- Texto: Blanco sobre fondo morado
- Animaciones: Transiciones suaves de 0.3s

## 📱 Responsive Design

### Desktop (>1024px):
- Grid de 2 columnas: sidebar (280px) + contenido principal
- Grid de productos: `minmax(280px, 1fr)`

### Tablet (768-1024px):
- Sidebar se convierte en overlay deslizante
- Grid de productos: `minmax(250px, 1fr)`
- Header en columna vertical

### Móvil (<768px):
- Sidebar fullscreen overlay
- Grid de productos: `minmax(200px, 1fr)`
- Tamaños de título reducidos

## 🔄 Filtros Dinámicos

### JavaScript Features:
- **Filtrado instantáneo**: Sin recarga de página
- **Contador visual**: Muestra número de filtros activos
- **Animaciones**: Productos aparecen/desaparecen con fade
- **Mensaje vacío**: Se muestra cuando no hay resultados
- **Limpiar filtros**: Botón para resetear todos los filtros

### Lógica de Filtrado:
```javascript
// Disponibilidad
if (activeFilters.availability.length > 0) {
  // Solo mostrar productos que coincidan con la disponibilidad seleccionada
}

// Precio
if (productPrice > activeFilters.priceMax) {
  // Ocultar productos que excedan el precio máximo
}

// Tags (Expansión, Rareza, Tipo)
if (activeFilters.tags.length > 0) {
  // Solo mostrar productos que tengan al menos uno de los tags seleccionados
}
```

## 🚀 Instalación y Uso

### Para usar esta funcionalidad:
1. Subir los archivos a su tema de Shopify
2. Navegar a `/collections/all`
3. La plantilla se aplicará automáticamente
4. Configurar desde Customize → Collections → All

### Requisitos:
- Productos etiquetados con `TipoProducto_*`, `Expansion_*`, `Rareza_*`
- Snippets de product cards existentes (`product-card-singles`, etc.)
- Fuentes 'Tanker' y 'Acumin Variable Concept'

## 🐛 Troubleshooting

### Si los filtros no funcionan:
1. Verificar que los productos tengan las etiquetas correctas
2. Comprobar que el JavaScript se está cargando
3. Revisar la consola del navegador por errores

### Si las tarjetas no se muestran correctamente:
1. Verificar que los snippets de product-card existen
2. Comprobar las etiquetas `TipoProducto_*` en los productos
3. El fallback siempre usa `product-card-singles`

## 📄 Estructura de Archivos

```
/sections/
  ├── main-collection-all.liquid     # Plantilla principal
  
/assets/
  ├── collection-filters-all.js      # JavaScript de filtros
  
/templates/
  ├── collection.all.json           # Configuración del template
```

## 💡 Notas Importantes

- **Performance**: Los filtros son cliente-side para mejor UX
- **SEO**: La colección "all" mantiene SEO-friendly URLs
- **Compatibilidad**: Funciona con el sistema de themes de Shopify 2.0
- **Mantenimiento**: Fácil de actualizar desde el admin de Shopify

---

✅ **¡La colección virtual "all" ahora tiene el mismo look and feel que la vista de singles!**
