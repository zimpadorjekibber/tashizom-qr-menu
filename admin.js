/* ADMIN LOGIC */
import { db } from './firebase-config.js';
import { collection, getDocs, addDoc, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const list = document.getElementById('menu-list');

async function init() {
    if (sessionStorage.getItem('userRole') !== 'admin') window.location.href = 'login.html';
    loadMenu();
}

window.currentMenuItems = [];

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
    // Find item from DOM or refetch. Since we redownloaded, let's just find in list?
    // Better to keep a cache or just re-query is wasteful.
    // Let's grab it from the DOM loop or just pass data? Passing strings is messy.
    // Let's just fetch single doc or keep a global cache.
    // Quickest: Iterate the list we just built? No.
    // Let's just get the doc again, or store it on the element.
    // Actually, I'll add a 'menuCache' in loadMenu.

    // Fallback: fetch again is safe.
    // Ideally we stored it.
    // Let's access the text content for now? No, precision needed.
    // I'll update loadMenu to store data in a map.

    // (See loadMenu change above where I use 'items' array. I can store it globally).
    // RE-running loadMenu logic with global cache:
    // I will use a simple find in the db collection if local cache isn't set, 
    // but since I can't easily change the collection var scope here without big refactor,
    // I'll just use the fact that I can read the data-attributes or just pass it?
    // Simpler: Just do a direct database read for the edit. Performance is fine for admin.

    // WAIT, better: I'll attach the data to the Edit button as a JSON string?
    // No, I'll just keep a global `window.currentMenuItems` in loadMenu.

    // For now, let's just implement the 'editItem' logic assuming we can get data.
    // I will fetch the doc cleanly.

    // Actually, I'll just do a quick fetch.
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

window.generateQR = () => {
    const t = document.getElementById('qr-table').value;
    if (!t) return alert("Enter table");

    const div = document.getElementById('qr-img');
    div.innerHTML = '';

    const url = `https://dineflow-fndvc.web.app/index.html?table=${encodeURIComponent(t)}`;

    new QRCode(div, { text: url, width: 150, height: 150 });
    document.getElementById('qr-output').style.display = 'block';
};

init();
