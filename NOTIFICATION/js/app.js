document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('invoice-form');
    const display = document.getElementById('invoice-display');

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const customerName = document.getElementById('customer-name').value;
        const productDescription = document.getElementById('product-description').value;
        const quantity = document.getElementById('quantity').value;
        const price = document.getElementById('price').value;
        const total = quantity * price;

        const invoiceHtml = `
            <h2>Invoice</h2>
            <p><strong>Customer Name:</strong> ${customerName}</p>
            <p><strong>Product Description:</strong> ${productDescription}</p>
            <p><strong>Quantity:</strong> ${quantity}</p>
            <p><strong>Price:</strong> $${price}</p>
            <p><strong>Total:</strong> $${total}</p>
        `;

        display.innerHTML = invoiceHtml;
        form.reset();
    });
});
