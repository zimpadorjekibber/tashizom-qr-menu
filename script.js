// Mock Data
import { db } from './firebase-config.js';
import { collection, getDocs, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// State
let menuItems = []; // Will be populated from Firestore
// ];

// State
let cart = [];
let currentCategory = 'all';

// DOM Elements
const menuGrid = document.getElementById('menu-grid');
const categoryItems = document.querySelectorAll('.category-item');
const modal = document.getElementById('item-modal');
const closeModalBtn = document.querySelector('.close-modal');
const modalImg = document.getElementById('modal-img');
const modalTitle = document.getElementById('modal-title');
const modalPrice = document.getElementById('modal-price');
const modalDesc = document.getElementById('modal-desc');
const modalTotalPrice = document.getElementById('modal-total-price');
const qtyVal = document.querySelector('.qty-val');
const qtyMinus = document.querySelector('.qty-btn.minus');
const qtyPlus = document.querySelector('.qty-btn.plus');
const addToCartBtn = document.querySelector('.add-to-cart-btn');
const cartBtn = document.querySelector('.cart-btn');
const cartItemCount = document.querySelector('.item-count');
const cartTotalPrice = document.querySelector('.total-price');
const searchInput = document.getElementById('search-input');
const cartModal = document.getElementById('cart-modal');
const closeCartBtn = document.querySelector('.close-cart');
const cartItemsContainer = document.getElementById('cart-items');
const cartSubtotal = document.getElementById('cart-subtotal');
const cartFinalTotal = document.getElementById('cart-final-total');
const checkoutBtn = document.querySelector('.checkout-btn');
const clearCartBtn = document.querySelector('.clear-cart-btn');

let currentModalItem = null;
let currentQty = 1;

// Initialize
async function init() {
    await fetchMenu();
    setupEventListeners();
    checkTableStatus();
}

let tableId = null;

function checkTableStatus() {
    const urlParams = new URLSearchParams(window.location.search);
    tableId = urlParams.get('table');

    if (!tableId) {
        // Show View Only Warning
        const warning = document.createElement('div');
        warning.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; background: #c53030; color: white; text-align: center; padding: 0.5rem; z-index: 2000; font-weight: bold;';
        warning.innerHTML = '<i class="fa-solid fa-lock"></i> View Only Mode - Scan a Table QR Code to Order';
        document.body.appendChild(warning);
        document.querySelector('.app-container').style.marginTop = '30px';
    }
}

// Fetch Menu from Firestore
async function fetchMenu() {
    try {
        const querySnapshot = await getDocs(collection(db, "menuItems"));
        menuItems = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            console.log("Fetched Item:", doc.id, data);
            menuItems.push({ id: doc.id, ...data });
        });
        console.log("Total Items Fetched:", menuItems.length);

        if (menuItems.length === 0) {
            console.log("No menu items found in 'menuItems' collection.");
            // Optional: Fallback to mock data if needed, or leave empty.
        }

        renderMenu();
    } catch (error) {
        console.error("Error fetching menu:", error);
        alert("Failed to load menu. Please check your internet connection.");
    }
}

// Render Menu
function renderMenu(items = null) {
    menuGrid.innerHTML = '';

    let filteredItems = items;
    if (!filteredItems) {
        filteredItems = currentCategory === 'all'
            ? menuItems
            : menuItems.filter(item => item.category === currentCategory);
    }

    filteredItems.forEach(item => {
        const card = document.createElement('div');
        card.className = 'menu-item-card';
        card.onclick = () => {
            if (!tableId) {
                alert('Please scan a QR code on your table to place an order.');
                return;
            }
            openModal(item);
        };

        card.innerHTML = `
            <img src="${item.image}" alt="${item.name}" class="item-img">
            <div class="item-details">
                <div>
                    <div class="item-header">
                        <h3 class="item-title">${item.name}</h3>
                    </div>
                    <p class="item-desc">${item.description}</p>
                </div>
                <div class="item-footer">
                    <span class="item-price">₹${item.price.toFixed(2)}</span>
                    <button class="add-btn-sm" ${!tableId ? 'style="opacity: 0.5; cursor: not-allowed;"' : ''}><i class="fa-solid fa-plus"></i></button>
                </div>
            </div>
        `;
        menuGrid.appendChild(card);
    });
}

// Event Listeners
function setupEventListeners() {
    // Category Filtering
    categoryItems.forEach(item => {
        item.addEventListener('click', () => {
            // Update Active State
            categoryItems.forEach(cat => cat.classList.remove('active'));
            item.classList.add('active');

            // Filter Data
            currentCategory = item.dataset.category;
            renderMenu();
        });
    });

    // Modal Controls
    closeModalBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Quantity Controls
    qtyMinus.addEventListener('click', () => {
        if (currentQty > 1) {
            currentQty--;
            updateModalPrice();
        }
    });

    qtyPlus.addEventListener('click', () => {
        currentQty++;
        updateModalPrice();
    });

    // Add to Cart
    addToCartBtn.addEventListener('click', () => {
        addToCart(currentModalItem, currentQty);
        closeModal();
    });

    // Search
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = menuItems.filter(item =>
            item.name.toLowerCase().includes(term) ||
            item.description.toLowerCase().includes(term)
        );
        renderMenu(filtered);
    });

    // Cart Modal
    cartBtn.addEventListener('click', openCart);
    closeCartBtn.addEventListener('click', closeCart);
    cartModal.addEventListener('click', (e) => {
        if (e.target === cartModal) closeCart();
    });

    clearCartBtn.addEventListener('click', clearCart);
    checkoutBtn.addEventListener('click', checkout);
}

