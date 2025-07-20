/* 
 * UNIFIED CART SYSTEM
 * Replaces: custom-cart-drawer.js + simple-cart-drawer.js
 * Centralizes all cart functionality to prevent conflicts
 */

// Flag to prevent other cart scripts from running
window.UNIFIED_CART_ACTIVE = true;

class UnifiedCartManager {
  constructor() {
    this.isUpdating = false;
    this.updateQueue = [];
    this.processingAction = false;
    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    console.log('🛒 Unified Cart System initializing...');
    
    // Initialize cart counter
    this.updateCartCounter();
    
    // Setup quantity button handlers
    this.setupQuantityButtons();
    
    // Setup form handlers
    this.setupFormHandlers();
    
    // Setup cart icon
    this.setupCartIcon();
    
    // Create error elements if needed
    this.createErrorElements();
    
    // Observe cart changes
    this.observeCartChanges();
    
    console.log('✅ Unified Cart System ready!');
  }

  createErrorElements() {
    // Prevent cart.js errors by ensuring error elements exist
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
  }

  setupQuantityButtons() {
    // Override native Shopify quantity handlers completely
    this.overrideNativeHandlers();
    
    // Use event delegation to handle all quantity buttons with highest priority
    document.addEventListener('click', (event) => {
      // Only handle if this is a quantity button
      const button = event.target.closest('button[name="plus"], button[name="minus"]');
      if (!button) return;

      // Only handle cart drawer buttons
      const cartDrawer = button.closest('cart-drawer');
      if (!cartDrawer) return;

      // IMMEDIATELY stop all propagation to prevent any other handlers
      event.preventDefault();
      event.stopImmediatePropagation();
      event.stopPropagation();

      // Check if we're processing
      if (this.processingAction) {
        console.log('⏸️ Action ignored - already processing');
        return;
      }

      console.log('🔘 Button click intercepted:', button.name);
      this.handleQuantityButton(button);
    }, { capture: true }); // Use capture phase to intercept first

    // Handle direct input changes with capture
    document.addEventListener('change', (event) => {
      if (event.target.matches('input[name="updates[]"]')) {
        const input = event.target;
        const cartDrawer = input.closest('cart-drawer');
        if (!cartDrawer) return;

        // Stop native handlers from processing
        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();

        if (this.processingAction) {
          console.log('⏸️ Input change ignored - already processing');
          return;
        }

        console.log('📝 Input change intercepted, value:', input.value);
        this.handleQuantityInput(input);
      }
    }, { capture: true });
  }

  overrideNativeHandlers() {
    // Find all quantity inputs and disable their native handlers
    const quantityInputs = document.querySelectorAll('cart-drawer quantity-input');
    
    quantityInputs.forEach(quantityInput => {
      // Skip if already overridden
      if (quantityInput.hasAttribute('data-unified-override')) {
        return;
      }
      
      // Disable native Shopify handlers
      if (quantityInput.onButtonClick) {
        quantityInput.onButtonClick = () => {
          console.log('🚫 Native button click handler disabled');
          return false;
        };
      }
      
      if (quantityInput.onInputChange) {
        quantityInput.onInputChange = () => {
          console.log('🚫 Native input change handler disabled');
          return false;
        };
      }
      
      // Mark as overridden
      quantityInput.setAttribute('data-unified-override', 'true');
      
      console.log('🔧 Override applied to quantity input');
    });
  }

  handleQuantityButton(button) {
    console.log('🔘 Quantity button clicked:', button.name);
    
    this.processingAction = true;
    
    const quantityInput = button.closest('quantity-input');
    const input = quantityInput?.querySelector('input[name="updates[]"]');
    
    if (!input) {
      console.error('❌ No input found for quantity button');
      this.processingAction = false;
      return;
    }

    const currentValue = parseInt(input.value) || 0;
    const min = parseInt(input.getAttribute('data-min') || input.min || 1);
    const maxInventory = parseInt(input.getAttribute('data-max-inventory'));
    const max = !isNaN(maxInventory) && maxInventory > 0 ? maxInventory : parseInt(input.max || 999999);
    
    let newValue = currentValue;
    
    if (button.name === 'plus') {
      newValue = currentValue + 1;
      
      // Check stock limit
      if (newValue > max) {
        this.showMessage(`No se puede añadir más de ${max} unidades de este producto`);
        this.processingAction = false;
        return;
      }
      
      console.log(`➕ Incrementing from ${currentValue} to ${newValue}`);
      
    } else if (button.name === 'minus') {
      newValue = currentValue - 1;
      
      console.log(`➖ Decrementing from ${currentValue} to ${newValue}`);
      
      // If new value would be below minimum, remove the item
      if (newValue < min) {
        console.log('🗑️ Quantity below minimum, removing item');
        this.removeCartLine(input);
        return;
      }
    }

    // Update the input value
    input.value = newValue;
    
    // Trigger the cart update
    this.updateCartQuantity(input, newValue);
  }

