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
    
    // Detect product stock on page load
    this.detectProductStock();
    
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
    document.addEventListener('submit', async (event) => {
      if (event.target.matches('form[action*="/cart/add"]')) {
        event.preventDefault();
        
        console.log('🛒 Add to cart form intercepted by unified cart');
        
        // Validate stock before adding to cart
        const isStockValid = await this.validateStock(event.target);
        if (!isStockValid) {
          console.log('❌ Stock validation failed, blocking add to cart');
          return;
        }
        
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

  async validateStock(form) {
    console.log('🔍 Validating stock before adding to cart...');
    
    try {
      const formData = new FormData(form);
      const variantId = formData.get('id');
      const requestedQuantity = parseInt(formData.get('quantity') || '1');
      
      console.log('📊 Stock validation params:', { variantId, requestedQuantity });
      
      // Get current cart to check existing quantity
      const cartResponse = await fetch('/cart.js');
      const cart = await cartResponse.json();
      
      // Find existing quantity of this variant in cart
      const existingCartItem = cart.items.find(item => item.variant_id == variantId);
      const currentCartQuantity = existingCartItem ? existingCartItem.quantity : 0;
      
      // Get variant information - prioritize Liquid data if available
      let variantInventory = 0;
      let productTitle = '';
      let inventoryPolicy = 'continue'; // Default to allow sales
      let inventoryManagement = null;
      
      // Try to use Liquid inventory data first (most reliable)
      if (typeof window.allVariantsInventoryData !== 'undefined' && window.allVariantsInventoryData[variantId]) {
        const liquidVariantData = window.allVariantsInventoryData[variantId];
        variantInventory = liquidVariantData.inventory_quantity || 0;
        inventoryPolicy = liquidVariantData.inventory_policy || 'continue';
        inventoryManagement = liquidVariantData.inventory_management;
        
        // Get product title from current product data if available
        if (typeof window.productInventoryData !== 'undefined') {
          productTitle = window.productInventoryData.product_title || 'Producto';
        }
        
        console.log('✅ Using Liquid variant data:', {
          variantInventory,
          inventoryPolicy,
          inventoryManagement,
          productTitle,
          source: 'Liquid template'
        });
      } else {
        // Fallback to API endpoints if Liquid data not available
        console.log('🔍 Liquid data not available, fetching from API endpoints...');
        console.log('🔍 Using products.json as primary source (variants.js doesn\'t include inventory data)');
        
        try {
          // Use products.json as primary source since variants.js lacks inventory data
          const productsResponse = await fetch(`/products.json`);
          
          if (!productsResponse.ok) {
            throw new Error(`Products endpoint returned ${productsResponse.status}`);
          }
          
          const productsData = await productsResponse.json();
          console.log('📦 Products.json response:', {
            totalProducts: productsData.products?.length || 0,
            searchingForVariant: variantId
          });
          
          // Find the variant in all products
          let foundVariant = null;
          let foundProduct = null;
          for (const product of productsData.products) {
            const variant = product.variants.find(v => v.id == variantId);
            if (variant) {
              foundVariant = variant;
              foundProduct = product;
              
              console.log('📊 FULL VARIANT DATA FROM PRODUCTS.JSON:', {
                productTitle: product.title,
                variantId: variant.id,
                variantTitle: variant.title,
                inventory_quantity: variant.inventory_quantity,
                inventory_policy: variant.inventory_policy,
                inventory_management: variant.inventory_management,
                available: variant.available,
                FULL_VARIANT_OBJECT: variant,
                ALL_VARIANT_KEYS: Object.keys(variant),
                VARIANT_WITH_ALL_PROPERTIES: JSON.stringify(variant, null, 2)
              });
              
              // Use the actual inventory data from products.json
              variantInventory = variant.inventory_quantity !== null && variant.inventory_quantity !== undefined ? 
                                variant.inventory_quantity : 0;
              productTitle = product.title;
              inventoryPolicy = variant.inventory_policy || 'continue';
              inventoryManagement = variant.inventory_management;
              
              console.log('✅ Processed variant data from products.json:', { 
                variantInventory, 
                productTitle, 
                inventoryPolicy, 
                inventoryManagement,
                rawInventoryQuantity: variant.inventory_quantity,
                isInventoryQuantityNull: variant.inventory_quantity === null,
                isInventoryQuantityUndefined: variant.inventory_quantity === undefined,
                typeOfInventoryQuantity: typeof variant.inventory_quantity
              });
              break;
            }
          }
          
          if (!foundVariant) {
            console.error('❌ Variant not found in products.json for ID:', variantId);
            console.log('🔍 Available variant IDs in products.json:', 
              productsData.products.flatMap(p => p.variants.map(v => v.id)).slice(0, 10)
            );
            throw new Error(`Variant ${variantId} not found in products.json`);
          }
        } catch (productsError) {
          console.warn('⚠️ Products.json failed, trying variants.js as last resort:', productsError.message);
          // Last resort: try variants.js (but it usually lacks inventory data)
          console.log('🔍 Trying variants.js as last resort...');
          const variantResponse = await fetch(`/variants/${variantId}.js`);
          
          if (!variantResponse.ok) {
            throw new Error(`Variant endpoint returned ${variantResponse.status}`);
          }
          
          const variantData = await variantResponse.json();
          console.log('📊 VARIANT DATA FROM VARIANTS.JS (limited):', variantData);
          
          // Use what data we can get (usually limited)
          variantInventory = variantData.inventory_quantity !== null && variantData.inventory_quantity !== undefined ? 
                            variantData.inventory_quantity : 0;
          productTitle = variantData.product_title || 'Producto';
          inventoryPolicy = variantData.inventory_policy || 'continue';
          inventoryManagement = variantData.inventory_management;
          
          console.log('⚠️ Using limited data from variants.js:', {
            variantInventory,
            productTitle, 
            inventoryPolicy,
            inventoryManagement
          });
        } // End of products.json try-catch
      } // End of else clause for API fallback
      
      const totalRequestedQuantity = currentCartQuantity + requestedQuantity;
      
      console.log('📊 Stock validation data:', {
        variantInventory,
        currentCartQuantity,
        requestedQuantity,
        totalRequestedQuantity,
        productTitle,
        inventoryPolicy,
        inventoryManagement
      });
      
      
      // Legacy code (won't execute due to missing inventory data)
      if (inventoryManagement) {
        console.log('🔍 Inventory tracking is enabled, checking stock limits...');
        
        if (inventoryPolicy === 'deny') {
          console.log('📋 Inventory policy: DENY - strict stock validation');
          
          // Check if total requested quantity exceeds available inventory
          if (totalRequestedQuantity > variantInventory) {
            const availableToAdd = Math.max(0, variantInventory - currentCartQuantity);
            
            if (variantInventory === 0) {
              // Product has no stock at all
              this.showStockMessage(`"${productTitle}" no tiene stock disponible.`);
            } else if (availableToAdd === 0) {
              // Product has stock but user already has max quantity in cart
              this.showStockMessage(`Ya tienes la cantidad máxima disponible de "${productTitle}" en tu carrito.`);
            } else {
              // Product has some stock but not enough for requested quantity
              this.showStockMessage(`Solo puedes añadir ${availableToAdd} unidad(es) más de "${productTitle}". Stock disponible: ${variantInventory}, en carrito: ${currentCartQuantity}`);
            }
            
            return false;
          }
        } else {
          console.log('📋 Inventory policy: CONTINUE - allowing overselling but warning if stock is low');
          
          // SMART OVERSELLING CONTROL
          // Even with 'continue' policy, implement reasonable limits and warnings
          
          // Case 1: Use real inventory data for proper validation
          if (variantInventory === 0) {
            // When inventory shows 0, check if sales are allowed (continue policy)
            if (inventoryPolicy === 'continue') {
              console.log('✅ No inventory but sales continue policy - allowing purchase');
            } else {
              this.showStockMessage(`"${productTitle}" no tiene stock disponible.`);
              return false;
            }
          }
          // Case 2: Limited stock available
          else if (variantInventory > 0 && totalRequestedQuantity > variantInventory) {
            // Allow reasonable overselling (up to 2x available stock)
            const MAX_OVERSELL_MULTIPLIER = 2;
            const maxAllowedQuantity = Math.max(variantInventory * MAX_OVERSELL_MULTIPLIER, 3);
            
            if (totalRequestedQuantity > maxAllowedQuantity) {
              this.showStockMessage(
                `Stock limitado de "${productTitle}". ` +
                `Solo ${variantInventory} unidades disponibles. ` +
                `Máximo ${maxAllowedQuantity} unidades por cliente. ` +
                `Actualmente tienes ${currentCartQuantity} en tu carrito.`
              );
              console.log(`❌ OVERSELLING BLOCKED - Max ${maxAllowedQuantity} units allowed (2x stock rule)`);
              return false;
            } else {
              // Show warning but allow overselling within limits
              this.showStockMessage(
                `⚠️ Stock limitado: Solo ${variantInventory} unidades de "${productTitle}" disponibles. ` +
                `Tu pedido se procesará por orden de llegada.`
              );
              console.log(`⚠️ CONTROLLED OVERSELLING - ${totalRequestedQuantity}/${maxAllowedQuantity} units allowed`);
            }
          }
          // Case 3: Stock available, no issues
          else {
            console.log('✅ Sufficient stock available');
          }
        }
          } else {
            console.log('✅ No inventory tracking enabled - unlimited sales allowed');
          }
      
      console.log('✅ Stock validation passed');
      return true;
      
    } catch (error) {
      console.error('❌ Error validating stock:', error);
      this.showStockMessage('Error al validar el stock. Por favor, intenta de nuevo.');
      return false;
    }
  }
  
  detectProductStock() {
    // Only run on product pages
    if (!window.location.pathname.includes('/products/')) {
      console.log('📍 Not on a product page, skipping stock detection');
      return;
    }
    
console.log('🔍 DETECTING PRODUCT STOCK ON PAGE LOAD - VERSION 2.0 WITH RETRY MECHANISM');
    
    // Wait for inventory data to be available from Liquid template
    this.waitForInventoryData();
  }
  
  waitForInventoryData(attempts = 0) {
    const maxAttempts = 50; // Wait up to 2.5 seconds
    const retryInterval = 50; // Check every 50ms
    
    // Check if inventory data is available from Liquid template
    if (typeof window.productInventoryData !== 'undefined') {
      console.log('✅ Inventory data is now available, proceeding with stock detection');
      this.processProductStock();
      return;
    }
    
    if (attempts < maxAttempts) {
      console.log(`⏳ Waiting for inventory data... attempt ${attempts + 1}/${maxAttempts}`);
      setTimeout(() => this.waitForInventoryData(attempts + 1), retryInterval);
    } else {
      console.log('❌ No inventory data available from template after maximum wait time');
    }
  }
  
  processProductStock() {
    
    const stockData = window.productInventoryData;
    console.log('📊 INVENTORY DATA FROM LIQUID TEMPLATE:', stockData);
    
    // Log detailed stock analysis
    console.log('📈 CURRENT PRODUCT STOCK ANALYSIS:');
    console.log('🆔  Variant ID:', stockData.variant_id);
    console.log('🏷️  Product:', stockData.product_title);
    console.log('🔢  Stock Quantity:', stockData.inventory_quantity);
    console.log('📋  Inventory Policy:', stockData.inventory_policy);
    console.log('⚙️  Inventory Management:', stockData.inventory_management);
    console.log('✅  Available:', stockData.available);
    console.log('🎯  Data Source: Liquid template (server-side)');
    
    // Determine effective stock limit
    let effectiveStockLimit = null;
    if (stockData.inventory_management === 'shopify' && 
        stockData.inventory_quantity !== null && 
        stockData.inventory_quantity !== undefined) {
      effectiveStockLimit = stockData.inventory_quantity;
      console.log(`🎯 EFFECTIVE STOCK LIMIT: ${effectiveStockLimit} units`);
      
      if (effectiveStockLimit === 0) {
        console.log('🚨 PRODUCT OUT OF STOCK');
        if (stockData.inventory_policy === 'continue') {
          console.log('✅ But sales can continue (backorder allowed)');
        } else {
          console.log('❌ Sales stopped (no backorder)');
        }
      } else if (effectiveStockLimit <= 5) {
        console.log('⚠️ LOW STOCK WARNING - Limited quantity available');
      } else {
        console.log('✅ Good stock levels');
      }
    } else {
      console.log('⚠️ No inventory tracking enabled - unlimited sales allowed');
    }
    
    // Store the effective stock limit globally for use in validation
    if (effectiveStockLimit !== null) {
      window.currentProductStockLimit = effectiveStockLimit;
      console.log(`💾 Stored global stock limit: ${effectiveStockLimit}`);
    }
    
    // Also log all variants data if available
    if (typeof window.allVariantsInventoryData !== 'undefined') {
      console.log('📦 ALL VARIANTS INVENTORY DATA:', window.allVariantsInventoryData);
    }
  }
  
  getRealStockFromCSV(variantId) {
    // Map variant IDs to their real stock based on CSV data
    const stockMap = {
      '46925180240029': 2, // Scarlett & Violet: White Flare - Elite Trainer Box
      '46935041999005': 0, // Scarlett & Violet: White Flare - Elite Trainer Box (Copia)
      // Add more mappings based on your CSV data
    };
    
    return stockMap[variantId] !== undefined ? stockMap[variantId] : null;
  }
  
  showStockMessage(message) {
    console.log('📢 Showing stock message:', message);
    
    // Find or create message container on product form
    let messageContainer = document.querySelector('#stock-message-container');
    if (!messageContainer) {
      // Create container near the add to cart button
      const addButton = document.querySelector('button[name="add"], .btn--add-to-cart, [type="submit"][name="add"]');
      if (addButton) {
        messageContainer = document.createElement('div');
        messageContainer.id = 'stock-message-container';
        messageContainer.style.marginTop = '10px';
        addButton.parentNode.insertBefore(messageContainer, addButton.nextSibling);
      }
    }
    
    if (messageContainer) {
      messageContainer.innerHTML = `
        <div class="stock-validation-message" style="
          background-color: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 6px;
          padding: 12px 16px;
          color: #856404;
          font-size: 14px;
          margin: 10px 0;
          display: flex;
          align-items: center;
          font-family: inherit;
          line-height: 1.4;
        ">
          <span style="margin-right: 8px; font-size: 16px;">⚠️</span>
          <span>${message}</span>
        </div>
      `;
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        if (messageContainer && messageContainer.querySelector('.stock-validation-message')) {
          messageContainer.innerHTML = '';
        }
      }, 5000);
    } else {
      // Fallback to toast notification
      this.showNotification(message, 'warning');
    }
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
