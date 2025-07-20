// Mejorar la funcionalidad del cart drawer personalizado

// Check if unified cart system is active - if so, disable this script
if (window.UNIFIED_CART_ACTIVE) {
  console.log('🚫 Custom cart drawer disabled - unified system active');
  // Export empty objects to prevent errors
  window.cartCounterManager = { updateCounter: () => {}, forceUpdate: () => {} };
  window.cartDesignPreserver = { ensureCustomDesign: () => {} };
  window.productStockValidator = { validateProductStock: () => true };
  window.cartDrawerEnhancer = { enhance: () => {}, clearCartErrors: () => {}, enhanceQuantityInputs: () => {} };
} else {

// Clase para manejar el contador del carrito de forma robusta
class CartCounterManager {
  constructor() {
    this.isUpdating = false;
    this.updateQueue = [];
    this.init();
  }

  init() {
    // Suscribirse a todos los eventos relevantes del carrito
    this.subscribeToCartEvents();
    
    // Actualizar contador inicialmente
    this.updateCounter();
    
    // Verificar periódicamente el estado del contador
    this.startPeriodicCheck();
  }

  subscribeToCartEvents() {
    // Eventos del sistema PUB/SUB de Shopify
    if (window.subscribe && window.PUB_SUB_EVENTS) {
      window.subscribe(PUB_SUB_EVENTS.cartUpdate, () => {
        this.updateCounter();
      });
    }

    // Eventos personalizados del carrito
    document.addEventListener('cart:update', () => this.updateCounter());
    document.addEventListener('cart:add', () => this.updateCounter());
    document.addEventListener('cart:remove', () => this.updateCounter());
    document.addEventListener('cart:clear', () => this.updateCounter());
    document.addEventListener('cart:change', () => this.updateCounter());

    // Interceptar formularios de quantity updates
    document.addEventListener('submit', (e) => {
      if (e.target.matches('form[action*="/cart/change"]') || 
          e.target.matches('form[action*="/cart/update"]')) {
        // Actualizar después de un breve delay para permitir que el servidor procese
        setTimeout(() => this.updateCounter(), 200);
      }
    });

    // Monitorear cambios en inputs de cantidad
    document.addEventListener('change', (e) => {
      if (e.target.matches('input[name="updates[]"]') || 
          e.target.matches('input[data-quantity-variant-id]')) {
        setTimeout(() => this.updateCounter(), 100);
      }
    });

    // Monitorear clicks en botones de quantity
    document.addEventListener('click', (e) => {
      if (e.target.matches('button[name="plus"]') || 
          e.target.matches('button[name="minus"]') ||
          e.target.closest('.quantity__button')) {
        setTimeout(() => this.updateCounter(), 100);
      }
    });
  }

  updateCounter() {
    // Evitar múltiples actualizaciones simultáneas
    if (this.isUpdating) {
      this.updateQueue.push(Date.now());
      return;
    }

    this.isUpdating = true;

    fetch('/cart.js')
      .then(response => response.json())
      .then(cart => {
        this.updateAllCounterElements(cart);
        this.isUpdating = false;
        
        // Procesar queue si hay actualizaciones pendientes
        if (this.updateQueue.length > 0) {
          this.updateQueue = [];
          setTimeout(() => this.updateCounter(), 50);
        }
      })
      .catch(error => {
        console.error('Error actualizando contador del carrito:', error);
        this.isUpdating = false;
        
        // Reintentar después de un error
        setTimeout(() => this.updateCounter(), 500);
      });
  }

  updateAllCounterElements(cart) {
    const itemCount = cart.item_count || 0;
    
    // Actualizar todos los elementos del contador
    const counterSelectors = [
      '#cart-count',
      '.cart-count-bubble span[aria-hidden]',
      '.cart-count-bubble span:not(.visually-hidden)',
      '[data-cart-count]'
    ];

    counterSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        if (element && element.textContent !== itemCount.toString()) {
          element.textContent = itemCount;
        }
      });
    });

    // Actualizar visibilidad de las burbujas del contador
    const bubbles = document.querySelectorAll('.cart-count-bubble');
    bubbles.forEach(bubble => {
      if (itemCount > 0) {
        bubble.style.display = 'flex';
        bubble.style.visibility = 'visible';
        bubble.style.opacity = '1';
      } else {
        bubble.style.display = 'none';
        bubble.style.visibility = 'hidden';
        bubble.style.opacity = '0';
      }
    });

    // Actualizar iconos del carrito (lleno vs vacío)
    const cartIcons = document.querySelectorAll('.cart-icon-btn, .header__icon--cart');
    cartIcons.forEach(icon => {
      const svgWrapper = icon.querySelector('.svg-wrapper');
      if (svgWrapper) {
        if (itemCount > 0) {
          icon.classList.add('has-items');
        } else {
          icon.classList.remove('has-items');
        }
      }
    });

    // Disparar evento personalizado para otros scripts
    const updateEvent = new CustomEvent('cart:counter-updated', {
      detail: { itemCount: itemCount, cart: cart }
    });
    document.dispatchEvent(updateEvent);
  }

  startPeriodicCheck() {
    // Verificar cada 10 segundos que el contador esté sincronizado
    setInterval(() => {
      if (!this.isUpdating) {
        this.updateCounter();
      }
    }, 10000);
  }

  // Método para forzar actualización inmediata
  forceUpdate() {
    this.isUpdating = false;
    this.updateCounter();
  }
}