  handleQuantityInput(input) {
    const currentValue = parseInt(input.value) || 0;
    const previousValue = parseInt(input.getAttribute('data-previous-value') || input.defaultValue || 0);
    
    console.log('📝 Quantity input changed manually:', {
      currentValue,
      previousValue,
      inputValue: input.value,
      defaultValue: input.defaultValue
    });
    
    this.processingAction = true;
    
    const min = parseInt(input.getAttribute('data-min') || input.min || 1);
    
    // If the current value is suspicious (0 when it shouldn't be), use previous value logic
    if (currentValue === 0 && previousValue > 0) {
      console.log('⚠️ Suspicious zero value detected, likely race condition');
      // Don't process this change, it's likely a race condition
      this.processingAction = false;
      return;
    }
    
    if (currentValue === 0 || currentValue < min) {
      console.log('🗑️ Quantity is 0 or below minimum, removing item');
      this.removeCartLine(input);
      return;
    }
    
    // Store current value as previous for next time
    input.setAttribute('data-previous-value', currentValue.toString());
    
    this.updateCartQuantity(input, currentValue);
  }

  updateCartQuantity(input, quantity) {
    console.log(`🔄 Updating cart quantity to ${quantity}`);
    
    const lineIndex = parseInt(input.dataset.index);
    if (!lineIndex || lineIndex < 1) {
      console.error('❌ Invalid line index:', lineIndex);
      this.processingAction = false;
      return;
    }

    // Add loading state
    const quantityInput = input.closest('quantity-input');
    if (quantityInput) {
      quantityInput.classList.add('loading');
    }

    const body = JSON.stringify({
      line: lineIndex,
      quantity: quantity,
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
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
      })
      .then(state => {
        const parsed = JSON.parse(state);
        console.log('✅ Cart updated successfully');
        
        this.updateCartSections(parsed);
        this.updateCartCounter();
        
        // Dispatch custom event
        document.dispatchEvent(new CustomEvent('cart:updated', { detail: parsed }));
      })
      .catch(error => {
        console.error('❌ Error updating cart:', error);
        this.showMessage('Error al actualizar el carrito');
      })
      .finally(() => {
        // Remove loading state
        if (quantityInput) {
          quantityInput.classList.remove('loading');
        }
        
        // Reset processing flag after a delay
        setTimeout(() => {
          this.processingAction = false;
          console.log('🟢 Ready for next action');
        }, 500);
      });
  }

