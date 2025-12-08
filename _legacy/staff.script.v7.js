import { db } from './firebase-config.js';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const ordersGrid = document.querySelector('.orders-grid');
const loadingMsg = document.querySelector('.loading-msg');
const ordersMap = new Map(); // Global map for printing

console.log("Staff Script v7 Loaded (Reject Workflow)");

// Listen for Orders - SIMPLIFIED QUERY (No sorting temporarily)
const q = query(collection(db, "orders"));

onSnapshot(q, (snapshot) => {
    console.log("Got snapshot", snapshot.size);
    if (loadingMsg) {
        loadingMsg.style.display = 'none';
        loadingMsg.textContent = "Loaded!";
    }

    ordersGrid.innerHTML = ''; // Clear current grid

    if (snapshot.empty) {
        ordersGrid.innerHTML = '<p style="grid-column:1/-1;text-align:center; color:#777;">No active orders found in DB.</p>';
        return;
    }

    // Manual Sort
    const docs = [];
    snapshot.forEach(d => docs.push({ id: d.id, ...d.data() }));
    docs.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    // Calculate Stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let todayOrders = 0;
    let todaySales = 0;

    docs.forEach((order) => {
        // Stats Logic
        const orderDate = order.createdAt ? new Date(order.createdAt) : new Date(0); // Epoch if invalid
        if (orderDate >= today) {
            todayOrders++;
            if (order.status === 'completed') {
                todaySales += (order.totalAmount || 0);
            }
        }

        // Render Card
        ordersMap.set(order.id, order);
        renderOrderCard(order);
    });

    // Update UI
    const countEl = document.getElementById('stat-orders-count');
    const salesEl = document.getElementById('stat-sales-total');
    if (countEl) countEl.textContent = todayOrders;
    if (salesEl) salesEl.textContent = '₹' + todaySales.toFixed(0);

}, (error) => {
    console.error("Error fetching orders:", error);
    if (loadingMsg) loadingMsg.textContent = "CRITICAL ERROR: " + error.message;
    alert("CRITICAL ERROR LOADING ORDERS:\n" + error.message);
});

function renderOrderCard(order) {
    if (order.status === 'rejected') return;

    // Create Card
    const card = document.createElement('div');
    card.className = 'order-card';
    card.id = `card-${order.id}`;

    // Status Logic
    let statusColor = '#ff4757'; // Red (Pending)
    let statusText = 'Pending';

    // Treat unknown status or 'new' as pending for compatibility
    if (!order.status || order.status === 'new') {
        order.status = 'pending';
    }

    if (order.status === 'preparing') {
        statusColor = '#e67e22'; // Orange
        statusText = 'Preparing';
    }
    else if (order.status === 'completed') {
        statusColor = '#2ecc71'; // Green
        statusText = 'Served';
    }

    // Time
    const date = order.createdAt ? new Date(order.createdAt) : new Date();
    const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Items Logic
    const itemsHtml = (order.items || []).map(item => `
        <div style="display:flex; justify-content:space-between; margin-bottom:4px; border-bottom:1px dashed #eee; padding-bottom:4px;">
            <span><strong>${item.qty}x</strong> ${item.name}</span>
            <span style="color:#666;">₹${item.price}</span>
        </div>
    `).join('');

    // Buttons Logic
    let buttonsHtml = '';

    if (order.status === 'pending') {
        // Pending State
        buttonsHtml = `
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:1rem;">
                <button onclick="window.updateOrderStatus('${order.id}', 'rejected')" style="background:#ff6b6b; color:white; border:none; padding:10px; border-radius:8px; cursor:pointer;">Reject</button>
                <button onclick="window.updateOrderStatus('${order.id}', 'preparing')" style="background:#2ecc71; color:white; border:none; padding:10px; border-radius:8px; cursor:pointer;">Accept</button>
            </div>
        `;
    } else if (order.status === 'preparing') {
        // Preparing State
        buttonsHtml = `
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:1rem;">
                <button onclick="window.printKOT('${order.id}')" style="background:#34495e; color:white; border:none; padding:8px; border-radius:8px; cursor:pointer;"><i class="fa-solid fa-print"></i> KOT</button>
                <button onclick="window.printBill('${order.id}')" style="background:#34495e; color:white; border:none; padding:8px; border-radius:8px; cursor:pointer;"><i class="fa-solid fa-receipt"></i> Bill</button>
            </div>
            <button onclick="window.updateOrderStatus('${order.id}', 'completed')" class="complete-btn" style="background:#27ae60; margin-top:10px;">Mark Served (Complete)</button>
        `;
    } else {
        // Completed State
        buttonsHtml = `<div style="text-align:center; margin-top:1rem; padding:10px; background:#e8f5e9; border-radius:8px; color:#2e7d32; font-weight:bold;">Order Completed</div>`;
    }

    card.innerHTML = `
        <div class="order-header">
            <span class="table-badge" style="background:${statusColor}">${order.table || 'Unknown'} - ${statusText}</span>
            <span class="order-time">${timeString}</span>
        </div>
        
        <div class="customer-info" style="color:#000;">
            <p><strong><i class="fa-solid fa-user"></i></strong> ${order.customerName || 'Guest'}</p>
            <p><strong><i class="fa-solid fa-phone"></i></strong> ${order.customerPhone || 'N/A'}</p>
        </div>

        <div class="order-items" style="color:#000;">
            ${itemsHtml}
        </div>

        <div class="order-total" style="color:#000;">
            Total: ₹${(order.totalAmount || 0).toFixed(2)}
        </div>

        ${buttonsHtml}
    `;

    ordersGrid.appendChild(card);
}

