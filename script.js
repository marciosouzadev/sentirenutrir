document.addEventListener('DOMContentLoaded', () => {
    // --- LÓGICA GERAL DA PÁGINA (MENU, ANIMAÇÕES, ETC.) ---
    const header = document.querySelector('.main-header');
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (header && !header.classList.contains('scrolled')) {
        window.addEventListener('scroll', () => {
            header.classList.toggle('scrolled', window.scrollY > 50);
        });
    }

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            menuToggle.textContent = navLinks.classList.contains('active') ? '✕' : '☰';
        });
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-in').forEach(el => {
        observer.observe(el);
    });

    // --- LÓGICA DO CARRINHO DE COMPRAS (GERAL) ---
    const cartCountElement = document.querySelector('.cart-count');
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    const saveCart = () => {
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartIcon();
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
    };

    const updateCartIcon = () => {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        if (cartCountElement) {
            cartCountElement.textContent = totalItems;
        }
    };

    const showToast = (message) => {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3500);
    };

    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            
            const productId = button.dataset.id;
            const productName = button.dataset.name;
            const productPrice = parseFloat(button.dataset.price);
            const productImage = button.dataset.image;

            if (!productId || !productName || isNaN(productPrice) || !productImage) {
                console.error("Dados do produto incompletos ou inválidos.", button.dataset);
                return;
            }

            const existingItem = cart.find(item => item.id === productId);

            if (existingItem) {
                existingItem.quantity++;
            } else {
                cart.push({ id: productId, name: productName, price: productPrice, image: productImage, quantity: 1 });
            }

            saveCart();
            showToast('Adicionado ao carrinho!');
        });
    });

    // --- LÓGICA ESPEĆIFICA DA PÁGINA DO CARRINHO ---
    if (document.querySelector('.cart-section')) {
        const cartItemsList = document.querySelector('.cart-items-list');
        const cartSubtotalElement = document.querySelector('#cart-subtotal');
        const cartTotalElement = document.querySelector('#cart-total');
        const cartContainer = document.querySelector('#cart-container');
        const emptyCartMessage = document.querySelector('#empty-cart-message');
        
        const displayCart = () => {
            if (!cartItemsList) return; 

            if (cart.length === 0) {
                cartContainer.style.display = 'none';
                emptyCartMessage.style.display = 'block';
                return;
            }

            cartContainer.style.display = 'flex';
            emptyCartMessage.style.display = 'none';
            
            cartItemsList.innerHTML = '';
            let subtotal = 0;

            cart.forEach(item => {
                const itemTotalPrice = item.price * item.quantity;
                subtotal += itemTotalPrice;

                const cartItemHTML = `
                    <div class="cart-item" data-id="${item.id}">
                        <div class="cart-item-image"><img src="${item.image}" alt="${item.name}"></div>
                        <div class="cart-item-info">
                            <h3>${item.name}</h3>
                            <span class="price">${formatPrice(item.price)}</span>
                        </div>
                        <div class="quantity-controls">
                            <button class="quantity-decrease">-</button>
                            <input type="number" value="${item.quantity}" min="1" class="quantity-input">
                            <button class="quantity-increase">+</button>
                        </div>
                        <span class="item-total-price">${formatPrice(itemTotalPrice)}</span>
                        <button class="remove-item-btn">&times;</button>
                    </div>`;
                cartItemsList.insertAdjacentHTML('beforeend', cartItemHTML);
            });

            cartSubtotalElement.textContent = formatPrice(subtotal);
            cartTotalElement.textContent = formatPrice(subtotal);
            addCartEventListeners();
        };

        const addCartEventListeners = () => {
            document.querySelectorAll('.remove-item-btn').forEach(button => {
                button.addEventListener('click', e => {
                    const itemId = e.target.closest('.cart-item').dataset.id;
                    cart = cart.filter(item => item.id !== itemId);
                    saveCart();
                    displayCart();
                });
            });

            document.querySelectorAll('.quantity-decrease').forEach(button => {
                button.addEventListener('click', e => {
                    const itemId = e.target.closest('.cart-item').dataset.id;
                    const item = cart.find(i => i.id === itemId);
                    if (item && item.quantity > 1) {
                        item.quantity--;
                        saveCart();
                        displayCart();
                    }
                });
            });

            document.querySelectorAll('.quantity-increase').forEach(button => {
                button.addEventListener('click', e => {
                    const itemId = e.target.closest('.cart-item').dataset.id;
                    const item = cart.find(i => i.id === itemId);
                    if (item) {
                        item.quantity++;
                        saveCart();
                        displayCart();
                    }
                });
            });
             
            document.querySelectorAll('.quantity-input').forEach(input => {
                input.addEventListener('change', e => {
                    const itemId = e.target.closest('.cart-item').dataset.id;
                    const item = cart.find(i => i.id === itemId);
                    if (item) {
                        let newQuantity = parseInt(e.target.value);
                        item.quantity = (newQuantity >= 1) ? newQuantity : 1;
                        saveCart();
                        displayCart();
                    }
                });
            });
        };

        // --- BOTÃO ESVAZIAR CARRINHO ---
        const emptyCartBtn = document.querySelector('#empty-cart-btn');
        if (emptyCartBtn) {
            emptyCartBtn.addEventListener('click', () => {
                if (cart.length > 0 && confirm('Tem certeza que deseja esvaziar o carrinho?')) {
                    cart = [];
                    saveCart();
                    displayCart();
                    showToast('Carrinho esvaziado.');
                }
            });
        }

        // --- BOTÃO FINALIZAR COMPRA (CORRIGIDO) ---
        const checkoutBtn = document.querySelector('.checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                if (cart.length === 0) {
                    alert('Seu carrinho está vazio!');
                    return;
                }
        
                const numeroWhatsApp = '5547997707872';
                let mensagemPedido = 'Olá! Gostaria de fazer o seguinte pedido:\n\n';
                let subtotal = 0;
        
                cart.forEach(item => {
                    const itemTotal = item.price * item.quantity;
                    subtotal += itemTotal;
                    mensagemPedido += `*Produto:* ${item.name}\n`;
                    mensagemPedido += `*Quantidade:* ${item.quantity}\n`;
                    mensagemPedido += `*Preço:* ${formatPrice(item.price)}\n`;
                    mensagemPedido += `------------------------\n`;
                });
        
                mensagemPedido += `\n*Total do Pedido:* ${formatPrice(subtotal)}`;
                const mensagemCodificada = encodeURIComponent(mensagemPedido);
                const linkWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${mensagemCodificada}`;
        
                window.open(linkWhatsApp, '_blank');
        
                // Esvazia o carrinho após enviar para o WhatsApp
                alert('Seu pedido foi enviado para o WhatsApp! Finalize a conversa por lá.');
                cart = [];
                saveCart();
                displayCart();
            });
        }
        
        // Exibe o carrinho assim que a página carregar
        displayCart();
    }

    // Atualiza o ícone em todas as páginas ao carregar
    updateCartIcon();
});