let oreIncomes = [];
let recipes = [];

function parseInputData() {
    RECIPES = {};
    INCOME = {};

    document.querySelectorAll('#oreIncomesContainer .input-row').forEach(row => {
        const oreName = row.querySelector('.ore-name').value.trim();
        const oreAmount = parseValue(row.querySelector('.ore-amount').value);
        if (oreName && !isNaN(oreAmount)) {
            INCOME[oreName] = oreAmount;
        }
    });

    document.querySelectorAll('#recipesContainer .recipe-card').forEach(card => {
        const recipeName = card.querySelector('.recipe-name').value.trim();
        const producer = card.querySelector('.recipe-producer').value === 'Smelter' ? Producer.SMELTER : Producer.CRAFTER;
        const time = parseFloat(card.querySelector('.recipe-time').value);
        const sellPrice = parseValue(card.querySelector('.recipe-sell-price').value);
        const requirements = {};

        card.querySelectorAll('.requirementsContainer .requirement-row').forEach(reqRow => {
            const itemName = reqRow.querySelector('.requirement-name').value.trim();
            const quantity = parseValue(reqRow.querySelector('.requirement-quantity').value);
            if (itemName && !isNaN(quantity)) {
                requirements[itemName] = quantity;
            }
        });

        if (recipeName && !isNaN(producer) && !isNaN(time)) {
            RECIPES[recipeName] = new Recipe(recipeName, producer, time, requirements, sellPrice);
        }
    });
}

function adjustCanvasSize() {
    const canvas = document.getElementById('bottleneckTimeline');
    const maxWidth = window.innerWidth * 0.9;
    const maxHeight = window.innerHeight * 0.5;

    canvas.width = maxWidth;
    canvas.height = maxHeight;
}

function calculateMarketRaid() {
    try {
        parseInputData();

        const numSmelters = parseInt(document.getElementById('numSmelters').value, 10);
        const numCrafters = parseInt(document.getElementById('numCrafters').value, 10);
        const selectedItem = document.getElementById('selectedItem').value;

        if (isNaN(numSmelters) || isNaN(numCrafters) || !selectedItem || !RECIPES[selectedItem]) {
            throw new Error("Please fill in all required fields correctly.");
        }

        const simulation = new Simulation(selectedItem, RECIPES, INCOME, numSmelters, numCrafters);
        const items = simulation.simulate();
        const value = items * RECIPES[selectedItem].sellPrice;

        if (items <= 0) {
            throw new Error("No items produced. Check your inputs and try again.");
        }

        document.getElementById('quantity').textContent = formatWithSuffix(items);
        document.getElementById('value').textContent = `₩${formatWithSuffix(value)}`;
        document.getElementById('resultContainer').style.display = 'block';
        document.getElementById('errorContainer').style.display = 'none';

        document.getElementById('avgSmelters').textContent = (simulation.activeWorkers[Producer.SMELTER] / simulation.simulationTime).toFixed(2);
        document.getElementById('avgCrafters').textContent = (simulation.activeWorkers[Producer.CRAFTER] / simulation.simulationTime).toFixed(2);

        const canvas = document.getElementById('bottleneckTimeline');
        drawBottleneckTimeline(simulation, canvas);
        document.getElementById('bottleneckContainer').style.display = 'block';
        document.getElementById('bottleneckContainer').scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error(error);
        document.getElementById('errorMessage').textContent = error.message;
        document.getElementById('resultContainer').style.display = 'none';
        document.getElementById('errorContainer').style.display = 'block';
    }
}

function addOreIncome() {
    const oreIncomeContainer = document.getElementById('oreIncomesContainer');
    const newOreRow = document.createElement('div');
    newOreRow.className = 'input-row';
    newOreRow.draggable = true;
    newOreRow.innerHTML = `
        <span class="drag-handle">⋮</span>
        <input type="text" placeholder="Ore Name" class="ore-name" oninput="updateItemList()">
        <input type="text" placeholder="Ore/s" class="ore-amount">
        <button class="close-button" onclick="removeOreIncome(this)">X</button>
    `;
    oreIncomeContainer.appendChild(newOreRow);

    reattachDragEvents();
}

function removeOreIncome(button) {
    button.parentElement.remove();
    updateItemList();
}

function addRecipe() {
    const recipesContainer = document.getElementById('recipesContainer');
    const newRecipe = document.createElement('div');
    newRecipe.className = 'recipe-card';
    newRecipe.draggable = true;
    newRecipe.innerHTML = `
        <h4>Recipe<button class="close-button" onclick="removeRecipe(this)">X</button></h4>
        <div class="input-row">
            <input type="text" placeholder="Recipe Name" class="recipe-name" oninput="updateItemList()">
            <select class="recipe-producer">
                <option value="Smelter">Smelter</option>
                <option value="Crafter">Crafter</option>
            </select>
            <input type="number" placeholder="Time" class="recipe-time">
            <input type="text" placeholder="Sell Price" class="recipe-sell-price">
        </div>
        Requirements:
        <div class="requirementsContainer"></div>
        <button class="button add-requirement-button" onclick="addRequirement(this)">Add Requirement</button>
    `;
    recipesContainer.appendChild(newRecipe);

    reattachDragEvents();
}

