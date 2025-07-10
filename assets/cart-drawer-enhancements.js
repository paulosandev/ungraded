/* Mejoras adicionales para el carrito lateral */

document.addEventListener('DOMContentLoaded', function() {
  // Agregar mensaje personalizado cuando el carrito está vacío
  function addEmptyCartMessage() {
    const cartDrawer = document.querySelector('cart-drawer');
    if (cartDrawer && cartDrawer.classList.contains('is-empty')) {
      const drawerInner = cartDrawer.querySelector('.drawer__inner');
      if (drawerInner && !drawerInner.querySelector('.custom-empty-message')) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'custom-empty-message';
        emptyMessage.innerHTML = `
          <div class="empty-cart-icon">🛒</div>
          <h3 class="empty-cart-title">Tu carrito está vacío</h3>
          <p class="empty-cart-message">¡Descubre nuestros increíbles productos y añade algunos a tu carrito!</p>
          <a href="/collections/all" class="continue-shopping-btn">Continuar comprando</a>
        `;
        drawerInner.appendChild(emptyMessage);
      }
    }
  }

  // Agregar animaciones suaves a los elementos del carrito
  function addCartAnimations() {
    const cartItems = document.querySelectorAll('.cart-item');
    cartItems.forEach((item, index) => {
      item.style.animationDelay = `${index * 0.1}s`;
      item.classList.add('cart-item-enter');
    });
  }

  // Mejorar la experiencia del botón de checkout
  function enhanceCheckoutButton() {
    const checkoutBtn = document.querySelector('#CartDrawer-Checkout');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', function() {
        this.innerHTML = '<span class="checkout-loading">Procesando...</span>';
        this.disabled = true;
        
        // Simular un pequeño delay para mejorar la percepción
        setTimeout(() => {
          this.form.submit();
        }, 500);
      });
    }
  }

  // Añadir efectos de hover personalizados
  function addHoverEffects() {
    const cartIcon = document.querySelector('.cart-icon-btn');
    if (cartIcon) {
      cartIcon.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.1) rotate(5deg)';
      });
      
      cartIcon.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1) rotate(0deg)';
      });
    }
  }

  // Funcionalidad para mostrar toast notifications
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `cart-toast cart-toast--${type}`;
    toast.innerHTML = `
      <div class="cart-toast__content">
        <span class="cart-toast__icon">${type === 'success' ? '✓' : '⚠'}</span>
        <span class="cart-toast__message">${message}</span>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    // Mostrar toast
    setTimeout(() => {
      toast.classList.add('cart-toast--visible');
    }, 100);
    
    // Ocultar toast después de 3 segundos
    setTimeout(() => {
      toast.classList.remove('cart-toast--visible');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }

  // Escuchar eventos del carrito para mostrar notificaciones
  document.addEventListener('cart:added', function(event) {
    const productTitle = event.detail.product_title || 'Producto';
    showToast(`${productTitle} añadido al carrito`, 'success');
  });

  document.addEventListener('cart:removed', function(event) {
    showToast('Producto eliminado del carrito', 'info');
  });

  // Inicializar todas las mejoras
  addEmptyCartMessage();
  addCartAnimations();
  enhanceCheckoutButton();
  addHoverEffects();

  // Observar cambios en el carrito
  const cartDrawer = document.querySelector('cart-drawer');
  if (cartDrawer) {
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList' || mutation.type === 'attributes') {
          addEmptyCartMessage();
          addCartAnimations();
          enhanceCheckoutButton();
        }
      });
    });

    observer.observe(cartDrawer, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });
  }
});

// Estilos adicionales para las mejoras
const additionalStyles = `
  .custom-empty-message {
    text-align: center;
    padding: 40px 20px;
    color: white;
  }

  .empty-cart-icon {
    font-size: 4rem;
    margin-bottom: 20px;
    opacity: 0.7;
  }

  .empty-cart-title {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 15px;
    color: white;
  }

  .empty-cart-message {
    font-size: 1rem;
    margin-bottom: 30px;
    opacity: 0.8;
    line-height: 1.5;
  }

  .continue-shopping-btn {
    display: inline-block;
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 8px;
    padding: 12px 24px;
    color: white;
    text-decoration: none;
    transition: all 0.3s ease;
    font-weight: 500;
  }

  .continue-shopping-btn:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
    text-decoration: none;
    color: white;
  }

  .cart-toast {
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    z-index: 10000;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    min-width: 300px;
  }

  .cart-toast--visible {
    transform: translateX(0);
  }

  .cart-toast__content {
    display: flex;
    align-items: center;
    padding: 16px 20px;
    gap: 12px;
  }

  .cart-toast__icon {
    font-size: 1.2rem;
    color: #10b981;
  }

  .cart-toast--info .cart-toast__icon {
    color: #3b82f6;
  }

  .cart-toast__message {
    font-size: 0.9rem;
    color: #374151;
    font-weight: 500;
  }

  .checkout-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .checkout-loading::after {
    content: '';
    width: 16px;
    height: 16px;
    border: 2px solid rgba(0, 0, 0, 0.3);
    border-radius: 50%;
    border-top-color: #000;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .cart-icon-btn {
    transition: transform 0.2s ease;
  }

  @media (max-width: 768px) {
    .cart-toast {
      right: 10px;
      left: 10px;
      min-width: auto;
    }
  }
`;

// Agregar estilos al documento
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet); 