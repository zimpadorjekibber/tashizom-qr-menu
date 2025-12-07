
import { db } from './firebase-config.js';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const ordersGrid = document.querySelector('.orders-grid');

// Listen for real-time updates
const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));

const unsubscribe = onSnapshot(q, (snapshot) => {
    ordersGrid.innerHTML = ''; // Clear current grid

    if (snapshot.empty) {
        ordersGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #718096;">No active orders.</p>';
        return;
    }

    snapshot.forEach((docSnap) => {
        const order = { id: docSnap.id, ...docSnap.data() };
        renderOrderCard(order);
    });
});

function renderOrderCard(order) {
    // Only show pending orders (optional filter, currently showing all for demo)
    if (order.status === 'completed') return;

    const card = document.createElement('div');
    card.className = 'order-card';

    // Format timestamp
    let timeString = 'Just now';
    if (order.createdAt) {
        const date = new Date(order.createdAt);
        timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Build items list
    const itemsHtml = order.items.map(item =>
        `<p><strong>${item.qty}x</strong> ${item.name}</p>`
    ).join('');

    card.innerHTML = `
        <div class="order-header">
            <span class="table-badge">${order.table}</span>
            <span style="color: #718096; font-size: 0.9rem;">${timeString}</span>
        </div>
        <div class="customer-info" style="margin-bottom: 0.5rem; padding-bottom: 0.5rem; border-bottom: 1px solid #edf2f7; font-size: 0.9rem;">
            <p><strong><i class="fa-solid fa-user"></i></strong> ${order.customerName || 'Guest'}</p>
            <p><strong><i class="fa-solid fa-phone"></i></strong> ${order.customerPhone || 'N/A'}</p>
        </div>
        <div class="order-items">
            ${itemsHtml}
        </div>
        <div class="order-total" style="margin-top: 0.5rem; font-weight: bold; border-top: 1px dashed #e2e8f0; padding-top: 0.5rem;">
            Total: ₹${order.totalAmount.toFixed(2)}
        </div>
        <div style="margin-top: 1rem; text-align: right;">
            <button class="complete-btn" onclick="completeOrder('${order.id}')"
                style="background: #48bb78; color: white; border: none; padding: 0.5rem; border-radius: 0.25rem; cursor: pointer;">
                Complete Order
            </button>
        </div>
    `;
    ordersGrid.appendChild(card);
}

// Expose complete function globally
window.completeOrder = async function (orderId) {
    if (!confirm('Mark this order as completed?')) return;

    try {
        const orderRef = doc(db, "orders", orderId);
        await updateDoc(orderRef, {
            status: 'completed'
        });
        // The onSnapshot listener will automatically remove it from the UI because of the check inside renderOrderCard
        // But to be safe if we want to keep them but visualy change them:
        // For now, let's just assume we hide completed orders.
    } catch (e) {
        console.error("Error updating order: ", e);
        alert("Error completing order: " + e.message);
    }
};