// Clase para asegurar que el diseño personalizado se mantenga
class CartDesignPreserver {
  constructor() {
    this.init();
  }

  init() {
    // Observar cambios en el DOM para reinicializar controles cuando sea necesario
    this.observeCartChanges();
    
    // Asegurar que el diseño personalizado se mantenga después de actualizaciones
    this.ensureCustomDesign();
  }

  observeCartChanges() {
    const cartDrawer = document.querySelector('cart-drawer');
    if (!cartDrawer) return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Reinicializar controles personalizados después de actualizaciones
          setTimeout(() => {
            this.ensureCustomDesign();
            if (window.cartDrawerEnhancer) {
              window.cartDrawerEnhancer.enhanceQuantityInputs(cartDrawer);
            }
          }, 100);
        }
      });
    });

    observer.observe(cartDrawer, {
      childList: true,
      subtree: true
    });
  }

  ensureCustomDesign() {
    const cartDrawer = document.querySelector('cart-drawer');
    if (!cartDrawer) return;

    // Asegurar que la clase cart-drawer esté aplicada
    if (!cartDrawer.classList.contains('cart-drawer')) {
      cartDrawer.classList.add('cart-drawer');
    }

    // Verificar que el CSS personalizado se esté aplicando
    const drawerInner = cartDrawer.querySelector('.drawer__inner');
    if (drawerInner) {
      const computedStyle = window.getComputedStyle(drawerInner);
      
      // Si no tiene los estilos personalizados, aplicarlos
      if (!computedStyle.borderRadius || computedStyle.borderRadius === '0px') {
        drawerInner.style.borderRadius = '18px';
        drawerInner.style.border = '3px solid #000000';
        drawerInner.style.fontFamily = 'Poppins, sans-serif';
      }
    }
  }
}

// Clase para validar stock en formularios de producto
class ProductStockValidator {
  constructor() {
    this.init();
  }

  init() {
    // Interceptar formularios de añadir al carrito
    this.interceptProductForms();
  }

  interceptProductForms() {
    document.addEventListener('submit', async (event) => {
      const form = event.target;
      
      // Solo procesar formularios de añadir al carrito
      if (form.matches('form[action*="/cart/add"]') || 
          form.matches('form[data-type="add-to-cart-form"]') ||
          form.closest('product-form')) {
        
        // Validar stock antes de enviar
        const isValid = await this.validateProductStock(form);
        if (!isValid) {
          event.preventDefault();
          event.stopImmediatePropagation();
          return false;
        }
      }
    });
  }