// Modal Functions
function openModal(item) {
    currentModalItem = item;
    currentQty = 1;

    modalImg.src = item.image;
    modalTitle.textContent = item.name;
    modalPrice.textContent = `₹${item.price.toFixed(2)}`;
    modalDesc.textContent = item.description;

    updateModalPrice();

    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function updateModalPrice() {
    qtyVal.textContent = currentQty;
    const total = currentModalItem.price * currentQty;
    modalTotalPrice.textContent = `₹${total.toFixed(2)}`;
}

// Cart Functions
function addToCart(item, qty) {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);

    if (existingItem) {
        existingItem.qty += qty;
    } else {
        cart.push({ ...item, qty });
    }

    updateCartUI();

    // Simple animation for feedback
    cartBtn.style.transform = 'scale(1.05)';
    setTimeout(() => cartBtn.style.transform = 'scale(1)', 200);
}

function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    const totalCost = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    cartItemCount.textContent = `${totalItems} Item${totalItems !== 1 ? 's' : ''}`;
    cartTotalPrice.textContent = `₹${totalCost.toFixed(2)}`;
}

// Cart Modal Functions
function openCart() {
    renderCartItems();
    cartModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCart() {
    cartModal.classList.remove('active');
    document.body.style.overflow = '';
}

function renderCartItems() {
    cartItemsContainer.innerHTML = '';

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart-msg">
                <i class="fa-solid fa-basket-shopping"></i>
                <p>Your cart is empty</p>
            </div>
        `;
        cartSubtotal.textContent = '₹0.00';
        cartFinalTotal.textContent = '₹0.00';
        return;
    }

    let total = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.qty;
        total += itemTotal;

        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <img src="${item.image}" alt="${item.name}" class="cart-item-img">
            <div class="cart-item-details">
                <div class="item-header">
                    <h4 class="cart-item-title">${item.name}</h4>
                    <span class="cart-item-price">₹${itemTotal.toFixed(2)}</span>
                </div>
                <div class="cart-item-controls">
                    <div class="cart-qty-control">
                        <button class="cart-qty-btn" onclick="updateCartItem(${item.id}, -1)"><i class="fa-solid fa-minus"></i></button>
                        <span class="cart-qty-val">${item.qty}</span>
                        <button class="cart-qty-btn" onclick="updateCartItem(${item.id}, 1)"><i class="fa-solid fa-plus"></i></button>
                    </div>
                </div>
            </div>
        `;
        cartItemsContainer.appendChild(cartItem);
    });

    cartSubtotal.textContent = `₹${total.toFixed(2)}`;
    cartFinalTotal.textContent = `₹${total.toFixed(2)}`;
}

function updateCartItem(id, change) {
    const itemIndex = cart.findIndex(item => item.id === id);
    if (itemIndex > -1) {
        cart[itemIndex].qty += change;
        if (cart[itemIndex].qty <= 0) {
            cart.splice(itemIndex, 1);
        }
        updateCartUI();
        renderCartItems();
    }
}

function clearCart() {
    if (confirm('Are you sure you want to clear your cart?')) {
        cart = [];
        updateCartUI();
        renderCartItems();
    }
}

async function checkout() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }

    // Get Customer Details
    const customerName = document.getElementById('customer-name').value.trim();
    const customerPhone = document.getElementById('customer-phone').value.trim();

    if (!customerName || !customerPhone) {
        alert('Please enter your Name and Phone Number to place the order.');
        return;
    }

    // Get Table Info
    const urlParams = new URLSearchParams(window.location.search);
    const tableInfo = urlParams.get('table') || 'Unknown Table';

    // Calculate Total
    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    const orderData = {
        table: tableInfo,
        customerName: customerName,
        customerPhone: customerPhone,
        items: cart,
        totalAmount: total,
        status: 'pending',
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString()
    };

    try {
        const docRef = await addDoc(collection(db, "orders"), orderData);
        console.log("Order placed with ID: ", docRef.id);

        alert(`Order Placed Successfully!\nOrder ID: ${docRef.id}\n\nWe will start preparing your food shortly.`);

        cart = [];
        updateCartUI();
        closeCart();
    } catch (e) {
        console.error("Error adding document: ", e);
        alert("Failed to place order. Please try again.\nError: " + e.message);
    }
}

// Expose global functions for inline HTML handlers
window.updateCartItem = updateCartItem;

// Start
init();
