/**
 * Collection Filters JavaScript
 * Maneja el filtrado interactivo de productos en las páginas de colección
 */

document.addEventListener('DOMContentLoaded', () => {
  const filterForm = document.querySelector('#CollectionFiltersForm');
  if (!filterForm) return;

  const productGrid = document.querySelector('.preventas-grid');
  if (!productGrid) return;

  const products = Array.from(productGrid.querySelectorAll('.product-wrapper'));
  const clearButton = document.querySelector('#clearFilters');
  const openFiltersButton = document.querySelector('#openFilters');
  const closeFiltersButton = document.querySelector('#closeSidebar');
  const sidebar = document.querySelector('#filterSidebar');
  const overlay = document.querySelector('#sidebarOverlay');
  const filterCount = document.querySelector('#filterCount');

  function applyFilters() {
    const selectedTags = Array.from(filterForm.querySelectorAll('input[name="filter_tags"]:checked')).map(
      (input) => input.value
    );
    const selectedDates = Array.from(filterForm.querySelectorAll('input[name="filter_date"]:checked')).map(
      (input) => input.value
    );

    const selectedAvailability = Array.from(
      filterForm.querySelectorAll('input[name="filter_availability"]:checked')
    ).map((input) => input.value);

    const selectedPrices = Array.from(filterForm.querySelectorAll('input[name="filter_price"]:checked')).map(
      (input) => input.value
    );

    let productsShown = 0;

    products.forEach((product) => {
      const productTags = (product.dataset.productTags || '').split(',').filter(Boolean);
      const productDate = product.dataset.fecha || '';

      const productAvailable = product.dataset.productAvailable || '';
      const productPrice = parseFloat(product.dataset.productPrice);

      const tagsMatch = selectedTags.every((tag) => productTags.includes(tag));
      const dateMatch = selectedDates.length === 0 || selectedDates.includes(productDate);

      const availabilityMatch = selectedAvailability.length === 0 || selectedAvailability.includes(productAvailable);

      const priceMatch =
        selectedPrices.length === 0 ||
        selectedPrices.some((range) => {
          const [min, max] = range.split('-').map(Number);
          if (Number.isNaN(productPrice)) return false;
          return productPrice >= min && productPrice <= max;
        });

      if (tagsMatch && dateMatch && availabilityMatch && priceMatch) {
        product.style.display = 'contents';
        productsShown++;
      } else {
        product.style.display = 'none';
      }
    });

    const emptyState = productGrid.querySelector('.empty-collection');
    if (emptyState) {
      emptyState.style.display = productsShown > 0 ? 'none' : 'block';
    }

    updateFilterCount(selectedTags.length + selectedDates.length + selectedAvailability.length + selectedPrices.length);
  }

  function clearFilters() {
    filterForm.reset();
    applyFilters();
  }

  function updateFilterCount(count) {
    if (!filterCount) return;
    filterCount.textContent = count;
    filterCount.style.display = count > 0 ? 'flex' : 'none';
  }

  function setupEventListeners() {
    if (clearButton) {
      clearButton.addEventListener('click', (e) => {
        e.preventDefault();
        clearFilters();
      });
    }

    const checkboxes = filterForm.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((checkbox) => {
      checkbox.addEventListener('change', () => {
        applyFilters();
      });
    });

    if (openFiltersButton) {
      openFiltersButton.addEventListener('click', () => {
        sidebar.classList.add('active');
        overlay.classList.add('active');
      });
    }

    if (closeFiltersButton) {
      closeFiltersButton.addEventListener('click', closeSidebar);
    }

    if (overlay) {
      overlay.addEventListener('click', closeSidebar);
    }
  }

  function closeSidebar() {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
  }

  // Inicializar estado
  applyFilters();
  setupEventListeners();
});