  async validateProductStock(form) {
    const quantityInput = form.querySelector('input[name="quantity"]');
    const variantIdInput = form.querySelector('input[name="id"]');
    
    if (!quantityInput || !variantIdInput) {
      return true; // Si no hay inputs de cantidad, permitir el envío
    }

    const requestedQuantity = parseInt(quantityInput.value) || 1;
    const variantId = variantIdInput.value;
    
    // Obtener la cantidad actual en el carrito para esta variante
    const currentCartQuantity = await this.getCurrentCartQuantity(variantId);
    const totalRequestedQuantity = currentCartQuantity + requestedQuantity;
    
    // Obtener el stock disponible para esta variante
    const maxStock = this.getMaxStockForVariant(variantId, quantityInput);
    
    if (maxStock > 0 && totalRequestedQuantity > maxStock) {
      const availableQuantity = Math.max(0, maxStock - currentCartQuantity);
      
      if (availableQuantity <= 0) {
        this.showStockMessage(`No se puede añadir más de este producto. Ya tienes ${currentCartQuantity} en tu carrito y el stock disponible es ${maxStock}.`);
      } else {
        this.showStockMessage(`Solo puedes añadir ${availableQuantity} unidades más de este producto. Ya tienes ${currentCartQuantity} en tu carrito.`);
      }
      
      return false;
    }
    
    return true;
  }

  async getCurrentCartQuantity(variantId) {
    // Buscar la cantidad actual en el carrito para esta variante
    const cartItem = document.querySelector(`input[data-quantity-variant-id="${variantId}"]`);
    if (cartItem) {
      return parseInt(cartItem.value) || 0;
    }
    
    // Si no se encuentra en el DOM, intentar obtener del carrito actual
    if (window.cartData && window.cartData.items) {
      const item = window.cartData.items.find(item => item.variant_id == variantId);
      return item ? item.quantity : 0;
    }
    
    // Si no hay datos del carrito en memoria, intentar obtener desde la API
    // Esto es una validación adicional para casos donde el DOM no esté actualizado
    return await this.getCartQuantityFromAPI(variantId);
  }

  async getCartQuantityFromAPI(variantId) {
    try {
      const response = await fetch('/cart.js');
      const cart = await response.json();
      
      if (cart.items) {
        const item = cart.items.find(item => item.variant_id == variantId);
        return item ? item.quantity : 0;
      }
    } catch (error) {
      console.error('Error obteniendo información del carrito:', error);
    }
    
    return 0;
  }

  getMaxStockForVariant(variantId, quantityInput) {
    // Intentar obtener el stock máximo del input de cantidad
    const maxInventory = parseInt(quantityInput.getAttribute('data-max-inventory'));
    const maxRule = parseInt(quantityInput.getAttribute('data-max'));
    const maxAttr = parseInt(quantityInput.getAttribute('max'));
    
    // Priorizar el inventario real sobre las reglas de cantidad
    if (!isNaN(maxInventory) && maxInventory > 0) {
      return maxInventory;
    }
    
    if (!isNaN(maxRule) && maxRule > 0) {
      return maxRule;
    }
    
    if (!isNaN(maxAttr) && maxAttr > 0) {
      return maxAttr;
    }
    
    // Si no hay límites definidos, permitir
    return 999999;
  }

