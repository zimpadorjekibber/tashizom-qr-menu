/* ADMIN LOGIC */
import { db } from './firebase-config.js';
import { collection, getDocs, addDoc, updateDoc, doc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const list = document.getElementById('menu-list');
const ordersList = document.getElementById('orders-list');

async function init() {
    if (sessionStorage.getItem('userRole') !== 'admin') window.location.href = 'login.html';
    loadMenu();
    initOrders();
}

window.currentMenuItems = [];

// --- ORDERS LOGIC ---
function initOrders() {
    const q = query(collection(db, "orders")); // You can add orderBy('createdAt', 'desc') if index exists

    onSnapshot(q, (snapshot) => {
        const orders = [];
        snapshot.forEach(d => orders.push({ id: d.id, ...d.data() }));

        // Sort locally to avoid composite index requirement
        orders.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

        renderAdminOrders(orders);
    });
}

function renderAdminOrders(orders) {
    ordersList.innerHTML = '';

    if (orders.length === 0) {
        ordersList.innerHTML = '<p>No orders found.</p>';
        return;
    }

    orders.forEach(order => {
        const card = document.createElement('div');
        const status = (order.status || 'new').toLowerCase();

        // Colors
        let statusColor = '#ddd';
        if (status === 'new') statusColor = 'var(--primary)'; // Blue
        if (status === 'pending') statusColor = 'var(--warning)'; // Orange
        if (status === 'completed') statusColor = 'var(--success)'; // Green
        if (status === 'rejected') statusColor = 'var(--danger)'; // Red

        const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Date Unknown';

        // Items HTML
        const itemsHtml = (order.items || []).map(i => `
            <div style="font-size:0.9rem; border-bottom:1px dashed #eee; margin-bottom:4px;">
                <b>${i.qty}x</b> ${i.name}
            </div>
        `).join('');

        card.style.cssText = `background:white; padding:15px; border-radius:12px; box-shadow:0 2px 5px rgba(0,0,0,0.05); border-left: 5px solid ${statusColor};`;

        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                <span style="font-weight:800;">Table ${order.table}</span>
                <span style="font-size:0.8rem; background:#f4f4f4; padding:2px 8px; border-radius:4px;">${status.toUpperCase()}</span>
            </div>
            
            <div style="font-size:0.8rem; color:#666; margin-bottom:10px;">
                <i class="fa-regular fa-clock"></i> ${dateStr}<br>
                <i class="fa-solid fa-user"></i> ${order.customerName} (${order.customerPhone})
            </div>

            <div style="margin-bottom:15px;">
                ${itemsHtml}
            </div>

            <div style="text-align:right; font-weight:700; font-size:1.1rem; border-top:1px solid #eee; padding-top:10px;">
                Total: ₹${order.totalAmount}
            </div>
        `;
        ordersList.appendChild(card);
    });
}

// --- MENU LOGIC ---
async function loadMenu() {
    try {
        const snap = await getDocs(collection(db, "menuItems"));
        list.innerHTML = '';

        const items = [];
        snap.forEach(d => items.push({ id: d.id, ...d.data() }));

        window.currentMenuItems = items; // Update cache

        // Sort by category then name
        items.sort((a, b) => (a.category || '').localeCompare(b.category || '') || a.name.localeCompare(b.name));

        items.forEach(data => {
            const id = data.id;
            const isRef = data.available !== false;

            const row = document.createElement('div');
            row.style.cssText = "display:flex; justify-content:space-between; align-items:center; background:white; padding:15px; border-radius:12px; box-shadow:0 2px 5px rgba(0,0,0,0.05);";

            row.innerHTML = `
                <div style="display:flex; align-items:center; gap:15px;">
                    <img src="${data.image || 'assets/default_food.png'}" style="width:50px; height:50px; border-radius:8px; object-fit:cover; ${!isRef ? 'filter:grayscale(100%)' : ''}">
                    <div>
                        <div style="font-weight:700; ${!isRef ? 'text-decoration:line-through; color:#999' : ''}">${data.name}</div>
                        <div style="font-size:0.8rem; color:#888; margin-bottom:2px;">${data.category || 'General'}</div>
                        <div style="font-size:0.9rem; color:#666;">₹${data.price}</div>
                    </div>
                </div>
                <div style="display:flex; flex-direction:column; gap:8px; align-items:flex-end;">
                     <label class="btn btn-secondary" style="font-size:0.8rem; padding: 5px 10px;">
                        <input type="checkbox" ${isRef ? 'checked' : ''} onchange="window.toggleStock('${id}', this.checked)"> In Stock
                     </label>
                     <button class="btn btn-secondary" onclick="window.editItem('${id}')" style="font-size:0.8rem; padding: 5px 10px;">
                        <i class="fa-solid fa-pen"></i> Edit
                     </button>
                </div>
            `;
            list.appendChild(row);
        });
    } catch (e) {
        console.error(e);
        list.innerHTML = "Error loading menu.";
    }
}

window.toggleStock = async (id, status) => {
    await updateDoc(doc(db, "menuItems", id), { available: status });
    loadMenu(); // Refresh UI
};

window.menuCache = {}; // Local cache for editing

window.saveItem = async () => {
    const id = document.getElementById('edit-id').value;
    const name = document.getElementById('new-name').value;
    const price = parseFloat(document.getElementById('new-price').value);
    const category = document.getElementById('new-cat').value;
    const desc = document.getElementById('new-desc').value;
    const image = document.getElementById('new-img').value;

    if (!name || !price) return alert("Requires name and price");

    const itemData = { name, price, category, description: desc, image };

    if (id) {
        // Update
        await updateDoc(doc(db, "menuItems", id), itemData);
    } else {
        // New
        await addDoc(collection(db, "menuItems"), { ...itemData, available: true });
    }

    document.getElementById('add-modal').classList.remove('open');
    loadMenu();
};

window.editItem = (id) => {
    const item = window.currentMenuItems.find(i => i.id === id);
    if (!item) return;

    document.getElementById('edit-id').value = id;
    document.getElementById('new-name').value = item.name;
    document.getElementById('new-price').value = item.price;
    document.getElementById('new-cat').value = item.category || '';
    document.getElementById('new-desc').value = item.description || '';
    document.getElementById('new-img').value = item.image || '';

    document.getElementById('modal-title').innerText = "Edit Menu Item";
    document.getElementById('add-modal').classList.add('open');
};

window.openAddModal = () => {
    document.getElementById('edit-id').value = '';
    document.getElementById('new-name').value = '';
    document.getElementById('new-price').value = '';
    document.getElementById('new-cat').value = '';
    document.getElementById('new-desc').value = '';
    document.getElementById('new-img').value = '';

    document.getElementById('modal-title').innerText = "Add Menu Item";
    document.getElementById('add-modal').classList.add('open');
};

// --- QR LOGIC ---
window.generateQRs = () => {
    const start = parseInt(document.getElementById('qr-start').value);
    const end = parseInt(document.getElementById('qr-end').value);
    const container = document.getElementById('qr-grid');
    const output = document.getElementById('qr-section-output');

    if (!start || !end || end < start) return alert("Please enter a valid range of table numbers.");

    container.innerHTML = '';
    output.style.display = 'block';

    for (let i = start; i <= end; i++) {
        // Wrapper for each QR
        const wrap = document.createElement('div');
        wrap.style.cssText = "text-align:center; border:1px solid #ccc; padding:15px; border-radius:8px; width:220px; page-break-inside: avoid;";

        // Editable Title Input
        const nameInput = document.createElement('input');
        nameInput.value = `Table ${i}`;
        nameInput.style.cssText = "font-size:1.2rem; font-weight:bold; text-align:center; border:none; border-bottom:1px dashed #ccc; width:100%; margin-bottom:15px; padding:5px; outline:none;";
        wrap.appendChild(nameInput);

        // QR Div container
        const qrDiv = document.createElement('div');
        qrDiv.style.cssText = "display:flex; justify-content:center;";
        wrap.appendChild(qrDiv);

        // Function to render/update QR
        const updateQR = (val) => {
            qrDiv.innerHTML = '';
            // Use the full value as ID (e.g. "VIP Table" -> table=VIP Table)
            const url = `https://dineflow-fndvc.web.app/index.html?table=${encodeURIComponent(val)}`;
            new QRCode(qrDiv, { text: url, width: 150, height: 150 });
        };

        // Trigger update on change
        nameInput.onkeyup = (e) => updateQR(e.target.value);
        nameInput.onchange = (e) => updateQR(e.target.value);

        // Initial
        updateQR(nameInput.value);

        container.appendChild(wrap);
    }
};

init();
