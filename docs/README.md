# Documentación Técnica y de Producto - Tema Ungraded

## Índice General

1.  [**Visión General del Producto (PRD)**](#1-visión-general-del-producto-prd)
    -   [Resumen Ejecutivo](#11-resumen-ejecutivo)
    -   [Stack Tecnológico](#12-stack-tecnológico)
    -   [Propósito y Audiencia](#13-propósito-y-audiencia)

2.  [**Guía de Configuración para Merchants**](#2-guía-de-configuración-para-merchants)
    -   [Instalación del Tema](#21-instalación-del-tema)
    -   [Configuración de Settings](#22-configuración-de-settings)
    -   [Gestión de Secciones](#23-gestión-de-secciones)

3.  [**Arquitectura y Estructura Técnica**](#3-arquitectura-y-estructura-técnica)
    -   [Árbol de Directorios](#31-árbol-de-directorios)
    -   [Descripción de Carpetas](#32-descripción-de-carpetas)
    -   [Relación Template ↔ Section](#33-relación-template--section)

4.  [**Diseño y Experiencia de Usuario (UI/UX)**](#4-diseño-y-experiencia-de-usuario-uiux)
    -   [Principios de Branding](#41-principios-de-branding)
    -   [Diseño Responsive](#42-diseño-responsive)
    -   [Componentes TCG-Oriented](#43-componentes-tcg-oriented)
    -   [Flujo de Usuario](#44-flujo-de-usuario)

5.  [**Guías de Desarrollo**](#5-guías-de-desarrollo)
    -   [Convenciones de Código](#51-convenciones-de-código)
    -   [Patrones de Diseño](#52-patrones-de-diseño)
    -   [Integración de Secciones](#53-integración-de-secciones)

6.  [**Mantenimiento y Versionado**](#6-mantenimiento-y-versionado)
    -   [Gestión de Archivos Autogenerados](#61-gestión-de-archivos-autogenerados)
    -   [Flujo de Git y Releases](#62-flujo-de-git-y-releases)
    -   [Estrategia de Actualización](#63-estrategia-de-actualización)

---

## 1. Visión General del Producto (PRD)

### 1.1 Resumen Ejecutivo
**Ungraded** es una tienda digital especializada en el mercado de **Trading Card Game (TCG)** que representa un enfoque disruptivo y auténtico dentro de la industria de cartas coleccionables.

**¿Qué es Ungraded?**
Es una plataforma que abraza la cultura "degenerada" del coleccionismo de TCG con humor irreverente y una experiencia de usuario única. El nombre "Ungraded" hace referencia directa a las cartas sin calificar por empresas certificadoras, posicionándose como el lugar para aquellos que valoran la carta por su esencia, no por el número en una etiqueta.

**Valor Diferencial para TCG:**
- **Autenticidad Brutal**: Mensajes directos como "¿ABRIRLO O NO ABRIRLO? EL DILEMA ETERNO DEL DEGENERADO" conectan genuinamente con la psicología del coleccionista.
- **Especialización Total**: Categorización específica por tipo de producto (Singles, Sellado, Preventas, Accesorios) con filtros avanzados por rareza, expansión y otros atributos.
- **Experiencia Inmersiva**: Interfaz personalizada que refleja la cultura gaming con personajes, colores vibrantes y un tono conversacional único.

### 1.2 Stack Tecnológico
- **Liquid**: Template language de Shopify para lógica de negocio y renderizado dinámico.
- **JavaScript ES6**: Funcionalidades interactivas (filtros, carrito, etc.).
- **CSS Personalizado**: Sistema de diseño modular con variables CSS, siguiendo los lineamientos de diseño específicos del proyecto.
- **Configuración Shopify**: Metafields, templates especializados, localización y mercados.

### 1.3 Propósito y Audiencia
- **Propósito Comercial:** Ser el marketplace líder para la comunidad TCG hispanohablante.
- **Audiencia Objetivo:** Coleccionistas, Jugadores Competitivos y Vendedores de cartas.

---

## 2. Guía de Configuración para Merchants

### 2.1 Instalación del Tema
1.  **Acceder al Admin**: `Tienda online` > `Temas`.
2.  **Subir Tema**: `Agregar tema` > `Cargar archivo ZIP`.
3.  **Activar Tema**: `Acciones` > `Publicar`.

### 2.2 Configuración de Settings
- **Logo**: `Configuración del tema > Logo`.
- **Colores**: `Configuración del tema > Colores`. Modifica los 5 esquemas de color disponibles.
- **Tipografía**: `Configuración del tema > Tipografía`.

### 2.3 Gestión de Secciones
- **Añadir/Ordenar**: Desde el editor visual (`Personalizar`), puedes arrastrar y soltar secciones en cualquier página.
- **Configurar Secciones**: Cada sección tiene sus propias opciones de personalización (textos, imágenes, colecciones, etc.).

---

## 3. Arquitectura y Estructura Técnica

### 3.1 Árbol de Directorios
```
Ungraded/
├── assets/         # CSS, JS, imágenes, fuentes
├── config/         # settings_data.json, settings_schema.json
├── layout/         # theme.liquid
├── locales/        # Archivos de traducción
├── sections/       # Módulos de página
├── snippets/       # Componentes reutilizables
└── templates/      # Estructura de páginas
```

### 3.2 Descripción de Carpetas
-   `assets/`: Recursos estáticos. CSS modular (`component-*.css`, `section-*.css`), JS modular por funcionalidad.
-   `config/`: `settings_schema.json` (define las opciones del editor) y `settings_data.json` (guarda los valores de esas opciones).
-   `layout/`: Plantilla principal `theme.liquid`.
-   `locales/`: Archivos de traducción para internacionalización (i18n).
-   `sections/`: Secciones modulares y reutilizables que se pueden añadir a las páginas.
-   `snippets/`: Fragmentos de código reutilizables (ej: `product-card.liquid`).
-   `templates/`: Definen qué secciones se muestran en cada tipo de página (ej: `product.json`, `collection.json`).

### 3.3 Relación Template ↔ Section
Los templates (`templates/*.json`) actúan como un plano que define qué `sections` (`sections/*.liquid`) se renderizan, en qué orden y con qué configuraciones. Esto permite una personalización visual desde el editor de Shopify.

---

## 4. Diseño y Experiencia de Usuario (UI/UX)

### 4.1 Principios de Branding
- **Identidad Ungraded**: Auténtica, especializada, con humor y transparente.
- **Paleta de Colores**: Basada en los lineamientos específicos del proyecto, con un fondo púrpura principal y acentos en amarillo y cian.
- **Tipografías**: `Tanker` (títulos), `Troylinesans` (subtítulos), `Teco` (párrafos) y `Acumin` (web).

### 4.2 Diseño Responsive
- **Breakpoints**: El tema utiliza un enfoque *mobile-first* con breakpoints en `768px` (tablet) y `1024px` (desktop).
- **Imágenes Adaptativas**: Se usa `image_url` con `srcset` y `sizes` para servir imágenes optimizadas.

### 4.3 Componentes TCG-Oriented
- **Sistema de Mascotas**: Personajes visuales para cada categoría (`Singles`, `Sellado`, etc.).
- **Badges de Condición**: Indicadores visuales para el estado de las cartas (`NM`, `LP`).
- **Bloques de Expansión**: Secciones visuales para cada expansión de juego.

### 4.4 Flujo de Usuario
El flujo principal es: `Homepage` → `Página de Categoría` → `Página de Colección` → `Página de Producto` → `Checkout`.

---

## 5. Guías de Desarrollo

### 5.1 Convenciones de Código
- **Liquid**: Indentación de 2 espacios, filtros encadenados con espacios, y uso de `-` para controlar espacios en blanco.
- **CSS**: Arquitectura modular con variables CSS y nomenclatura BEM ligera (`bloque__elemento--modificador`).
- **JavaScript**: Vanilla ES6, organizado en módulos por funcionalidad.

### 5.2 Patrones de Diseño
- **Separation of Concerns**: HTML para estructura, CSS para estilos, y JS para comportamiento.
- **Componentes Reutilizables**: `snippets` para elementos como `product-card` y `price`.

### 5.3 Integración de Secciones
1.  **Crear el archivo `.liquid`** en la carpeta `sections/`.
2.  **Definir el `{% schema %}`** con `name`, `settings` (opciones) y `presets` (configuraciones por defecto).
3.  **Añadir CSS modular** en `assets/` (ej: `section-nueva.css`).
4.  **Añadir JS modular** si es necesario, escuchando los eventos del editor de temas (`shopify:section:load`).

---

## 6. Mantenimiento y Versionado

### 6.1 Gestión de Archivos Autogenerados
- **`config/settings_data.json`**: **NUNCA** debe ser editado manualmente. Los cambios deben hacerse a través del editor de temas de Shopify.
- **Templates JSON (`templates/*.json`)**: Pueden ser modificados por el editor de temas. Es recomendable versionar una configuración base y documentar los cambios realizados por el merchant.

### 6.2 Flujo de Git y Releases
- **Ramas**: `main` (producción), `development` (desarrollo activo), `feature/*` (nuevas funcionalidades), `hotfix/*` (bugs críticos).
- **Commits**: Usar la convención de Commits Convencionales (`feat`, `fix`, `docs`, etc.).
- **Releases**: Usar Versionado Semántico (ej: `v1.2.3`) y etiquetar los releases en Git.

### 6.3 Estrategia de Actualización
- **Theme Checkpoints**: Crear backups del tema antes de cada deployment.
- **Deployment Escalonado**: `development` -> `staging` -> `production`.