  showStockMessage(message) {
    // Crear o actualizar el mensaje
    let messageEl = document.querySelector('.product-stock-message');
    if (!messageEl) {
      messageEl = document.createElement('div');
      messageEl.className = 'product-stock-message';
      document.body.appendChild(messageEl);
    }
    
    messageEl.textContent = message;
    messageEl.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
      color: white;
      padding: 12px 20px;
      border-radius: 12px;
      z-index: 10001;
      font-size: 14px;
      font-weight: 500;
      font-family: 'Poppins', sans-serif;
      box-shadow: 0 8px 25px rgba(244, 67, 54, 0.3);
      transform: translateX(100%);
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      max-width: 400px;
      line-height: 1.4;
      border: 1px solid rgba(255, 255, 255, 0.1);
    `;
    
    // Mostrar mensaje con animación suave
    setTimeout(() => {
      messageEl.style.transform = 'translateX(0)';
    }, 10);
    
    // Ocultar mensaje después de 5 segundos con animación suave
    setTimeout(() => {
      messageEl.style.transform = 'translateX(100%)';
      messageEl.style.opacity = '0';
      setTimeout(() => {
        if (messageEl.parentNode) {
          messageEl.parentNode.removeChild(messageEl);
        }
      }, 400);
    }, 5000);
  }
}

// Instancia global del manager
window.cartCounterManager = new CartCounterManager();

// Instancia global del preservador de diseño
window.cartDesignPreserver = new CartDesignPreserver();

// Instancia global del validador de stock
window.productStockValidator = new ProductStockValidator();

class CartDrawerEnhancer {
  constructor() {
    this.init();
    // Mantener la burbuja de conteo del header sincronizada usando el nuevo manager
    if (window.cartCounterManager) {
      document.addEventListener('cart:counter-updated', () => {
        // El contador ya fue actualizado por el manager
        console.log('Contador del carrito actualizado');
      });
    }
  }

  init() {
    // Esperar a que el DOM esté listo
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.enhance());
    } else {
      this.enhance();
    }
  }

  enhance() {
    const cartDrawer = document.querySelector('cart-drawer');
    if (!cartDrawer) return;

    // Limpiar errores al inicializar
    this.clearCartErrors();

    // Mejorar los quantity inputs existentes
    this.enhanceQuantityInputs(cartDrawer);
    
    // Observar cambios en el DOM para re-inicializar después de actualizaciones
    this.observeCartChanges(cartDrawer);
  }

  enhanceQuantityInputs(container) {
    // Limpiar errores antes de mejorar los inputs
    this.clearCartErrors();
    
    // Solo procesar quantity inputs dentro del cart drawer
    const quantityInputs = container.querySelectorAll('cart-drawer quantity-input, .cart-drawer quantity-input');
    
    quantityInputs.forEach(quantityInput => {
      if (quantityInput.hasAttribute('data-enhanced')) return;
      quantityInput.setAttribute('data-enhanced', 'true');

      const input = quantityInput.querySelector('input[name="updates[]"]');
      const buttons = quantityInput.querySelectorAll('button');
      
      if (!input) return;

      // Referencia directa al botón minus dentro del componente
      const minusButton = quantityInput.querySelector('button[name="minus"]');

      // SVGs para los iconos
      const svgMinus = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M5 11V13H19V11H5Z"></path></svg>';
      const svgTrash = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path d="M14 3h-3.53a3.07 3.07 0 0 0-.6-1.65C9.44.82 8.8.5 8 .5s-1.44.32-1.87.85A3.06 3.06 0 0 0 5.53 3H2a.5.5 0 0 0 0 1h1.25v10c0 .28.22.5.5.5h8.5a.5.5 0 0 0 .5-.5V4H14a.5.5 0 0 0 0-1M6.91 1.98c.23-.29.58-.48 1.09-.48s.85.19 1.09.48c.2.24.3.6.36 1.02h-2.9c.05-.42.17-.78.36-1.02m4.84 11.52h-7.5V4h7.5z"/><path d="M6.55 5.25a.5.5 0 0 0-.5.5v6a.5.5 0 0 0 1 0v-6a.5.5 0 0 0-.5-.5m2.9 0a.5.5 0 0 0-.5.5v6a.5.5 0 0 0 1 0v-6a.5.5 0 0 0-.5-.5"/></svg>';

      // Cambiar el icono del botón minus cuando la cantidad es 1
      const updateMinusIcon = () => {
        if (minusButton) {
          const svgWrapper = minusButton.querySelector('.svg-wrapper');
          if (svgWrapper) {
            const currentValue = parseInt(input.value) || 0;
            svgWrapper.innerHTML = currentValue === 1 ? svgTrash : svgMinus;
          }
        }
      };

      // Actualizar el icono al cargar y cuando cambie la cantidad
      updateMinusIcon();
      input.addEventListener('input', updateMinusIcon);
      input.addEventListener('change', updateMinusIcon);

      // Solo sobrescribir los manejadores si estamos en el cart drawer
      if (quantityInput.closest('cart-drawer')) {
        // Desactivar temporalmente los manejadores nativos de Shopify solo para el cart drawer
        const originalOnButtonClick = quantityInput.onButtonClick;
        const originalOnInputChange = quantityInput.onInputChange;
        
        // Sobrescribir los métodos nativos para evitar conflictos
        quantityInput.onButtonClick = (event) => {
          // Solo manejar si no está siendo manejado por nuestro código personalizado
          if (!event.target.hasAttribute('data-custom-handled')) {
            this.handleQuantityButton(event, input, quantityInput);
          }
        };
        
        quantityInput.onInputChange = (event) => {
          // Solo manejar si no está siendo manejado por nuestro código personalizado
          if (!event.target.hasAttribute('data-custom-handled')) {
            this.handleQuantityChange(event, quantityInput);
          }
        };

        // Manejar clics en los botones de cantidad con nuestro código personalizado
        buttons.forEach(button => {
          button.addEventListener('click', (event) => {
            // Marcar como manejado por nuestro código
            event.target.setAttribute('data-custom-handled', 'true');
            this.handleQuantityButton(event, input, quantityInput);
            
            // Limpiar el atributo después de un tiempo
            setTimeout(() => {
              event.target.removeAttribute('data-custom-handled');
            }, 100);
          });
        });

        // Manejar cambios directos en el input con nuestro código personalizado
        input.addEventListener('change', (event) => {
          // Marcar como manejado por nuestro código
          event.target.setAttribute('data-custom-handled', 'true');
          this.handleQuantityChange(event, quantityInput);
          
          // Limpiar el atributo después de un tiempo
          setTimeout(() => {
            event.target.removeAttribute('data-custom-handled');
          }, 100);
        });
      }
    });
  }

  observeCartChanges(cartDrawer) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Re-procesar nuevos quantity inputs
          this.enhanceQuantityInputs(cartDrawer);
        }
      });
    });

    observer.observe(cartDrawer, {
      childList: true,
      subtree: true
    });
  }

  handleQuantityButton(event, input, quantityInput) {
    // Evitamos que otros manejadores escuchen este evento si detectamos un límite
    event.preventDefault();
    event.stopImmediatePropagation();

    const button = event.target.closest('button');

    // Valor actual y límites
    const currentValue = parseInt(input.value) || 0;
    const min = parseInt(input.min || 0);

    // Verificar si el input está marcado como actualizando, pero con timeout más corto
    if (input.hasAttribute('data-custom-updating')) {
      const updateTime = parseInt(input.getAttribute('data-update-time') || '0');
      const currentTime = Date.now();
      
      // Si han pasado más de 500ms desde la última actualización, permitir la nueva acción
      if (currentTime - updateTime < 500) {
        console.log('Button action ignored - still updating');
        return;
      } else {
        // Limpiar el flag si ya pasó suficiente tiempo
        input.removeAttribute('data-custom-updating');
        input.removeAttribute('data-update-time');
      }
    }

    // Determinar el máximo: primero intentamos a partir del atributo "data-max-inventory" inyectado desde Liquid,
    // si no existe, caemos al atributo max del input o a un valor grande por defecto.
    const inventoryMaxAttr = parseInt(input.getAttribute('data-max-inventory'));
    const max = !isNaN(inventoryMaxAttr) && inventoryMaxAttr > 0
      ? inventoryMaxAttr
      : parseInt(input.max || 999999);

    const step = parseInt(input.step || 1);

    let newValue = currentValue;
    
    if (button.name === 'plus') {
      newValue = currentValue + step;
      
      // Validar límite de stock
      if (newValue > max) {
        this.showMessage(`No se puede añadir más de ${max} unidades de este producto`);
        return;
      }
    } else if (button.name === 'minus') {
      // Calcular el nuevo valor primero
      newValue = Math.max(min, currentValue - step);
      
      // Si el nuevo valor sería 0, eliminar la línea
      if (newValue <= 0) {
        this.removeCartLine(input);
        return;
      }
    }

    // Asegurar que el nuevo valor es válido
    if (newValue < min) {
      newValue = min;
    }
    if (newValue > max) {
      newValue = max;
    }

    // Solo actualizar si el valor realmente cambió
    if (newValue === currentValue) {
      console.log('Value did not change, skipping update');
      return;
    }

    // Actualizar el valor del input
    input.value = newValue;
    
    // Marcar como actualizando con timestamp para evitar loops
    input.setAttribute('data-custom-updating', 'true');
    input.setAttribute('data-update-time', Date.now().toString());
    
    // Triggear el evento change para que se actualice el carrito
    input.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Quitar el flag después de un tiempo más corto
    setTimeout(() => {
      input.removeAttribute('data-custom-updating');
      input.removeAttribute('data-update-time');
    }, 300);
  }

  handleQuantityChange(event, quantityInput) {
    // Limpiar errores previos
    this.clearCartErrors();
    
    const input = event.target;
    const newValue = parseInt(input.value) || 0;
    const min = parseInt(input.min || 0);
    const inventoryMaxAttr = parseInt(input.getAttribute('data-max-inventory'));
    const max = !isNaN(inventoryMaxAttr) && inventoryMaxAttr > 0
      ? inventoryMaxAttr
      : parseInt(input.max || 999999);
    
    // Si el valor es 0, eliminar la línea
    if (newValue === 0) {
      this.removeCartLine(input);
      return;
    }
    
    // Validar límites
    if (newValue < min) {
      event.stopImmediatePropagation();
      input.value = min;
      this.showMessage(`La cantidad mínima es ${min}`);
      return;
    }
    
    if (newValue > max) {
      event.stopImmediatePropagation();
      input.value = max;
      this.showMessage(`No se puede añadir más de ${max} unidades de este producto`);
      return;
    }

    // Verificar si está actualizándose con timeout mejorado
    if (input.hasAttribute('data-custom-updating')) {
      const updateTime = parseInt(input.getAttribute('data-update-time') || '0');
      const currentTime = Date.now();
      
      // Si han pasado más de 500ms desde la última actualización, permitir la nueva acción
      if (currentTime - updateTime < 500) {
        console.log('Input change ignored - still updating');
        return;
      } else {
        // Limpiar el flag si ya pasó suficiente tiempo
        input.removeAttribute('data-custom-updating');
        input.removeAttribute('data-update-time');
      }
    }
    
    // Marcar como actualizando para evitar loops
    input.setAttribute('data-custom-updating', 'true');
    input.setAttribute('data-update-time', Date.now().toString());
    
    // Añadir loading state
    this.addLoadingState(quantityInput);
    
    // Actualizar contador inmediatamente
    if (window.cartCounterManager) {
      setTimeout(() => {
        window.cartCounterManager.updateCounter();
      }, 100);
    }
    
    // Quitar el flag después de un tiempo más corto
    setTimeout(() => {
      input.removeAttribute('data-custom-updating');
      input.removeAttribute('data-update-time');
    }, 300);
  }

  addLoadingState(quantityInput) {
    quantityInput.classList.add('loading');
    
    // Quitar loading state después de un tiempo
    setTimeout(() => {
      quantityInput.classList.remove('loading');
    }, 800);
  }

  showMessage(message) {
    // Crear o actualizar el mensaje
    let messageEl = document.querySelector('.cart-quantity-message');
    if (!messageEl) {
      messageEl = document.createElement('div');
      messageEl.className = 'cart-quantity-message';
      document.body.appendChild(messageEl);
    }
    
    messageEl.textContent = message;
    messageEl.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px 20px;
      border-radius: 12px;
      z-index: 10001;
      font-size: 14px;
      font-weight: 500;
      font-family: 'Poppins', sans-serif;
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
      transform: translateX(100%);
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      max-width: 300px;
      line-height: 1.4;
      border: 1px solid rgba(255, 255, 255, 0.1);
    `;
    
    // Mostrar mensaje con animación suave
    setTimeout(() => {
      messageEl.style.transform = 'translateX(0)';
    }, 10);
    
    // Ocultar mensaje después de 4 segundos con animación suave
    setTimeout(() => {
      messageEl.style.transform = 'translateX(100%)';
      messageEl.style.opacity = '0';
      setTimeout(() => {
        if (messageEl.parentNode) {
          messageEl.parentNode.removeChild(messageEl);
        }
      }, 400);
    }, 4000);
  }

