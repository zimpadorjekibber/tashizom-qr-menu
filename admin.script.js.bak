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

    // Base URL - pointing to the live Firebase hosted app
    const baseUrl = "https://dineflow-fndvc.web.app/index.html";
    const finalUrl = `${baseUrl}?table=${encodeURIComponent(tableNum)}`;

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
