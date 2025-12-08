/* TASHIZOM CUSTOMER APP V2 */
import { db } from './firebase-config.js';
import { collection, getDocs, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- STATE ---
let menuData = [];
let cart = [];
let currentItem = null; // For modal
let modalQty = 1;
const tableId = new URLSearchParams(window.location.search).get('table');

// --- DOM ELEMENTS ---
const grid = document.getElementById('menu-grid');
const loading = document.getElementById('menu-loading');
const catNav = document.getElementById('category-wrapper');
const searchInput = document.getElementById('search-input');
const itemModal = document.getElementById('item-modal');
const cartModal = document.getElementById('cart-modal');
const cartBar = document.getElementById('cart-bar');

// --- INIT ---
async function init() {
    try {
        console.log("Fetching menu...");
        const snap = await getDocs(collection(db, "menuItems"));
        snap.forEach(doc => {
            menuData.push({ id: doc.id, ...doc.data() });
        });

        loading.style.display = 'none';

        if (menuData.length === 0) {
            grid.innerHTML = '<p class="text-center">No menu items found.</p>';
            return;
        }

        renderCategories();
        renderMenu(); // Initial render all

        // Listeners
        searchInput.addEventListener('input', (e) => filterMenu(e.target.value));

    } catch (e) {
        console.error(e);
        loading.innerHTML = `<div style="color:red">Error loading menu: ${e.message}</div>`;
    }
}

// --- RENDERING ---
function renderCategories() {
    const categories = ['all', ...new Set(menuData.map(i => i.category || 'other'))];

    catNav.innerHTML = categories.map(cat => `
        <button class="cat-chip ${cat === 'all' ? 'active' : ''}" 
            onclick="setCategory('${cat}')">
            ${cat.charAt(0).toUpperCase() + cat.slice(1)}
        </button>
    `).join('');
}

window.setCategory = (cat) => {
    // Update Active UI
    document.querySelectorAll('.cat-chip').forEach(btn => {
        btn.classList.toggle('active', btn.innerText.toLowerCase() === cat.toLowerCase() || (cat === 'all' && btn.innerText === 'All'));
    });

    // Filter
    currentCatergory = cat; // helper var if needed

    if (cat === 'all') {
        renderMenu(menuData);
    } else {
        renderMenu(menuData.filter(i => i.category === cat));
    }
};

function renderMenu(items = menuData) {
    grid.innerHTML = '';

    items.forEach(item => {
        const isSoldOut = item.available === false;

        const card = document.createElement('div');
        card.className = 'menu-card';
        card.onclick = () => openItemModal(item);

        card.innerHTML = `
            <div class="card-img-wrap">
                <img src="${item.image || 'assets/default_food.png'}" class="card-img" alt="${item.name}" loading="lazy" style="${isSoldOut ? 'filter: grayscale(100%);' : ''}">
                ${isSoldOut ? '<div class="sold-out-overlay">SOLD OUT</div>' : ''}
            </div>
            <div class="card-content">
                <div class="card-title">${item.name}</div>
                <div class="card-desc">${item.description || ''}</div>
                <div class="card-footer">
                    <div class="price-tag">₹${item.price}</div>
                    <button class="btn-icon btn-primary" style="width: 32px; height: 32px; font-size:0.8rem;" ${isSoldOut ? 'disabled style="background:#ccc;"' : ''}>
                        <i class="fa-solid fa-plus"></i>
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function filterMenu(query) {
    const q = query.toLowerCase();
    const filtered = menuData.filter(i =>
        i.name.toLowerCase().includes(q) ||
        (i.description && i.description.toLowerCase().includes(q))
    );
    renderMenu(filtered);
}

// --- ITEM MODAL LOGIC ---
window.openItemModal = (item) => {
    if (item.available === false) return; // Can't open sold out

    currentItem = item;
    modalQty = 1;

    document.getElementById('modal-title').innerText = item.name;
    document.getElementById('modal-price').innerText = item.price;
    document.getElementById('modal-desc').innerText = item.description || 'No description available.';
    document.getElementById('modal-img').src = item.image || 'assets/default_food.png';
    document.getElementById('modal-qty').innerText = 1;

    itemModal.classList.add('open');
};

window.adjQty = (delta) => {
    if (modalQty + delta >= 1) {
        modalQty += delta;
        document.getElementById('modal-qty').innerText = modalQty;
    }
};

window.addToCart = () => {
    if (!currentItem) return;

    // Check if in cart, update qty
    const existing = cart.find(i => i.id === currentItem.id);
    if (existing) {
        existing.qty += modalQty;
    } else {
        cart.push({ ...currentItem, qty: modalQty });
    }

    updateCartUI();
    itemModal.classList.remove('open');
};

// --- CART LOGIC ---
function updateCartUI() {
    const totalQty = cart.reduce((sum, i) => sum + i.qty, 0);
    const totalAmount = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);

    document.getElementById('cart-count').innerText = totalQty;
    document.getElementById('cart-total').innerText = totalAmount;

    // Show bar if not empty
    if (totalQty > 0) cartBar.classList.add('visible');
    else cartBar.classList.remove('visible');
}

window.openCartModal = () => {
    if (cart.length === 0) return;
    renderCartList();
    cartModal.classList.add('open');
};

function renderCartList() {
    const container = document.getElementById('cart-items');
    container.innerHTML = '';
    let total = 0;

    cart.forEach((item, idx) => {
        const itemTotal = item.price * item.qty;
        total += itemTotal;

        const row = document.createElement('div');
        row.style.cssText = "display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px dashed #eee; padding-bottom: 10px;";
        row.innerHTML = `
            <div>
                <div style="font-weight:600;">${item.name}</div>
                <div style="font-size:0.9rem; color:#666;">₹${item.price} x ${item.qty}</div>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-weight:700;">₹${itemTotal}</span>
                <button onclick="removeFromCart(${idx})" style="color:red; background:none; border:none;"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
        container.appendChild(row);
    });

    document.getElementById('cart-final-total').innerText = total;
}

window.removeFromCart = (idx) => {
    cart.splice(idx, 1);
    updateCartUI();
    renderCartList();
    if (cart.length === 0) cartModal.classList.remove('open');
};

// --- CHECKOUT ---
window.placeOrder = async () => {
    if (!tableId) {
        alert("Wait! You are in View-Only mode.\nPlease scan the QR code on your table to place an order.");
        return;
    }

    const name = document.getElementById('cust-name').value;
    const phone = document.getElementById('cust-phone').value;

    if (!name || !phone) {
        alert("Please enter your Name and Phone Number to complete the order.");
        return;
    }

    const btn = document.querySelector('#cart-modal .btn-primary');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Placing Order...';
    btn.disabled = true;

    try {
        const totalAmount = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);

        const orderData = {
            items: cart,
            totalAmount: totalAmount,
            table: tableId,
            customerName: name,
            customerPhone: phone,
            status: 'new', // Set to 'new' so staff can Accept/Reject
            createdAt: new Date().toISOString() // String simpler for sorting
        };

        await addDoc(collection(db, "orders"), orderData);

        // Success
        cart = [];
        updateCartUI();
        cartModal.classList.remove('open');
        alert(`Order Placed Successfully!\nTotal: ₹${totalAmount}\nWe will serve you shortly.`);

        // Reset UI
        btn.innerHTML = originalText;
        btn.disabled = false;

    } catch (e) {
        console.error(e);
        alert("Failed to place order: " + e.message);
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
};

// Start
init();