  removeCartLine(input) {
    console.log('Attempting to remove cart line', input);
    
    const lineIndex = parseInt(input.dataset.index);
    console.log('Line index:', lineIndex);
    
    if (!lineIndex || lineIndex < 1) {
      console.error('Invalid line index:', lineIndex);
      return;
    }

    // Limpiar cualquier mensaje de error previo
    this.clearCartErrors();

    // Usar directamente el método de fallback en lugar del método de Shopify
    // para evitar el mensaje de error que se muestra cuando updateQuantity falla
    console.log('Using direct fetch method to avoid error messages');
    
    if (!window.routes || !window.routes.cart_change_url) {
      console.error('Cart change URL not available');
      return;
    }

    const body = JSON.stringify({
      line: lineIndex,
      quantity: 0,
      sections: ['cart-drawer', 'cart-icon-bubble'],
      sections_url: window.location.pathname,
    });

    const fetchConfig = window.fetchConfig || (() => ({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }));

    fetch(window.routes.cart_change_url, { ...fetchConfig(), body })
      .then((response) => {
        console.log('Remove response status:', response.status);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
      })
      .then((state) => {
        console.log('Remove response:', state);
        
        // Limpiar errores en caso de éxito
        this.clearCartErrors();
        
        // Procesar la respuesta y actualizar las secciones
        try {
          const parsed = JSON.parse(state);
          
          // Actualizar las secciones del DOM si están disponibles
          if (parsed.sections) {
            // Actualizar cart-drawer si existe
            if (parsed.sections['cart-drawer']) {
              const cartDrawerElement = document.querySelector('cart-drawer');
              if (cartDrawerElement) {
                const parser = new DOMParser();
                const newDoc = parser.parseFromString(parsed.sections['cart-drawer'], 'text/html');
                const newDrawerInner = newDoc.querySelector('.drawer__inner');
                
                if (newDrawerInner) {
                  const currentDrawerInner = cartDrawerElement.querySelector('.drawer__inner');
                  if (currentDrawerInner) {
                    currentDrawerInner.replaceWith(newDrawerInner);
                  }
                }
                
                // Actualizar la clase is-empty según el estado del carrito
                const newCartDrawer = newDoc.querySelector('cart-drawer');
                if (newCartDrawer) {
                  if (newCartDrawer.classList.contains('is-empty')) {
                    cartDrawerElement.classList.add('is-empty');
                  } else {
                    cartDrawerElement.classList.remove('is-empty');
                  }
                }
              }
            }
            
            // Actualizar cart-icon-bubble si existe
            if (parsed.sections['cart-icon-bubble']) {
              const cartIconBubble = document.querySelector('cart-icon-bubble');
              if (cartIconBubble) {
                const parser = new DOMParser();
                const newDoc = parser.parseFromString(parsed.sections['cart-icon-bubble'], 'text/html');
                const newBubble = newDoc.querySelector('cart-icon-bubble');
                if (newBubble) {
                  cartIconBubble.replaceWith(newBubble);
                }
              }
            }
          }
          
          // Reinicializar el enhancer después de actualizar el DOM
          if (window.cartDrawerEnhancer) {
            setTimeout(() => {
              window.cartDrawerEnhancer.enhance();
            }, 100);
          }
          
          // Usar el sistema PUB/SUB de Shopify si está disponible
          if (window.publish && window.PUB_SUB_EVENTS) {
            window.publish(PUB_SUB_EVENTS.cartUpdate, { 
              source: 'custom-drawer', 
              cartData: parsed 
            });
          }
          
          // Disparar evento personalizado
          document.dispatchEvent(new CustomEvent('cart:remove', { detail: parsed }));
          
          console.log('Successfully removed item from cart');
        } catch (e) {
          console.error('Error parsing response:', e);
        }
      })
      .catch((error) => {
        console.error('Error removing item from cart:', error);
      })
      .finally(() => {
        // Forzar actualización del contador y limpiar errores
        if (window.cartCounterManager) {
          setTimeout(() => {
            this.clearCartErrors();
            window.cartCounterManager.forceUpdate();
          }, 200);
        }
      });
  }

