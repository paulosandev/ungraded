/* JavaScript personalizado para el carrito lateral */

class CustomCartDrawer {
  constructor() {
    this.init();
  }

  init() {
    this.setupCartIconEvents();
    this.setupCartCountUpdates();
    this.setupHoverEffects();
    this.updateCartCount();
    this.initializeDrawer();
  }

  initializeDrawer() {
    // Asegurar que el drawer esté en el estado correcto al cargar la página
    const cartDrawer = document.querySelector('cart-drawer');
    if (cartDrawer) {
      fetch('/cart.js')
        .then(response => response.json())
        .then(cart => {
          if (cart.item_count === 0) {
            cartDrawer.classList.add('is-empty');
          } else {
            cartDrawer.classList.remove('is-empty');
          }
        })
        .catch(error => {
          console.error('Error initializing drawer:', error);
        });
    }
  }

  setupCartIconEvents() {
    const cartIcon = document.querySelector('.cart-icon-btn');
    const cartDrawer = document.querySelector('cart-drawer');
    
    if (cartIcon && cartDrawer) {
      // Abrir drawer con click
      cartIcon.addEventListener('click', (e) => {
        e.preventDefault();
        cartDrawer.open();
      });

      // Abrir drawer con hover (opcional)
      if (window.innerWidth > 768) { // Solo en desktop
        cartIcon.addEventListener('mouseenter', () => {
          this.hoverTimeout = setTimeout(() => {
            cartDrawer.open();
          }, 800); // Delay de 800ms para evitar abrir accidentalmente
        });

        cartIcon.addEventListener('mouseleave', () => {
          if (this.hoverTimeout) {
            clearTimeout(this.hoverTimeout);
          }
        });
      }
    }
  }

  setupCartCountUpdates() {
    // Escuchar cambios en el carrito
    document.addEventListener('cart:updated', () => {
      this.updateCartCount();
    });

    // Escuchar eventos de añadir al carrito
    document.addEventListener('cart:added', (event) => {
      this.updateCartCount();
      this.showCartAddedAnimation();
    });

    // Escuchar eventos de eliminación del carrito
    document.addEventListener('cart:removed', () => {
      this.updateCartCount();
    });
  }