// Global Functions
window.updateOrderStatus = async function (id, status) {
    if (status === 'rejected') {
        openRejectModal(id);
        return;
    }

    try {
        await updateDoc(doc(db, "orders", id), { status: status });
    } catch (e) {
        alert('Error updating status: ' + e.message);
        console.error(e);
    }
};

// Reject Modal Logic
function openRejectModal(orderId) {
    const order = ordersMap.get(orderId);
    if (!order) return;

    // Create Modal UI dynamically
    const modalId = 'reject-modal';
    let modal = document.getElementById(modalId);

    // Items checkboxes
    const itemsHtml = (order.items || []).map(item => `
        <div style="margin-bottom: 10px; padding: 10px; border: 1px solid #eee; border-radius: 8px;">
            <label style="display: flex; align-items: center; cursor: pointer;">
                <input type="checkbox" class="unavailable-item" value="${item.id}" data-name="${item.name}" style="width: 20px; height: 20px; margin-right: 15px;">
                <div>
                    <strong style="display:block;">${item.name}</strong>
                    <span style="font-size: 12px; color: #666;">Check if Out of Stock</span>
                </div>
            </label>
        </div>
    `).join('');

    const modalContent = `
        <div style="background: white; padding: 25px; border-radius: 16px; width: 90%; max-width: 400px; max-height: 90vh; overflow-y: auto; text-align: left;">
            <h2 style="margin-top:0; color: #d63031;">Reject Order</h2>
            <p style="color: #666; font-size: 14px; margin-bottom: 20px;">
                You are rejecting the order for <strong>${order.customerName || 'Guest'}</strong> (Table ${order.table}).
                <br><br>
                If any item is <strong>Out of Stock</strong>, check it below to automatically remove it from the menu.
            </p>
            
            <div style="margin-bottom: 20px;">
                ${itemsHtml}
            </div>

            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button onclick="document.getElementById('${modalId}').remove()" style="padding: 10px 20px; border: none; background: #eee; border-radius: 8px; cursor: pointer;">Cancel</button>
                <button onclick="window.confirmReject('${orderId}')" style="padding: 10px 20px; border: none; background: #d63031; color: white; border-radius: 8px; cursor: pointer; font-weight: bold;">Confirm Reject</button>
            </div>
        </div>
    `;

    if (modal) modal.remove(); // Cleanup old
    modal = document.createElement('div');
    modal.id = modalId;
    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;';
    modal.innerHTML = modalContent;
    document.body.appendChild(modal);
}

window.confirmReject = async function (orderId) {
    const inputs = document.querySelectorAll('.unavailable-item:checked');
    const unavailableIds = Array.from(inputs).map(input => input.value);
    const unavailableNames = Array.from(inputs).map(input => input.getAttribute('data-name'));

    document.getElementById('reject-modal').remove();

    try {
        // 1. Mark Order as Rejected
        await updateDoc(doc(db, "orders", orderId), { status: 'rejected' });

        // 2. Mark Items as Unavailable
        if (unavailableIds.length > 0) {
            const updates = unavailableIds.map(itemId =>
                updateDoc(doc(db, "menuItems", itemId), { available: false })
            );
            await Promise.all(updates);
            alert(`Order Rejected. Marked ${unavailableNames.length} items as Out of Stock: \n${unavailableNames.join(', ')}`);
        } else {
            // Just rejected
        }

    } catch (e) {
        alert("Error processing reject: " + e.message);
        console.error(e);
    }
};