  // Método para limpiar mensajes de error del carrito
  clearCartErrors() {
    const errorElements = [
      document.getElementById('cart-errors'),
      document.getElementById('CartDrawer-CartErrors'),
      document.querySelector('[id*="cart-error"]'),
      document.querySelector('[id*="CartDrawer-Error"]'),
      // Buscar elementos de error por clases también
      document.querySelector('.cart-item__error-text'),
      document.querySelector('.variant-item__error-text'),
      // Buscar errores de línea específicos
      document.querySelector('[id*="Line-item-error"]'),
      document.querySelector('[id*="CartDrawer-LineItemError"]')
    ];

    errorElements.forEach(element => {
      if (element) {
        element.textContent = '';
        element.innerHTML = '';
        element.style.display = 'none';
        element.setAttribute('aria-hidden', 'true');
      }
    });
    
    // También limpiar todos los elementos que contengan la clase de error
    const errorTextElements = document.querySelectorAll('.cart-item__error-text, .variant-item__error-text');
    errorTextElements.forEach(element => {
      element.textContent = '';
      element.innerHTML = '';
      if (element.closest('[id*="error"]')) {
        element.closest('[id*="error"]').style.display = 'none';
      }
    });
    
    // Prevenir errores en cart.js al intentar acceder a elementos null
    const preventCartJsError = () => {
      // Verificar que los elementos necesarios para cart.js existan
      if (!document.getElementById('cart-errors')) {
        const errorDiv = document.createElement('div');
        errorDiv.id = 'cart-errors';
        errorDiv.style.display = 'none';
        document.body.appendChild(errorDiv);
      }
      
      if (!document.getElementById('CartDrawer-CartErrors')) {
        const errorDiv = document.createElement('div');
        errorDiv.id = 'CartDrawer-CartErrors';
        errorDiv.style.display = 'none';
        document.body.appendChild(errorDiv);
      }
    };
    
    preventCartJsError();
  }
}

// Inicializar el enhancer
window.cartDrawerEnhancer = new CartDrawerEnhancer();

// Interceptor adicional para limpiar errores en actualizaciones del carrito
if (window.subscribe && window.PUB_SUB_EVENTS) {
  window.subscribe(PUB_SUB_EVENTS.cartUpdate, () => {
    if (window.cartDrawerEnhancer) {
      setTimeout(() => {
        window.cartDrawerEnhancer.clearCartErrors();
      }, 100);
    }
  });
}

} // End of unified cart check
