# Sistema de Localización

## Descripción General

El sistema de localización en Shopify permite crear una experiencia multiidioma para los usuarios, utilizando archivos JSON para almacenar las traducciones y el filtro Liquid `t` para mostrar el texto apropiado según el idioma del usuario.

## Estructura de la Carpeta `locales/`

La carpeta `locales/` contiene todos los archivos de traducción de la tienda:

```
locales/
├── en.default.json         # Idioma base (inglés)
├── es.json                 # Español
├── fr.json                 # Francés
├── de.json                 # Alemán
├── pt-BR.json              # Portugués (Brasil)
├── pt-PT.json              # Portugués (Portugal)
├── zh-CN.json              # Chino (Simplificado)
├── zh-TW.json              # Chino (Tradicional)
└── [idioma].schema.json    # Archivos de esquema (generados automáticamente)
```

### Archivos Principales

- **`en.default.json`**: Archivo base que contiene todas las claves en inglés
- **`[idioma].json`**: Archivos de traducción para cada idioma específico
- **`[idioma].schema.json`**: Esquemas generados automáticamente por Shopify (NO editar)

## Análisis del Archivo `es.json`

### Estructura General

El archivo `es.json` sigue una estructura jerárquica organizad por namespaces:

```json
{
  "general": { ... },
  "newsletter": { ... },
  "accessibility": { ... },
  "blogs": { ... },
  "products": { ... },
  "templates": { ... },
  "sections": { ... },
  "customer": { ... },
  "gift_cards": { ... },
  "recipient": { ... }
}
```

### Convención de Claves

El sistema utiliza una convención de nomenclatura jerárquica con puntos como separadores:

#### 1. **Namespace General (`general.*`)**

Contiene traducciones para elementos comunes de la interfaz:

```json
"general": {
  "password_page": {
    "login_form_heading": "Entrar a la tienda usando contraseña:",
    "login_password_button": "Entrar usando contraseña",
    "login_form_error": "Contraseña incorrecta"
  },
  "social": {
    "alt_text": {
      "share_on_facebook": "Compartir en Facebook",
      "share_on_twitter": "Compartir en X"
    }
  },
  "search": {
    "search": "Búsqueda",
    "reset": "Borrar término de búsqueda"
  }
}
```

**Claves típicas:**
- `general.password_page.*`
- `general.social.*`
- `general.cart.*`
- `general.search.*`
- `general.pagination.*`

#### 2. **Namespace de Productos (`products.*`)**

Específico para páginas y funcionalidades de productos:

```json
"products": {
  "product": {
    "add_to_cart": "Agregar al carrito",
    "price": {
      "from_price_html": "A partir de {{ price }}",
      "regular_price": "Precio habitual",
      "sale_price": "Precio de oferta"
    },
    "quantity": {
      "label": "Cantidad",
      "increase": "Aumentar cantidad para {{ product }}",
      "decrease": "Reducir cantidad para {{ product }}"
    }
  }
}
```

**Claves típicas:**
- `products.product.add_to_cart`
- `products.product.price.*`
- `products.product.quantity.*`
- `products.facets.*` (para filtros)

#### 3. **Namespace de Plantillas (`templates.*`)**

Para páginas específicas del tema:

```json
"templates": {
  "search": {
    "no_results": "No se encontraron resultados para \"{{ terms }}\"",
    "title": "Resultados de búsqueda"
  },
  "cart": {
    "cart": "Carrito"
  },
  "404": {
    "title": "Página no encontrada"
  }
}
```

#### 4. **Namespace de Secciones (`sections.*`)**

Para secciones específicas del tema:

```json
"sections": {
  "header": {
    "announcement": "Anuncio",
    "menu": "Menú"
  },
  "cart": {
    "title": "Tu carrito",
    "checkout": "Pagar pedido",
    "empty": "Tu carrito esta vacío"
  },
  "footer": {
    "payment": "Formas de pago"
  }
}
```

#### 5. **Namespace del Cliente (`customer.*`)**

Para funcionalidades relacionadas con cuentas de usuario:

```json
"customer": {
  "login_page": {
    "title": "Acceso",
    "email": "Correo electrónico",
    "password": "Contraseña",
    "sign_in": "Iniciar sesión"
  },
  "account": {
    "title": "Cuenta",
    "details": "Detalles de la cuenta"
  }
}
```

### Características Especiales

#### Variables Dinámicas

Muchas traducciones incluyen variables dinámicas usando la sintaxis `{{ variable }}`:

```json
"pagination": {
  "page": "Página {{ number }}"
},
"cart": {
  "view": "Ver carrito ({{ count }})"
}
```

#### Pluralización

Para idiomas que requieren formas plurales, se utilizan claves específicas:

```json
"comments": {
  "one": "{{ count }} comentario",
  "other": "{{ count }} comentarios",
  "many": "{{ count }} comentarios"
}
```

#### HTML Embebido

Algunas traducciones contienen HTML para formato específico:

```json
"admin_link_html": "¿Eres el propietario de la tienda? <a href=\"/admin\" class=\"link underlined-link\">Inicia sesión aquí</a>"
```

## Instrucciones para Añadir Nuevos Idiomas

### Paso 1: Crear el Archivo Base

1. Copia el archivo `en.default.json`
2. Renómbralo usando el código ISO del idioma: `[código-idioma].json`
   - Ejemplos: `fr.json`, `de.json`, `pt-BR.json`

