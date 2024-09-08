function updateProfit() {
    const initialPrice = parseValue(document.getElementById('initialPrice').value) || 0;
    const costEach = parseValue(document.getElementById('costEach').value) || 0;
    const sellPrice = parseValue(document.getElementById('sellPrice').value) || 0;
    const quantity = parseValue(document.getElementById('quantity').value) || 0;

    const errorContainer = document.getElementById('errorContainer');
    const profitContainer = document.getElementById('profitContainer');
    const errorMessage = document.getElementById('errorMessage');

    if (costEach <= initialPrice) {
        errorMessage.innerText = "Error: Cost Each must be greater than Initial Price.";
        errorContainer.style.display = 'block';
        profitContainer.style.display = 'none';
        return;
    }

    if (sellPrice <= initialPrice) {
        errorMessage.innerText = "Error: Sell Price must be greater than Initial Price.";
        errorContainer.style.display = 'block';
        profitContainer.style.display = 'none';
        return;
    }

    if (costEach <= 0 | initialPrice <= 0 | sellPrice <= 0 | quantity <= 0) {
        errorMessage.innerText = "Error: Values must be positive.";
        errorContainer.style.display = 'block';
        profitContainer.style.display = 'none';
        return;
    }

    const itemsToBuy = Math.floor((quantity + 1) / 2 * (sellPrice - initialPrice) / (costEach - initialPrice));
    const profit = itemsToBuy * (sellPrice - initialPrice - (itemsToBuy + 1) / (quantity + 1) * (costEach - initialPrice));

    document.getElementById('itemsToBuy').innerText = `${formatWithSuffix(itemsToBuy)}`;
    document.getElementById('profit').innerText = `₩${formatWithSuffix(profit)}`;

    errorContainer.style.display = 'none';
    profitContainer.style.display = 'block';
}
