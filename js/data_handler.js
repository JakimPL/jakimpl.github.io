function extractData() {
    const smelters = document.getElementById('numSmelters').value;
    const crafters = document.getElementById('numCrafters').value;

    const oreIncomes = {};
    document.querySelectorAll('#oreIncomesContainer .input-row').forEach(row => {
        const oreName = row.querySelector('.ore-name').value.trim();
        const oreAmount = row.querySelector('.ore-amount').value.trim();
        oreIncomes[oreName] = oreAmount || '';
    });

    const recipes = {};
    document.querySelectorAll('#recipesContainer .recipe-card').forEach(card => {
        const recipeName = card.querySelector('.recipe-name').value.trim();
        const producer = card.querySelector('.recipe-producer').value === 'Smelter' ? 'Smelter' : 'Crafter';
        const time = card.querySelector('.recipe-time').value.trim();
        const sellPrice = card.querySelector('.recipe-sell-price').value.trim();

        const requirements = {};
        card.querySelectorAll('.requirementsContainer .requirement-row').forEach(reqRow => {
            const itemName = reqRow.querySelector('.requirement-name').value.trim();
            const quantity = reqRow.querySelector('.requirement-quantity').value.trim();
            requirements[itemName] = quantity || '';
        });

        recipes[recipeName] = {
            name: recipeName,
            producer: producer,
            time: time,
            sellPrice: sellPrice,
            requirements: requirements
        };
    });

    return {
        oreIncomes: oreIncomes,
        recipes: recipes,
        smelters: smelters,
        crafters: crafters
    };
}

function saveSessionData() {
    const sessionData = extractData();
    localStorage.setItem('marketRaidSession', JSON.stringify(sessionData));
}

function exportData() {
    const data = extractData();
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });

    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'market_raid_data.json';

    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
}

function importData(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                loadImportedData(data);
            } catch (error) {
                console.error(error);
                alert("Invalid JSON file.");
            }
        };
        reader.readAsText(file);
    }
}

function loadImportedData(data) {
    document.getElementById('oreIncomesContainer').innerHTML = '';
    document.getElementById('recipesContainer').innerHTML = '';

    for (const [oreName, oreAmount] of Object.entries(data.oreIncomes)) {
        addOreIncome();
        const lastRow = document.querySelector('#oreIncomesContainer .input-row:last-child');
        lastRow.querySelector('.ore-name').value = oreName;
        lastRow.querySelector('.ore-amount').value = oreAmount;
    }

    for (const [recipeName, recipe] of Object.entries(data.recipes)) {
        addRecipe();
        const lastCard = document.querySelector('#recipesContainer .recipe-card:last-child');
        lastCard.querySelector('.recipe-name').value = recipeName;
        lastCard.querySelector('.recipe-producer').value = recipe.producer === 'Smelter' ? 'Smelter' : 'Crafter';
        lastCard.querySelector('.recipe-time').value = recipe.time;
        lastCard.querySelector('.recipe-sell-price').value = recipe.sellPrice;

        const requirementsContainer = lastCard.querySelector('.requirementsContainer');
        requirementsContainer.innerHTML = '';

        for (const [itemName, quantity] of Object.entries(recipe.requirements)) {
            addRequirement(lastCard.querySelector('button'));
            const lastRequirementRow = lastCard.querySelector('.requirementsContainer .requirement-row:last-child');
            lastRequirementRow.querySelector('.requirement-name').value = itemName;
            lastRequirementRow.querySelector('.requirement-quantity').value = quantity;
        }
    }

    if (data.smelters !== undefined) {
        document.getElementById('numSmelters').value = data.smelters;
    }
    if (data.crafters !== undefined) {
        document.getElementById('numCrafters').value = data.crafters;
    }

    updateItemList();
    saveSessionData();
}

function loadSessionData() {
    const savedData = localStorage.getItem('marketRaidSession');
    if (savedData) {
        const data = JSON.parse(savedData);
        loadImportedData(data);
    }
}

function attachInputListeners() {
    const inputs = document.querySelectorAll('#oreIncomesContainer input, #recipesContainer input, #numSmelters, #numCrafters');
    inputs.forEach(input => {
        input.addEventListener('input', saveSessionData);
    });

    const selects = document.querySelectorAll('#recipesContainer select');

    selects.forEach(select => {
        select.addEventListener('change', saveSessionData);
    });
}

function clearSessionData() {
    localStorage.removeItem('marketRaidSession');
    location.reload();
}

document.addEventListener('DOMContentLoaded', () => {
    loadSessionData();
    attachInputListeners();
});
