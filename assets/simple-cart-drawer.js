/* JavaScript simplificado para el carrito drawer */

document.addEventListener('DOMContentLoaded', function() {
  // Función para actualizar el contador del carrito
  function updateCartCount() {
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
      .then(response => response.json())
      .then(data => {
        // Refrescar el contenido del drawer
        refreshDrawerContent().then(() => {
          // Abrir el drawer después de añadir el producto
          if (cartDrawer) {
            cartDrawer.open();
          }
          
          // Mostrar notificación
          showNotification(`${data.product_title} añadido al carrito`, 'success');
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
    
    document.body.appendChild(notification);
    
    // Mostrar notificación
    setTimeout(() => {
      notification.classList.add('cart-notification--visible');
    }, 100);
    
    // Ocultar notificación después de 3 segundos
    setTimeout(() => {
      notification.classList.remove('cart-notification--visible');
      setTimeout(() => {
        if (notification.parentNode) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  // Inicializar el contador del carrito
  updateCartCount();
});

// Estilos para las notificaciones
const notificationStyles = `
  .cart-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    min-width: 320px;
    max-width: 400px;
  }

  .cart-notification--visible {
    transform: translateX(0);
  }

  .cart-notification__content {
    display: flex;
    align-items: center;
    padding: 16px 20px;
    gap: 12px;
  }

  .cart-notification__icon {
    font-size: 1.2rem;
    color: #10b981;
    font-weight: bold;
  }

  .cart-notification--error .cart-notification__icon {
    color: #ef4444;
  }

  .cart-notification__message {
    font-size: 0.9rem;
    color: #374151;
    font-weight: 500;
    flex: 1;
  }

  @media (max-width: 768px) {
    .cart-notification {
      right: 10px;
      left: 10px;
      min-width: auto;
      max-width: none;
    }
  }
`;

// Agregar estilos al documento
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet); 