function removeRecipe(button) {
    button.closest('.recipe-card').remove();
    updateItemList();
}

function addRequirement(button) {
    const recipeElement = button.closest('.recipe-card');
    const requirementsContainer = recipeElement.querySelector('.requirementsContainer');
    const newRequirement = document.createElement('div');
    newRequirement.className = 'requirement-row';
    newRequirement.innerHTML = `
        <input type="text" placeholder="Item Name" class="requirement-name" oninput="updateItemList()">
        <input type="text" placeholder="Quantity" class="requirement-quantity">
        <button class="close-button" onclick="removeRequirement(this)">X</button>
    `;
    requirementsContainer.appendChild(newRequirement);
}

function removeRequirement(button) {
    button.parentElement.remove();
    updateItemList();
}

function updateItemList() {
    const recipeNames = [...document.querySelectorAll('.recipe-name')].map(input => input.value.trim()).filter(Boolean);
    const allItems = [...new Set([...recipeNames])];
    const itemSelect = document.getElementById('selectedItem');
    itemSelect.innerHTML = '';
    allItems.forEach(item => {
        const option = document.createElement('option');
        option.value = item;
        option.textContent = item;
        itemSelect.appendChild(option);
    });
}

function drawBottleneckTimeline(simulation, canvas) {
    const ctx = canvas.getContext('2d');
    const barHeight = 40;
    const resourceCount = Object.keys(simulation.bottlenecks).length;

    const width = 0.9 * window.innerWidth;
    const height = barHeight * resourceCount;
    const pointsPerPixel = Math.ceil(simulation.simulationTime / width);

    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);

    const maxMissingValues = {};
    Object.entries(simulation.bottlenecks).forEach(([resource, data]) => {
        maxMissingValues[resource] = data.reduce((max, d) => Math.max(max, d.missing), 0);
    });

    Object.entries(simulation.bottlenecks).forEach(([resource, data], index) => {
        const y = index * barHeight;
        const maxMissing = maxMissingValues[resource];

        for (let x = 0; x < width; x++) {
            let aggregateBottleneck = 0;

            for (let t = x * pointsPerPixel; t < (x + 1) * pointsPerPixel && t < data.length; t++) {
                aggregateBottleneck += data[t].missing;
            }

            const normalizedBottleneck = aggregateBottleneck / (pointsPerPixel * maxMissing);
            const alpha = Math.min(normalizedBottleneck, 1);
            ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
            ctx.fillRect(x, y, 1, barHeight);
        }

        ctx.fillStyle = "black";
        ctx.fillText(resource, 5, y + barHeight / 2);
    });
}

function updateOreIncomes(incomeData) {
    const oreIncomesContainer = document.getElementById('oreIncomesContainer');
    oreIncomesContainer.innerHTML = '';

    for (const [ore, income] of Object.entries(incomeData)) {
        addOreIncome();
        const oreRow = oreIncomesContainer.querySelector('.input-row:last-child');

        oreRow.querySelector('.ore-name').value = ore;
        oreRow.querySelector('.ore-amount').value = income;
    }
}

function getIncomeFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const income = urlParams.get('income');

    if (income) {
        const incomeDict = parseIncomeData(income);
        updateOreIncomes(incomeDict);
    }
}

function parseIncomeData(incomeString) {
    const incomePairs = incomeString.split(',');
    const incomeDict = {};

    incomePairs.forEach(pair => {
        const [resource, amount] = pair.split(':');
        if (resource && amount) {
            incomeDict[resource] = parseFloat(amount);
        }
    });

    return incomeDict;
}

function getRecipesFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const recipesParam = urlParams.get('recipes');

    if (recipesParam) {
        const recipesContainer = document.getElementById('recipesContainer');
        recipesContainer.innerHTML = '';

        const recipes = recipesParam.split(',');

        recipes.forEach(recipeString => {
            const [name, time, producer, price, ...requirementsArr] = recipeString.split(':');
            addRecipe();

            const recipeCard = document.querySelector('#recipesContainer .recipe-card:last-child');
            recipeCard.querySelector('.recipe-name').value = decodeURIComponent(name);
            recipeCard.querySelector('.recipe-time').value = time;
            recipeCard.querySelector('.recipe-producer').value = decodeURIComponent(producer);
            recipeCard.querySelector('.recipe-sell-price').value = price;

            const requirementsContainer = recipeCard.querySelector('.requirementsContainer');
            requirementsContainer.innerHTML = '';

            requirementsArr.join(':').split(';').forEach(req => {
                const [reqName, reqQuantity] = req.split(':');
                addRequirement(recipeCard.querySelector('.button'));
                const requirementRow = recipeCard.querySelector('.requirementsContainer .requirement-row:last-child');
                requirementRow.querySelector('.requirement-name').value = decodeURIComponent(reqName);
                requirementRow.querySelector('.requirement-quantity').value = reqQuantity;
            });
        });
    }
}

function getWorkersFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const smelters = urlParams.get('smelters');
    const crafters = urlParams.get('crafters');
    if (smelters) {
        document.getElementById('numSmelters').value = smelters;
    }
    if (crafters) {
        document.getElementById('numCrafters').value = crafters;    
    }
}
