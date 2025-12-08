import { db } from './firebase-config.js';
import { collection, getDocs, addDoc, query, orderBy, onSnapshot, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- Menu Management ---
async function loadMenu() {
    const list = document.getElementById('menu-list');
    try {
        const snap = await getDocs(collection(db, "menuItems"));
        list.innerHTML = '';
        document.getElementById('menu-loading').style.display = 'none';

        snap.forEach(d => {
            const data = d.data();
            const id = d.id;
            const isAvailable = data.available !== false; // Default true

            const el = document.createElement('div');
            el.className = 'menu-item-row';
            el.innerHTML = `
                <img src="${data.image || 'assets/default_food.png'}">
                <div class="menu-info">
                    <h4 style="margin:0">${data.name}</h4>
                    <span style="color:#777; font-size:0.9rem">₹${data.price} - ${data.category}</span>
                    ${!isAvailable ? '<span style="color:red; font-size:0.8rem; font-weight:bold; margin-left:10px;">(SOLD OUT)</span>' : ''}
                </div>
                <div class="menu-actions" style="display:flex; align-items:center; gap:10px;">
                    <label style="display:flex; align-items:center; gap:5px; font-size:0.8rem; cursor:pointer;">
                        <input type="checkbox" ${isAvailable ? 'checked' : ''} onchange="window.toggleStock('${id}', this.checked)">
                        In Stock
                    </label>
                    <button class="btn" style="padding:0.5rem; background:#fee;" onclick="alert('Edit feature coming soon')"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn" style="padding:0.5rem; background:#fee; color:red;" onclick="alert('Delete feature coming soon')"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;
            list.appendChild(el);
        });
    } catch (e) {
        list.innerHTML = 'Error loading menu: ' + e.message;
    }
}

window.toggleStock = async function (id, status) {
    try {
        await updateDoc(doc(db, "menuItems", id), { available: status });
        // Optional: reload menu to update "SOLD OUT" text
        loadMenu();
    } catch (e) {
        alert("Error updating stock: " + e.message);
    }
};

// Save New Item
window.saveNewItem = async function () {
    const name = document.getElementById('new-name').value;
    const price = parseFloat(document.getElementById('new-price').value);
    const category = document.getElementById('new-category').value;
    const description = document.getElementById('new-desc').value;
    const image = document.getElementById('new-image').value;

    if (!name || !price) return alert('Please key in name and price');

    try {
        await addDoc(collection(db, "menuItems"), {
            name, price, category, description, image
        });
        alert('Item Saved!');
        closeAddModal();
        loadMenu(); // Refresh
    } catch (e) {
        alert('Error saving: ' + e.message);
    }
};


// --- Live Orders (Admin View) ---
function loadOrders() {
    const grid = document.getElementById('admin-orders-grid');
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));

    onSnapshot(q, (snapshot) => {
        grid.innerHTML = '';
        let count = 0;

        snapshot.forEach(doc => {
            const order = doc.data();
            const card = document.createElement('div');
            card.className = 'card';
            card.style.borderLeft = order.status === 'completed' ? '5px solid green' : '5px solid orange';

            const itemsHtml = (order.items || []).map(i => `<div>${i.qty}x ${i.name}</div>`).join('');

            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                    <strong>${order.table || 'No Table'}</strong>
                    <span style="font-size:0.8rem; color:#888;">${order.status}</span>
                </div>
                <div style="font-size:0.9rem; margin-bottom:0.5rem; padding-bottom:0.5rem; border-bottom:1px solid #eee;">
                    <i class="fa-solid fa-user"></i> ${order.customerName || 'Guest'}<br>
                    <i class="fa-solid fa-phone"></i> ${order.customerPhone || '-'}
                </div>
                <div style="margin-bottom:0.5rem;">${itemsHtml}</div>
                <div style="font-weight:bold; text-align:right;">Total: ₹${(order.totalAmount || 0).toFixed(2)}</div>
            `;
            grid.appendChild(card);
            count++;
        });

        document.getElementById('stat-total-orders').textContent = count;
    });
}

// Initial Load
loadMenu();
loadOrders();