### Paso 2: Traducir el Contenido

Traduce **todas** las cadenas de texto manteniendo:
- La estructura JSON exacta
- Los nombres de las claves
- Las variables dinámicas `{{ variable }}`
- El formato HTML cuando esté presente

### Paso 3: Configurar en Shopify Admin

1. Ve a **Configuración → Idiomas** en el admin de Shopify
2. Agrega el nuevo idioma
3. Sube el archivo JSON correspondiente

### Paso 4: Verificar Sincronización

- Asegúrate de que todas las claves del archivo base estén presentes
- Verifica que no haya claves faltantes o adicionales
- Utiliza herramientas de comparación JSON si es necesario

## Mantener Sincronía de Claves

### Mejores Prácticas

1. **Archivo Base Como Referencia**: Siempre usar `en.default.json` como referencia
2. **Control de Versiones**: Mantener todos los archivos de idioma en el mismo commit
3. **Herramientas de Validación**: Usar scripts para verificar consistencia

### Script de Verificación (Ejemplo)

```javascript
// Verificar que todas las claves estén sincronizadas
function verificarClaves(archivoBase, archivoTraduccion) {
  const clavesBase = extraerClaves(archivoBase);
  const clavesTraduccion = extraerClaves(archivoTraduccion);
  
  const clavesFaltantes = clavesBase.filter(clave => 
    !clavesTraduccion.includes(clave)
  );
  
  return clavesFaltantes;
}
```

### Proceso de Actualización

1. **Agregar nueva clave** al archivo base `en.default.json`
2. **Agregar la misma clave** a TODOS los archivos de idioma
3. **Traducir el contenido** en cada archivo
4. **Probar** en el entorno de desarrollo
5. **Desplegar** todos los archivos simultáneamente

## Ejemplos de Uso en Liquid

### Sintaxis Básica

```liquid
{{ 'general.password_page.login_form_heading' | t }}
```

**Resultado**: "Entrar a la tienda usando contraseña:"

### Con Variables Dinámicas

```liquid
{{ 'general.cart.view' | t: count: cart.item_count }}
```

**Resultado**: "Ver carrito (3)"

### Con HTML

```liquid
{{ 'general.password_page.admin_link_html' | t }}
```

**Resultado**: HTML formateado con enlaces

### Con Fallbacks

```liquid
{{ 'clave.inexistente' | t | default: 'Texto por defecto' }}
```

### En Estructuras Condicionales

```liquid
{% if cart.item_count > 0 %}
  {{ 'general.cart.view' | t: count: cart.item_count }}
{% else %}
  {{ 'general.cart.view_empty_cart' | t }}
{% endif %}
```

### En Atributos HTML

```liquid
<button aria-label="{{ 'accessibility.close' | t }}">
  {{ 'accessibility.close' | t }}
</button>
```

### Pluralización Automática

```liquid
{{ 'blogs.article.comments' | t: count: article.comments_count }}
```

Shopify automáticamente selecciona `one`, `other` o `many` basado en el count.

## Ejemplos Prácticos Completos

### Formulario de Login

```liquid
<h2>{{ 'customer.login_page.title' | t }}</h2>
<form>
  <label for="email">{{ 'customer.login_page.email' | t }}</label>
  <input type="email" id="email" name="email">
  
  <label for="password">{{ 'customer.login_page.password' | t }}</label>
  <input type="password" id="password" name="password">
  
  <button type="submit">{{ 'customer.login_page.sign_in' | t }}</button>
</form>
```

### Carrito de Compras

```liquid
<h2>{{ 'sections.cart.title' | t }}</h2>
{% if cart.item_count > 0 %}
  <p>{{ 'sections.header.cart_count' | t: count: cart.item_count }}</p>
  <button>{{ 'sections.cart.checkout' | t }}</button>
{% else %}
  <p>{{ 'sections.cart.empty' | t }}</p>
  <a href="{{ routes.root_url }}">{{ 'general.continue_shopping' | t }}</a>
{% endif %}
```

### Búsqueda con Resultados

```liquid
<h1>{{ 'templates.search.title' | t }}</h1>
{% if search.results_count > 0 %}
  {{ 'templates.search.results_with_count' | t: count: search.results_count }}
{% else %}
  {{ 'templates.search.no_results' | t: terms: search.terms }}
{% endif %}
```

## Notas Importantes

### Archivos Generados Automáticamente

Los archivos contienen este aviso al inicio:
```json
/*
 * ------------------------------------------------------------
 * IMPORTANT: The contents of this file are auto-generated.
 *
 * This file may be updated by the Shopify admin language editor
 * or related systems. Please exercise caution as any changes
 * made to this file may be overwritten.
 * ------------------------------------------------------------
 */
```

**Advertencia**: Los cambios hechos directamente en estos archivos pueden ser sobrescritos por el editor de idiomas de Shopify Admin.

### Gestión de Cambios

1. **Usar el Admin de Shopify** para cambios menores
2. **Editar archivos directamente** para cambios masivos o nuevas implementaciones
3. **Hacer backup** antes de cambios importantes
4. **Probar en entorno de desarrollo** antes de producción

Esta documentación proporciona una base sólida para trabajar con el sistema de localización de Shopify y mantener traducciones consistentes en múltiples idiomas.
