// Ajustador automático del subtotal del carrito
document.addEventListener('DOMContentLoaded', function() {
  function adjustSubtotalSize() {
    const subtotalElement = document.querySelector('.cart-drawer .cart-subtotal');
    if (subtotalElement) {
      const textLength = subtotalElement.textContent.length;
      
      // Ajustar escala basado en la longitud del texto para formato vertical
      if (textLength > 18) {
        subtotalElement.style.transform = 'scale(0.75)';
      } else if (textLength > 15) {
        subtotalElement.style.transform = 'scale(0.8)';
      } else if (textLength > 12) {
        subtotalElement.style.transform = 'scale(0.9)';
      } else {
        subtotalElement.style.transform = 'scale(1)';
      }
    }
  }
  
  // Observar cambios en el carrito para ajustar automáticamente
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList' || mutation.type === 'characterData') {
        setTimeout(adjustSubtotalSize, 100); // Pequeño delay para asegurar que el DOM se actualizó
      }
    });
  });
  
  const cartDrawer = document.querySelector('.cart-drawer');
  if (cartDrawer) {
    observer.observe(cartDrawer, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }
  
  // Ajustar al cargar la página
  adjustSubtotalSize();
  
  // Ajustar cuando se abra el drawer
  document.addEventListener('cart:open', adjustSubtotalSize);
  
  // Ajustar cuando se actualice el carrito
  document.addEventListener('cart:updated', adjustSubtotalSize);
}); 