// Helper to open view window
function openViewWindow(title, content) {
    const win = window.open('', '_blank', 'width=400,height=600');
    win.document.write(`
        <html>
        <head>
            <title>${title}</title>
            <style>
                body { font-family: sans-serif; margin: 0; padding: 20px; }
                .action-bar {
                    position: sticky; top: 0; left: 0; right: 0;
                    background: #f8f9fa; padding: 10px;
                    border-bottom: 1px solid #ddd;
                    text-align: center;
                    margin: -20px -20px 20px -20px;
                    display: flex; gap: 10px; justify-content: center;
                }
                .btn {
                    padding: 8px 16px; border: none; border-radius: 4px;
                    cursor: pointer; font-weight: bold;
                }
                .btn-print { background: #2d3436; color: white; }
                .btn-close { background: #e0e0e0; color: black; }
                @media print {
                    .action-bar { display: none !important; }
                    body { padding: 0; }
                }
            </style>
        </head>
        <body>
            <div class="action-bar">
                <button class="btn btn-print" onclick="window.print()">Print</button>
                <button class="btn btn-close" onclick="window.close()">Close</button>
            </div>
            ${content}
        </body>
        </html>
    `);
    win.document.close();
    win.focus();
}

window.printKOT = function (id) {
    const order = ordersMap.get(id);
    if (!order) return alert('Order not found!');

    const items = (order.items || []).map(i => `<div style="font-size:16px; margin-bottom:8px; border-bottom:1px dashed #ccc; padding-bottom:4px;"><strong>${i.qty}</strong> x ${i.name}</div>`).join('');

    const content = `
        <div style="font-family: monospace; max-width: 300px; margin: 0 auto;">
            <h2 style="text-align:center; margin:0;">KITCHEN TICKET</h2>
            <p style="text-align:center; margin:5px 0 10px 0;">Time: ${new Date().toLocaleTimeString()}</p>
            <div style="border: 2px solid #000; padding: 10px; margin-bottom: 20px;">
                <p style="font-size:20px; margin:0; text-align:center;"><strong>Table: ${order.table}</strong></p>
            </div>
            <div>
                ${items}
            </div>
            <p style="margin-top:20px; font-size:12px;">Notes: ${order.notes || 'None'}</p>
        </div>
    `;
    openViewWindow(`KOT - ${order.table}`, content);
};

window.printBill = function (id) {
    const order = ordersMap.get(id);
    if (!order) return alert('Order not found!');

    const items = (order.items || []).map(i => `
        <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
            <span>${i.qty} x ${i.name}</span>
            <span>₹${(i.price * i.qty).toFixed(2)}</span>
        </div>
    `).join('');

    const content = `
        <div style="font-family: sans-serif; max-width: 300px; margin: 0 auto; color: #000;">
            <div style="text-align:center; margin-bottom:20px;">
                <h2 style="margin:0; font-size:24px;">TASHIZOM</h2>
                <p style="margin:5px 0;">Multi-Cuisine Restaurant</p>
                <p style="font-size:12px;">Tel: +91 XXXXX XXXXX</p>
            </div>
            <hr style="border-top: 1px dashed #000;">
            <p style="font-size:14px;">
                Date: ${new Date().toLocaleString()}<br>
                Table: <strong>${order.table}</strong><br>
                Name: ${order.customerName || 'Guest'}<br>
                Phone: ${order.customerPhone || '-'}
            </p>
            <hr style="border-top: 1px dashed #000;">
            <div style="margin:15px 0;">
                ${items}
            </div>
            <hr style="border-top: 2px solid #000;">
            <div style="display:flex; justify-content:space-between; font-size:18px; font-weight:bold; margin-top:10px;">
                <span>TOTAL</span>
                <span>₹${(order.totalAmount || 0).toFixed(2)}</span>
            </div>
            <hr style="border-top: 1px dashed #000; margin-top:20px;">
            <p style="text-align:center; margin-top:20px; font-size:14px;">Thank You! Visit Again.</p>
        </div>
    `;
    openViewWindow(`Bill - ${order.id}`, content);
};
