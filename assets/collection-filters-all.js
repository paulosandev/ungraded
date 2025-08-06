/**
 * collection-filters-all.js
 * Filtros para la colección virtual "all" con el look and feel de singles
 */

class AllCollectionFilters {
  constructor() {
    this.filterForm = document.getElementById('CollectionFiltersForm');
    this.productGrid = document.querySelector('.product-grid');
    this.productWrappers = document.querySelectorAll('.product-wrapper');
    this.emptyMessage = document.querySelector('.empty-collection');
    this.filterCount = document.getElementById('filterCount');
    this.clearFiltersBtn = document.getElementById('clearFilters');
    this.priceSlider = document.getElementById('priceMax');
    this.priceCurrentLabel = document.getElementById('priceCurrentLabel');

    // Elementos para móvil
    this.filterSidebar = document.getElementById('filterSidebar');
    this.sidebarOverlay = document.getElementById('sidebarOverlay');
    this.openFiltersBtn = document.getElementById('openFilters');
    this.closeSidebarBtn = document.getElementById('closeSidebar');

    this.maxPrice = parseInt(this.priceSlider?.max) || 0;
    this.activeFilters = {
      availability: [],
      tags: [],
      priceMax: this.maxPrice
    };

    this.init();
  }

  init() {
    this.bindEvents();
    this.updateFilterCount();
    this.updatePriceLabel();
  }