  removeCartLine(input) {
    console.log('🗑️ Removing cart line');
    
    const lineIndex = parseInt(input.dataset.index);
    if (!lineIndex || lineIndex < 1) {
      console.error('❌ Invalid line index:', lineIndex);
      this.processingAction = false;
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
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
      })
      .then(state => {
        const parsed = JSON.parse(state);
        console.log('✅ Item removed successfully');
        
        this.updateCartSections(parsed);
        this.updateCartCounter();
        
        // Dispatch custom events
        document.dispatchEvent(new CustomEvent('cart:item-removed', { detail: parsed }));
        document.dispatchEvent(new CustomEvent('cart:updated', { detail: parsed }));
        
        this.showNotification('Producto eliminado del carrito', 'info');
      })
      .catch(error => {
        console.error('❌ Error removing item:', error);
        this.showMessage('Error al eliminar el producto');
      })
      .finally(() => {
        // Reset processing flag after a delay
        setTimeout(() => {
          this.processingAction = false;
          console.log('🟢 Ready for next action');
        }, 500);
      });
  }

  updateCartSections(cartData) {
    if (!cartData.sections) return;

    // Update cart drawer
    if (cartData.sections['cart-drawer']) {
      const cartDrawer = document.querySelector('cart-drawer');
      if (cartDrawer) {
        const parser = new DOMParser();
        const newDoc = parser.parseFromString(cartData.sections['cart-drawer'], 'text/html');
        const newDrawerInner = newDoc.querySelector('.drawer__inner');
        
        if (newDrawerInner) {
          const currentDrawerInner = cartDrawer.querySelector('.drawer__inner');
          if (currentDrawerInner) {
            currentDrawerInner.replaceWith(newDrawerInner);
          }
        }
        
        // Update empty state
        if (cartData.item_count === 0) {
          cartDrawer.classList.add('is-empty');
        } else {
          cartDrawer.classList.remove('is-empty');
        }
      }
    }

    // Update cart icon bubble
    if (cartData.sections['cart-icon-bubble']) {
      const cartIconBubble = document.querySelector('cart-icon-bubble');
      if (cartIconBubble) {
        const parser = new DOMParser();
        const newDoc = parser.parseFromString(cartData.sections['cart-icon-bubble'], 'text/html');
        const newBubble = newDoc.querySelector('cart-icon-bubble');
        if (newBubble) {
          cartIconBubble.replaceWith(newBubble);
        }
      }
    }
  }

  updateCartCounter() {
    if (this.isUpdating) return;
    
    this.isUpdating = true;
    
    fetch('/cart.js')
      .then(response => response.json())
      .then(cart => {
        const itemCount = cart.item_count || 0;
        
        // Update all counter elements
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

        // Update counter bubble visibility
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
        
        console.log(`🔢 Cart counter updated: ${itemCount} items`);
        
        this.isUpdating = false;
      })
      .catch(error => {
        console.error('❌ Error updating cart counter:', error);
        this.isUpdating = false;
      });
  }

  setupFormHandlers() {
    // Handle add to cart forms
    document.addEventListener('submit', (event) => {
      if (event.target.matches('form[action*="/cart/add"]')) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        
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
          console.log('✅ Product added to cart:', data.product_title);
          
          // Update cart display
          this.refreshCartDrawer().then(() => {
            // Open cart drawer
            const cartDrawer = document.querySelector('cart-drawer');
            if (cartDrawer && cartDrawer.open) {
              cartDrawer.open();
            }
            
            this.showNotification(`${data.product_title} añadido al carrito`, 'success');
          });
        })
        .catch(error => {
          console.error('❌ Error adding product:', error);
          this.showNotification('Error al añadir el producto al carrito', 'error');
        });
      }
    });
  }

  setupCartIcon() {
    const cartIcon = document.querySelector('.cart-icon-btn');
    const cartDrawer = document.querySelector('cart-drawer');
    
    if (cartIcon && cartDrawer) {
      cartIcon.addEventListener('click', (event) => {
        event.preventDefault();
        if (cartDrawer.open) {
          cartDrawer.open();
        }
      });
    }
  }

  refreshCartDrawer() {
    const sections = 'cart-drawer,cart-icon-bubble';
    
    return fetch(`${window.location.pathname}?sections=${sections}`)
      .then(response => response.json())
      .then(data => {
        this.updateCartSections({ sections: data });
        this.updateCartCounter();
      })
      .catch(error => {
        console.error('❌ Error refreshing cart drawer:', error);
      });
  }

  observeCartChanges() {
    const cartDrawer = document.querySelector('cart-drawer');
    if (!cartDrawer) return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Re-setup quantity buttons for new content
          console.log('🔄 Cart content changed, re-initializing...');
          
          // Re-override native handlers for new content
          setTimeout(() => {
            this.overrideNativeHandlers();
          }, 100);
        }
      });
    });

    observer.observe(cartDrawer, {
      childList: true,
      subtree: true
    });
  }

  showMessage(message) {
    let messageEl = document.querySelector('.unified-cart-message');
    if (!messageEl) {
      messageEl = document.createElement('div');
      messageEl.className = 'unified-cart-message';
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
    
    // Show message
    setTimeout(() => {
      messageEl.style.transform = 'translateX(0)';
    }, 10);
    
    // Hide message after 4 seconds
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

  showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `unified-cart-notification unified-cart-notification--${type}`;
    notification.innerHTML = `
      <div class="unified-cart-notification__content">
        <span class="unified-cart-notification__icon">${type === 'success' ? '✓' : type === 'error' ? '⚠' : 'ℹ'}</span>
        <span class="unified-cart-notification__message">${message}</span>
      </div>
    `;
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
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
      min-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
      notification.style.opacity = '1';
    }, 100);
    
    // Hide notification after 3 seconds
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
}

// Initialize the unified cart system
window.unifiedCartManager = new UnifiedCartManager();

// Expose for debugging
window.debugCart = () => {
  console.log('🛒 Unified Cart Debug Info:');
  console.log('Processing Action:', window.unifiedCartManager.processingAction);
  console.log('Is Updating:', window.unifiedCartManager.isUpdating);
};

console.log('🚀 Unified Cart System loaded');
