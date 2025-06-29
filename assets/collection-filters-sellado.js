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
  const emptyState = productGrid.querySelector('.empty-collection');

  // Solo un slider para precio máximo
  const priceMaxInput = document.getElementById('priceMax');
  const priceMinLabel = document.getElementById('priceMinLabel');
  const priceMaxLabel = document.getElementById('priceMaxLabel');
  const priceCurrentLabel = document.getElementById('priceCurrentLabel');

  const defaultMinPrice = 0;
  const defaultMaxPrice = priceMaxInput ? parseFloat(priceMaxInput.max) : Infinity;

  function applyFilters() {
    const selectedTags = Array.from(filterForm.querySelectorAll('input[name="filter_tags"]:checked')).map(
      (input) => input.value
    );
    const selectedAvailability = Array.from(
      filterForm.querySelectorAll('input[name="filter_availability"]:checked')
    ).map((input) => input.value);

    // Valor actual del slider como precio máximo
    const priceMin = defaultMinPrice;
    const priceMax = priceMaxInput ? parseFloat(priceMaxInput.value) : defaultMaxPrice;

    let productsShown = 0;

    products.forEach((product) => {
      const productTags = product.dataset.productTags.split(',');
      const productAvailable = product.dataset.productAvailable;
      const productPrice = parseFloat(product.dataset.productPrice);

      const tagsMatch = selectedTags.length === 0 || selectedTags.every((tag) => productTags.includes(tag));

      const availabilityMatch = selectedAvailability.length === 0 || selectedAvailability.includes(productAvailable);

      // NUEVO: coincidencia con rango de precio
      const priceMatch = productPrice >= priceMin && productPrice <= priceMax;

      if (tagsMatch && availabilityMatch && priceMatch) {
        product.style.display = 'contents';
        productsShown++;
      } else {
        product.style.display = 'none';
      }
    });

    if (emptyState) {
      emptyState.style.display = productsShown > 0 ? 'none' : 'block';
    }

    updateFilterCount(selectedTags.length + selectedAvailability.length + (priceMax !== defaultMaxPrice ? 1 : 0));
  }

  function clearFilters() {
    filterForm.reset();

    // Restablecer slider de precio
    if (priceMaxInput) priceMaxInput.value = defaultMaxPrice;
    updatePriceLabels();

    applyFilters();
  }

  function updateFilterCount(count) {
    if (!filterCount) return;
    filterCount.textContent = count;
    filterCount.style.display = count > 0 ? 'flex' : 'none';
  }

  function setupEventListeners() {
    const checkboxes = filterForm.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((checkbox) => {
      checkbox.addEventListener('change', applyFilters);
    });

    if (priceMaxInput) {
      const handleRangeChange = () => {
        updatePriceLabels();
        applyFilters();
      };
      priceMaxInput.addEventListener('input', handleRangeChange);
    }

    if (clearButton) {
      clearButton.addEventListener('click', (e) => {
        e.preventDefault();
        clearFilters();
      });
    }

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

  // NUEVO: mostrar valores actuales de rango
  function updatePriceLabels() {
    if (!priceMinLabel || !priceMaxLabel || !priceMaxInput || !priceCurrentLabel) return;
    const format = (val) => {
      return '$' + (val / 100).toLocaleString('es-MX', { minimumFractionDigits: 0 });
    };
    priceMinLabel.textContent = format(defaultMinPrice);
    priceMaxLabel.textContent = format(defaultMaxPrice);
    priceCurrentLabel.textContent = format(priceMaxInput.value);
  }

  applyFilters();
  updatePriceLabels();
  setupEventListeners();
});
