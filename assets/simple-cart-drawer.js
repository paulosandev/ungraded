/* JavaScript simplificado para el carrito drawer */

// Check if unified cart system is active - if so, disable this script
if (window.UNIFIED_CART_ACTIVE) {
  console.log('🚫 Simple cart drawer disabled - unified system active');
  return;
}

document.addEventListener('DOMContentLoaded', function() {
  // Función para actualizar el contador del carrito usando el nuevo sistema
  function updateCartCount() {
    // Usar el nuevo CartCounterManager si está disponible
    if (window.cartCounterManager) {
      window.cartCounterManager.updateCounter();
    } else {
      // Fallback al sistema anterior si el manager no está disponible
      fetch('/cart.js')
        .then(response => response.json())
        .then(cart => {
          const cartCountElement = document.querySelector('#cart-count');
          const cartCountBubble = document.querySelector('.cart-count-bubble');
          
          if (cartCountElement && cartCountBubble) {
            cartCountElement.textContent = cart.item_count;
            
            if (cart.item_count > 0) {
              cartCountBubble.style.display = 'flex';
            } else {
              cartCountBubble.style.display = 'none';
            }
          }
        })
        .catch(error => {
          console.error('Error updating cart count:', error);
        });
    }
  }

  // Función para refrescar el contenido del drawer
  function refreshDrawerContent() {
    const sections = 'cart-drawer,cart-icon-bubble';
    
    return fetch(`${window.location.pathname}?sections=${sections}`)
      .then(response => response.json())
      .then(data => {
        const cartDrawer = document.querySelector('cart-drawer');
        
        if (cartDrawer && data['cart-drawer']) {
          // Actualizar el contenido del drawer
          const parser = new DOMParser();
          const newDrawerDoc = parser.parseFromString(data['cart-drawer'], 'text/html');
          const newDrawerContent = newDrawerDoc.querySelector('.drawer__inner');
          
          if (newDrawerContent) {
            const currentDrawerContent = cartDrawer.querySelector('.drawer__inner');
            if (currentDrawerContent) {
              currentDrawerContent.innerHTML = newDrawerContent.innerHTML;
            }
          }

          // Actualizar el estado del carrito
          fetch('/cart.js')
            .then(response => response.json())
            .then(cart => {
              if (cart.item_count === 0) {
                cartDrawer.classList.add('is-empty');
              } else {
                cartDrawer.classList.remove('is-empty');
              }
              
              // Actualizar el subtotal en el header
              updateSubtotal(cart.total_price);
              
              // Disparar evento personalizado para que el CartCounterManager actualice
              document.dispatchEvent(new CustomEvent('cart:drawer-updated', { detail: cart }));
            })
            .catch(error => {
              console.error('Error fetching cart data:', error);
            });
        }

        // Actualizar el contador del carrito
        updateCartCount();
      })
      .catch(error => {
        console.error('Error refreshing drawer content:', error);
      });
  }

  // Función para actualizar el subtotal
  function updateSubtotal(totalPrice) {
    const subtotalElement = document.querySelector('.cart-subtotal');
    if (subtotalElement) {
      // Formatear el precio (esto es una aproximación, idealmente usarías Shopify.formatMoney)
      const formattedPrice = new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
      }).format(totalPrice / 100);
      
      subtotalElement.textContent = formattedPrice;
    }
  }

  // Configurar eventos del botón del carrito
  const cartIcon = document.querySelector('.cart-icon-btn');
  const cartDrawer = document.querySelector('cart-drawer');
  
  if (cartIcon && cartDrawer) {
    cartIcon.addEventListener('click', function(e) {
      e.preventDefault();
      cartDrawer.open();
    });
  }

  // Interceptar formularios de añadir al carrito
  document.addEventListener('submit', function(e) {
    if (e.target.matches('form[action*="/cart/add"]')) {
      e.preventDefault();
      
      const formData = new FormData(e.target);
      
      // Añadir producto al carrito
      fetch('/cart/add.js', {
        method: 'POST',
        body: formData
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Product added to cart:', data);
        
        // Refrescar el contenido del drawer
        refreshDrawerContent().then(() => {
          // Abrir el drawer después de añadir el producto
          if (cartDrawer) {
            cartDrawer.open();
          }
          
          // Mostrar notificación
          showNotification(`${data.product_title} añadido al carrito`, 'success');
          
          // Disparar evento personalizado
          document.dispatchEvent(new CustomEvent('cart:add', { detail: data }));
        });
      })
      .catch(error => {
        console.error('Error al añadir producto:', error);
        showNotification('Error al añadir el producto al carrito', 'error');
      });
    }
  });

  // Función para mostrar notificaciones
  function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `cart-notification cart-notification--${type}`;
    notification.innerHTML = `
      <div class="cart-notification__content">
        <span class="cart-notification__icon">${type === 'success' ? '✓' : '⚠'}</span>
        <span class="cart-notification__message">${message}</span>
      </div>
    `;
    
    // Aplicar estilos
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#4CAF50' : '#f44336'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      z-index: 10002;
      transform: translateX(100%);
      opacity: 0;
      transition: all 0.3s ease;
      font-family: 'Poppins', sans-serif;
      font-size: 14px;
      font-weight: 500;
    `;
    
    document.body.appendChild(notification);
    
    // Mostrar notificación
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
      notification.style.opacity = '1';
    }, 100);
    
    // Ocultar notificación después de 3 segundos
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      notification.style.opacity = '0';
      setTimeout(() => {
        if (notification.parentNode) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  // Mejorar el sistema de eventos para la eliminación de productos
  document.addEventListener('click', function(e) {
    // Solo interceptar si no hay custom cart drawer enhancer activo
    if (window.cartDrawerEnhancer) {
      return; // Dejar que custom-cart-drawer.js maneje los clicks
    }
    
    // Interceptar clicks en botones de eliminar/quantity
    if (e.target.matches('button[name="minus"]') || e.target.closest('button[name="minus"]')) {
      const button = e.target.closest('button[name="minus"]');
      const quantityInput = button.closest('quantity-input');
      const input = quantityInput ? quantityInput.querySelector('input[name="updates[]"]') : null;
      
      if (input) {
        const currentValue = parseInt(input.value) || 0;
        console.log('Minus button clicked, current value:', currentValue);
        
        // Actualizar contador después de un breve delay si la cantidad será 0
        if (currentValue === 1) {
          setTimeout(() => {
            console.log('Product will be removed, forcing counter update');
            updateCartCount();
          }, 300);
        }
      }
    }
  });

  // Mejorar el sistema de eventos para cambios en quantity inputs
  document.addEventListener('change', function(e) {
    // Solo interceptar si no hay custom cart drawer enhancer activo
    if (window.cartDrawerEnhancer) {
      return; // Dejar que custom-cart-drawer.js maneje los cambios
    }
    
    if (e.target.matches('input[name="updates[]"]')) {
      const input = e.target;
      const newValue = parseInt(input.value) || 0;
      console.log('Quantity input changed:', newValue);
      
      // Actualizar contador después de un breve delay
      setTimeout(() => {
        updateCartCount();
      }, 200);
    }
  });

  // Escuchar eventos del contador para mejor debugging
  document.addEventListener('cart:counter-updated', function(e) {
    console.log('Cart counter updated via event:', e.detail.itemCount);
  });

  // Escuchar eventos de eliminación de productos
  document.addEventListener('cart:remove', function(e) {
    console.log('Product removed from cart:', e.detail);
    showNotification('Producto eliminado del carrito', 'info');
  });

  // Escuchar eventos de adición de productos
  document.addEventListener('cart:add', function(e) {
    console.log('Product added to cart:', e.detail);
  });

  // Escuchar eventos de actualización del drawer
  document.addEventListener('cart:drawer-updated', function(e) {
    console.log('Cart drawer updated:', e.detail);
  });

  // Inicializar el contador del carrito
  updateCartCount();
  
  // Verificar periódicamente el estado del carrito
  setInterval(() => {
    const cartDrawer = document.querySelector('cart-drawer');
    if (cartDrawer && !cartDrawer.classList.contains('is-empty')) {
      // Solo actualizar si el drawer no está vacío
      updateCartCount();
    }
  }, 5000); // Cada 5 segundos
}); 