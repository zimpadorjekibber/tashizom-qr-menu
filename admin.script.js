function generateQR() {
    const tableNum = document.getElementById('table-number').value;
    const qrContainer = document.getElementById('qr-code');
    const resultContainer = document.getElementById('qr-result');
    const displayTableNum = document.getElementById('display-table-num');

    if (!tableNum) {
        alert('Please enter a table name or number');
        return;
    }

    // Clear previous QR code
    qrContainer.innerHTML = '';

    // Base URL - currently points to the index.html in the same directory
    // In production, this would be the actual domain
    const baseUrl = window.location.href.replace('admin.html', 'index.html');
    const finalUrl = `${baseUrl}?table=${tableNum}`;

    // Generate QR Code
    new QRCode(qrContainer, {
        text: finalUrl,
        width: 200,
        height: 200,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });

    // Show result
    displayTableNum.textContent = tableNum;
    resultContainer.style.display = 'flex';
}