  bindEvents() {
    // Filtros de disponibilidad
    const availabilityFilters = document.querySelectorAll('input[name="filter_availability"]');
    availabilityFilters.forEach(filter => {
      filter.addEventListener('change', () => this.handleAvailabilityFilter(filter));
    });

    // Filtros de tags
    const tagFilters = document.querySelectorAll('input[name="filter_tags"]');
    tagFilters.forEach(filter => {
      filter.addEventListener('change', () => this.handleTagFilter(filter));
    });

    // Slider de precio
    if (this.priceSlider) {
      this.priceSlider.addEventListener('input', () => this.handlePriceFilter());
    }

    // Limpiar filtros
    if (this.clearFiltersBtn) {
      this.clearFiltersBtn.addEventListener('click', () => this.clearAllFilters());
    }

    // Eventos de móvil
    if (this.openFiltersBtn) {
      this.openFiltersBtn.addEventListener('click', () => this.openMobileSidebar());
    }

    if (this.closeSidebarBtn) {
      this.closeSidebarBtn.addEventListener('click', () => this.closeMobileSidebar());
    }

    if (this.sidebarOverlay) {
      this.sidebarOverlay.addEventListener('click', () => this.closeMobileSidebar());
    }

    // Cerrar sidebar con ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeMobileSidebar();
      }
    });
  }

  handleAvailabilityFilter(filter) {
    if (filter.checked) {
      if (!this.activeFilters.availability.includes(filter.value)) {
        this.activeFilters.availability.push(filter.value);
      }
    } else {
      this.activeFilters.availability = this.activeFilters.availability.filter(
        value => value !== filter.value
      );
    }

    this.applyFilters();
  }

  handleTagFilter(filter) {
    if (filter.checked) {
      if (!this.activeFilters.tags.includes(filter.value)) {
        this.activeFilters.tags.push(filter.value);
      }
    } else {
      this.activeFilters.tags = this.activeFilters.tags.filter(
        value => value !== filter.value
      );
    }

    this.applyFilters();
  }

  handlePriceFilter() {
    const currentPrice = parseInt(this.priceSlider.value);
    this.activeFilters.priceMax = currentPrice;
    this.updatePriceLabel();
    this.applyFilters();
  }

  updatePriceLabel() {
    if (this.priceCurrentLabel && this.priceSlider) {
      const currentPrice = parseInt(this.priceSlider.value);
      this.priceCurrentLabel.textContent = this.formatMoney(currentPrice);
    }
  }

  formatMoney(cents) {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(cents / 100);
  }

  applyFilters() {
    if (!this.productGrid) return;

    this.productGrid.classList.add('filtering');
    let visibleCount = 0;

    setTimeout(() => {
      this.productWrappers.forEach(wrapper => {
        const isVisible = this.shouldShowProduct(wrapper);
        
        if (isVisible) {
          wrapper.style.display = 'block';
          wrapper.style.animation = 'fadeIn 0.3s ease forwards';
          visibleCount++;
        } else {
          wrapper.style.display = 'none';
        }
      });

      // Mostrar mensaje si no hay productos
      if (this.emptyMessage) {
        if (visibleCount === 0 && this.hasActiveFilters()) {
          this.emptyMessage.style.display = 'block';
        } else {
          this.emptyMessage.style.display = 'none';
        }
      }

      this.productGrid.classList.remove('filtering');
      this.updateFilterCount();
    }, 100);
  }

  shouldShowProduct(wrapper) {
    const productTags = wrapper.dataset.productTags ? 
      wrapper.dataset.productTags.split(',') : [];
    const productAvailable = wrapper.dataset.productAvailable;
    const productPrice = parseInt(wrapper.dataset.productPrice);

    // Filtrar por disponibilidad
    if (this.activeFilters.availability.length > 0) {
      if (!this.activeFilters.availability.includes(productAvailable)) {
        return false;
      }
    }

    // Filtrar por precio
    if (productPrice > this.activeFilters.priceMax) {
      return false;
    }

    // Filtrar por tags
    if (this.activeFilters.tags.length > 0) {
      const hasMatchingTag = this.activeFilters.tags.some(filterTag => 
        productTags.includes(filterTag)
      );
      if (!hasMatchingTag) {
        return false;
      }
    }

    return true;
  }

  hasActiveFilters() {
    return (
      this.activeFilters.availability.length > 0 ||
      this.activeFilters.tags.length > 0 ||
      this.activeFilters.priceMax < this.maxPrice
    );
  }

  updateFilterCount() {
    if (!this.filterCount) return;

    const count = this.activeFilters.availability.length + 
                 this.activeFilters.tags.length + 
                 (this.activeFilters.priceMax < this.maxPrice ? 1 : 0);

    this.filterCount.textContent = count;
    
    if (count > 0) {
      this.filterCount.style.display = 'flex';
    } else {
      this.filterCount.style.display = 'none';
    }
  }

  clearAllFilters() {
    // Limpiar arrays de filtros activos
    this.activeFilters.availability = [];
    this.activeFilters.tags = [];
    this.activeFilters.priceMax = this.maxPrice;

    // Desmarcar todos los checkboxes
    const allCheckboxes = this.filterForm.querySelectorAll('input[type="checkbox"]');
    allCheckboxes.forEach(checkbox => {
      checkbox.checked = false;
    });

    // Resetear slider de precio
    if (this.priceSlider) {
      this.priceSlider.value = this.maxPrice;
      this.updatePriceLabel();
    }

    // Mostrar todos los productos
    this.productWrappers.forEach(wrapper => {
      wrapper.style.display = 'block';
      wrapper.style.animation = 'fadeIn 0.3s ease forwards';
    });

    // Ocultar mensaje vacío
    if (this.emptyMessage) {
      this.emptyMessage.style.display = 'none';
    }

    this.updateFilterCount();
  }

  openMobileSidebar() {
    if (this.filterSidebar && this.sidebarOverlay) {
      this.filterSidebar.classList.add('active');
      this.sidebarOverlay.classList.add('active');
      this.sidebarOverlay.style.display = 'block';
      document.body.style.overflow = 'hidden';
    }
  }

  closeMobileSidebar() {
    if (this.filterSidebar && this.sidebarOverlay) {
      this.filterSidebar.classList.remove('active');
      this.sidebarOverlay.classList.remove('active');
      setTimeout(() => {
        this.sidebarOverlay.style.display = 'none';
      }, 300);
      document.body.style.overflow = '';
    }
  }
}

// Añadir estilos de animación
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .product-wrapper {
    transition: opacity 0.3s ease, transform 0.3s ease;
  }

  .product-grid.filtering .product-wrapper {
    opacity: 0.6;
  }
`;
document.head.appendChild(style);

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  new AllCollectionFilters();
});

// Para compatibilidad con Shopify theme inspector
if (typeof window.Shopify === 'undefined') {
  window.Shopify = {};
}

window.Shopify.AllCollectionFilters = AllCollectionFilters;
