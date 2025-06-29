// Script de filtrado para la colección de Accesorios
// Filtros: tags (tipo accesorio), disponibilidad y precio máximo

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

  const priceMaxInput = document.getElementById('priceMax');
  const priceMinLabel = document.getElementById('priceMinLabel');
  const priceMaxLabel = document.getElementById('priceMaxLabel');
  const priceCurrentLabel = document.getElementById('priceCurrentLabel');

  const defaultMinPrice = 0;
  const defaultMaxPrice = priceMaxInput ? parseFloat(priceMaxInput.max) : Infinity;

  function applyFilters() {
    const selectedTags = Array.from(filterForm.querySelectorAll('input[name="filter_tags"]:checked')).map(
      (i) => i.value
    );
    const selectedAvailability = Array.from(
      filterForm.querySelectorAll('input[name="filter_availability"]:checked')
    ).map((i) => i.value);
    const priceMax = priceMaxInput ? parseFloat(priceMaxInput.value) : defaultMaxPrice;

    let shown = 0;
    products.forEach((product) => {
      const productTags = (product.dataset.productTags || '').split(',');
      const avail = product.dataset.productAvailable;
      const price = parseFloat(product.dataset.productPrice);

      const tagsOk = selectedTags.length === 0 || selectedTags.every((t) => productTags.includes(t));
      const availOk = selectedAvailability.length === 0 || selectedAvailability.includes(avail);
      const priceOk = price >= defaultMinPrice && price <= priceMax;

      if (tagsOk && availOk && priceOk) {
        product.style.display = 'contents';
        shown++;
      } else {
        product.style.display = 'none';
      }
    });

    if (emptyState) emptyState.style.display = shown > 0 ? 'none' : 'block';
    updateFilterCount(selectedTags.length + selectedAvailability.length + (priceMax !== defaultMaxPrice ? 1 : 0));
  }

  function clearFilters() {
    filterForm.reset();
    if (priceMaxInput) priceMaxInput.value = defaultMaxPrice;
    updateLabels();
    applyFilters();
  }

  function updateFilterCount(c) {
    if (!filterCount) return;
    filterCount.textContent = c;
    filterCount.style.display = c > 0 ? 'flex' : 'none';
  }

  function updateLabels() {
    if (!priceMinLabel || !priceMaxLabel || !priceMaxInput || !priceCurrentLabel) return;
    const fmt = (v) => '$' + (v / 100).toLocaleString('es-MX', { minimumFractionDigits: 0 });
    priceMinLabel.textContent = fmt(defaultMinPrice);
    priceMaxLabel.textContent = fmt(defaultMaxPrice);
    priceCurrentLabel.textContent = fmt(priceMaxInput.value);
  }

  function closeSidebar() {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
  }

  function setupListeners() {
    filterForm.querySelectorAll('input[type="checkbox"]').forEach((cb) => cb.addEventListener('change', applyFilters));
    if (priceMaxInput)
      priceMaxInput.addEventListener('input', () => {
        updateLabels();
        applyFilters();
      });
    if (clearButton)
      clearButton.addEventListener('click', (e) => {
        e.preventDefault();
        clearFilters();
      });
    if (openFiltersButton)
      openFiltersButton.addEventListener('click', () => {
        sidebar.classList.add('active');
        overlay.classList.add('active');
      });
    if (closeFiltersButton) closeFiltersButton.addEventListener('click', closeSidebar);
    if (overlay) overlay.addEventListener('click', closeSidebar);
  }

  applyFilters();
  updateLabels();
  setupListeners();
});
