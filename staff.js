/* STAFF PORTAL LOGIC */
import { db } from './firebase-config.js';
import { collection, query, onSnapshot, doc, updateDoc, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const grid = document.getElementById('orders-grid');
const loading = document.getElementById('loading-msg');
const statCount = document.getElementById('stat-count');
const statSales = document.getElementById('stat-sales');
let ordersMap = new Map();
let rejectTargetId = null;

// --- INIT ---
function init() {
    // Check Auth?
    // Check Auth
    if (!sessionStorage.getItem('userRole')) window.location.href = 'login.html';

    const q = query(collection(db, "orders")); // simplified query to avoid index issues

    onSnapshot(q, (snapshot) => {
        const docs = [];
        snapshot.forEach(d => docs.push({ id: d.id, ...d.data() }));

        // Client side sort
        docs.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

        loading.style.display = 'none';
        renderOrders(docs);
        calcStats(docs);
    });
}

// --- RENDER ---
function renderOrders(orders) {
    grid.innerHTML = '';
    ordersMap.clear();

    orders.forEach(order => {
        ordersMap.set(order.id, order);

        // Filter finished orders if needed? No, show all sorted by date.
        // Maybe hide completed orders older than 24h? For now show all.

        const card = document.createElement('div');
        const statusClass = (order.status || 'new').toLowerCase();
        card.className = `order-card ${statusClass}`;

        // Status Badge Color
        let statusColor = '#999';
        if (statusClass === 'pending') statusColor = 'var(--warning)';
        if (statusClass === 'completed') statusColor = 'var(--success)';
        if (statusClass === 'rejected') statusColor = 'var(--danger)';

        // Items List
        const itemsHtml = (order.items || []).map(i => `
            <div style="display:flex; justify-content:space-between; margin-bottom:5px; border-bottom:1px dashed #eee;">
                <span><strong>${i.qty}x</strong> ${i.name}</span>
                <span>₹${i.price * i.qty}</span>
            </div>
        `).join('');

        // Action Buttons
        let actionsHtml = '';
        const status = (order.status || 'new').toLowerCase();

        if (status === 'new') {
            actionsHtml = `
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:15px;">
                    <button class="btn btn-secondary" onclick="window.handleStatus('${order.id}', 'rejected')" style="color:var(--danger); border-color:var(--danger);">Reject</button>
                    <button class="btn btn-primary" onclick="window.handleStatus('${order.id}', 'pending')" style="background:var(--warning);">Accept</button>
                </div>
            `;
        } else if (status === 'pending') {
            actionsHtml = `
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:15px;">
                    <button class="btn btn-secondary" onclick="window.viewBill('${order.id}')">Print Bill</button>
                    <button class="btn btn-primary" onclick="window.handleStatus('${order.id}', 'completed')" style="background:var(--success);">Complete</button>
                </div>
            `;
        } else {
            actionsHtml = `
                <div style="margin-top:15px;">
                    <button class="btn btn-secondary" style="width:100%" onclick="window.viewBill('${order.id}')">Reprint Bill</button>
                </div>
            `;
        }

        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:15px;">
                <span style="font-weight:800; font-size:1.2rem;">Table ${order.table}</span>
                <span style="background:${statusColor}; color:white; padding:4px 12px; border-radius:12px; font-size:0.8rem; text-transform:uppercase; font-weight:700;">${order.status || 'New'}</span>
            </div>
            <div style="margin-bottom:15px; font-size:0.9rem; color:#666;">
                <i class="fa-solid fa-user"></i> ${order.customerName} <br>
                <i class="fa-solid fa-phone"></i> ${order.customerPhone}
            </div>
            <div style="margin-bottom:15px;">
                ${itemsHtml}
            </div>
            <div style="text-align:right; font-weight:800; font-size:1.1rem; margin-bottom:10px;">
                Total: ₹${order.totalAmount}
            </div>
            ${actionsHtml}
        `;
        grid.appendChild(card);
    });
}

// --- ACTIONS ---
window.handleStatus = async (id, status) => {
    if (status === 'rejected') {
        rejectTargetId = id;
        openRejectModal(id);
        return;
    }
    await updateDoc(doc(db, "orders", id), { status });
};

// Stats
function calcStats(orders) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let count = 0;
    let sales = 0;

    orders.forEach(o => {
        const d = o.createdAt ? new Date(o.createdAt) : new Date(0);
        if (d >= today) {
            count++;
            if (o.status === 'completed') sales += (o.totalAmount || 0);
        }
    });

    statCount.innerText = count;
    statSales.innerText = '₹' + sales;
}

// Reject Logic
window.openRejectModal = (id) => {
    const o = ordersMap.get(id);
    const container = document.getElementById('reject-items');
    container.innerHTML = o.items.map(i => `
        <label style="display:flex; gap:10px; padding:10px; border:1px solid #eee; margin-bottom:5px; border-radius:8px;">
            <input type="checkbox" class="stock-check" value="${i.id}">
            <span>${i.name} (Mark Out of Stock)</span>
        </label>
    `).join('');
    document.getElementById('reject-modal').classList.add('open');
};

window.confirmReject = async () => {
    if (!rejectTargetId) return;

    // Get checked
    const checks = document.querySelectorAll('.stock-check:checked');
    const outOfStockIds = Array.from(checks).map(c => c.value);

    // Update Menu
    if (outOfStockIds.length > 0) {
        const updates = outOfStockIds.map(mid => updateDoc(doc(db, "menuItems", mid), { available: false }));
        await Promise.all(updates);
    }

    // Update Order
    await updateDoc(doc(db, "orders", rejectTargetId), { status: 'rejected' });

    document.getElementById('reject-modal').classList.remove('open');
};

// Printing Bill
window.viewBill = (id) => {
    const o = ordersMap.get(id);
    const w = window.open('', '_blank', 'width=400,height=600');
    w.document.write(`
        <html><body style="font-family:monospace; padding:20px;">
        <h2 style="text-align:center">TASHIZOM</h2>
        <div style="text-align:center">Guest Check</div>
        <hr>
        <div>Table: ${o.table}</div>
        <div>Name: ${o.customerName}</div>
        <div>Date: ${new Date().toLocaleString()}</div>
        <hr>
        ${o.items.map(i => `<div style="display:flex; justify-content:space-between;"><span>${i.qty} x ${i.name}</span><span>${i.price * i.qty}</span></div>`).join('')}
        <hr>
        <div style="display:flex; justify-content:space-between; font-weight:bold;"><span>TOTAL</span><span>₹${o.totalAmount}</span></div>
        <br><br>
        <div style="text-align:center">Thank You!</div>
        <button onclick="window.print()" style="width:100%; padding:10px; background:black; color:white; margin-top:20px;">PRINT</button>
        </body></html>
    `);
};

init();