  setupHoverEffects() {
    const cartItems = document.querySelectorAll('.cart-item');
    
    cartItems.forEach(item => {
      item.addEventListener('mouseenter', () => {
        item.style.transform = 'translateY(-2px)';
        item.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.2)';
      });

      item.addEventListener('mouseleave', () => {
        item.style.transform = 'translateY(0)';
        item.style.boxShadow = 'none';
      });
    });
  }

  updateCartCount() {
    fetch('/cart.js')
      .then(response => response.json())
      .then(cart => {
        const cartCountElement = document.querySelector('#cart-count');
        const cartCountBubble = document.querySelector('.cart-count-bubble');
        
        if (cartCountElement && cartCountBubble) {
          cartCountElement.textContent = cart.item_count;
          
          if (cart.item_count > 0) {
            cartCountBubble.style.display = 'flex';
            cartCountBubble.classList.add('animate-pulse');
            
            setTimeout(() => {
              cartCountBubble.classList.remove('animate-pulse');
            }, 1000);
          } else {
            cartCountBubble.style.display = 'none';
          }
        }

        // También actualizar el estado del drawer
        const cartDrawer = document.querySelector('cart-drawer');
        if (cartDrawer) {
          if (cart.item_count === 0) {
            cartDrawer.classList.add('is-empty');
          } else {
            cartDrawer.classList.remove('is-empty');
          }
        }
      })
      .catch(error => {
        console.error('Error updating cart count:', error);
      });
  }

  showCartAddedAnimation() {
    const cartIcon = document.querySelector('.cart-icon-btn');
    const cartDrawer = document.querySelector('cart-drawer');
    
    if (cartIcon) {
      // Animación de "bounce" en el ícono
      cartIcon.style.animation = 'bounce 0.6s ease-in-out';
      
      setTimeout(() => {
        cartIcon.style.animation = '';
      }, 600);
    }

    // Abrir drawer automáticamente después de añadir producto
    if (cartDrawer) {
      setTimeout(() => {
        cartDrawer.open();
      }, 300);
    }
  }

  // Función para añadir producto al carrito
  static addToCart(formData) {
    return fetch('/cart/add.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
      // Actualizar el drawer con el contenido más reciente
      this.refreshDrawerContent();
      
      // Disparar evento personalizado
      document.dispatchEvent(new CustomEvent('cart:added', {
        detail: data
      }));
      
      return data;
    })
    .catch(error => {
      console.error('Error adding to cart:', error);
      throw error;
    });
  }

  // Función para refrescar el contenido del drawer
  static refreshDrawerContent() {
    const sections = 'cart-drawer,cart-icon-bubble';
    
    return fetch(`${window.location.pathname}?sections=${sections}`)
      .then(response => response.json())
      .then(data => {
        const cartDrawer = document.querySelector('cart-drawer');
        if (cartDrawer && data['cart-drawer']) {
          // Actualizar el contenido del drawer
          const drawerInner = cartDrawer.querySelector('.drawer__inner');
          if (drawerInner) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = data['cart-drawer'];
            const newContent = tempDiv.querySelector('.drawer__inner');
            if (newContent) {
              drawerInner.innerHTML = newContent.innerHTML;
            }
          }

          // Actualizar el estado del carrito (vacío o con productos)
          const cartItems = cartDrawer.querySelectorAll('.cart-item');
          if (cartItems.length === 0) {
            cartDrawer.classList.add('is-empty');
          } else {
            cartDrawer.classList.remove('is-empty');
          }
        }

        // Actualizar el ícono del carrito
        if (data['cart-icon-bubble']) {
          const cartIcon = document.querySelector('.cart-icon-btn');
          if (cartIcon) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = data['cart-icon-bubble'];
            const cartCount = tempDiv.querySelector('.cart-count-bubble');
            const currentCartCount = cartIcon.querySelector('.cart-count-bubble');
            if (cartCount && currentCartCount) {
              currentCartCount.outerHTML = cartCount.outerHTML;
            }
          }
        }
      })
      .catch(error => {
        console.error('Error refreshing drawer content:', error);
      });
  }

  // Función para actualizar cantidad en el carrito
  static updateCartItem(itemId, quantity) {
    return fetch('/cart/update.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        updates: {
          [itemId]: quantity
        }
      })
    })
    .then(response => response.json())
    .then(data => {
      // Actualizar el drawer con el contenido más reciente
      this.refreshDrawerContent();
      
      // Disparar evento personalizado
      document.dispatchEvent(new CustomEvent('cart:updated', {
        detail: data
      }));
      
      return data;
    })
    .catch(error => {
      console.error('Error updating cart:', error);
      throw error;
    });
  }

  // Función para eliminar producto del carrito
  static removeFromCart(itemId) {
    return this.updateCartItem(itemId, 0);
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.customCartDrawerInstance = new CustomCartDrawer();
});

// Agregar estilos de animación dinámicamente
const style = document.createElement('style');
style.textContent = `
  @keyframes bounce {
    0%, 20%, 60%, 100% {
      transform: translateY(0);
    }
    40% {
      transform: translateY(-10px);
    }
    80% {
      transform: translateY(-5px);
    }
  }
  
  @keyframes pulse {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
    100% {
      transform: scale(1);
    }
  }
  
  .animate-pulse {
    animation: pulse 0.5s ease-in-out;
  }
  
  .cart-item-enter {
    opacity: 0;
    transform: translateY(20px);
    animation: fadeInUp 0.3s ease-out forwards;
  }
  
  @keyframes fadeInUp {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .cart-item-remove {
    opacity: 1;
    transform: translateY(0);
    animation: fadeOutDown 0.3s ease-out forwards;
  }
  
  @keyframes fadeOutDown {
    to {
      opacity: 0;
      transform: translateY(-20px);
    }
  }
`;
document.head.appendChild(style);

// Interceptar formularios de añadir al carrito
document.addEventListener('submit', (e) => {
  if (e.target.matches('form[action*="/cart/add"]')) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    // Usar fetch con FormData directamente
    fetch('/cart/add.js', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      // Actualizar el drawer después de añadir el producto
      CustomCartDrawer.refreshDrawerContent().then(() => {
        // Disparar evento personalizado
        document.dispatchEvent(new CustomEvent('cart:added', {
          detail: data
        }));
        
        // Actualizar el contador del carrito
        if (window.customCartDrawerInstance) {
          window.customCartDrawerInstance.updateCartCount();
        }
      });
      
      console.log('Producto añadido al carrito:', data);
    })
    .catch(error => {
      console.error('Error al añadir producto:', error);
      // Mostrar mensaje de error al usuario
      alert('Error al añadir el producto al carrito. Por favor, inténtalo de nuevo.');
    });
  }
});

// Exportar para uso global
window.CustomCartDrawer = CustomCartDrawer; 