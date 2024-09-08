const Producer = Object.freeze({
    SMELTER: 0,
    CRAFTER: 1
});

class Recipe {
    constructor(name, producer, time, requirements, sellPrice) {
        this.name = name;
        this.producer = producer;
        this.time = time;
        this.requirements = requirements;
        this.sellPrice = sellPrice;
    }
}

class QueueItem {
    constructor(name, quantity) {
        this.name = name;
        this.quantity = quantity;
    }
}

class Worker {
    constructor() {
        this.remainingTime = 0;
        this.busy = false;
        this.itemName = null;
    }

    checkType(recipe) {
        throw new Error('Not implemented');
    }

    get producer() {
        throw new Error('Not implemented');
    }

    work() {
        if (this.remainingTime > 0) {
            this.remainingTime -= 1;
            if (this.remainingTime <= 0) {
                const itemName = this.itemName;
                this.busy = false;
                this.itemName = null;
                return itemName;
            }
        }
        return null;
    }

    set(recipe) {
        if (!this.busy && this.checkType(recipe)) {
            this.itemName = recipe.name;
            this.remainingTime = recipe.time;
            this.busy = true;
        }
    }
}

class Smelter extends Worker {
    get producer() {
        return Producer.SMELTER;
    }

    checkType(recipe) {
        return recipe.producer === Producer.SMELTER;
    }
}

class Crafter extends Worker {
    get producer() {
        return Producer.CRAFTER;
    }

    checkType(recipe) {
        return recipe.producer === Producer.CRAFTER;
    }
}

class Simulation {
    constructor(targetItem, recipes, income, smelters, crafters, simulationTime = 86400) {
        this.targetItem = targetItem;
        this.recipes = recipes;
        this.income = income;
        this.simulationTime = simulationTime;
        this.resources = {};

        this.workers = {
            [Producer.SMELTER]: Array.from({ length: smelters }, () => new Smelter()),
            [Producer.CRAFTER]: Array.from({ length: crafters }, () => new Crafter())
        };

        const root = this.createTree(targetItem, 1);
        this.requirements = {
            [Producer.SMELTER]: this.getQueue(root, Producer.SMELTER),
            [Producer.CRAFTER]: this.getQueue(root, Producer.CRAFTER)
        };

        this.queue = {
            [Producer.SMELTER]: [...this.requirements[Producer.SMELTER]],
            [Producer.CRAFTER]: [...this.requirements[Producer.CRAFTER]]
        };

        this.neededItems = {
            [Producer.SMELTER]: new Set(this.requirements[Producer.SMELTER].map(q => q.name)),
            [Producer.CRAFTER]: new Set(this.requirements[Producer.CRAFTER].map(q => q.name))
        };

        this.activeWorkers = {
            [Producer.SMELTER]: 0,
            [Producer.CRAFTER]: 0
        };

        this.bottlenecks = {};
    }

    createTree(name, quantity, parent = null, visited = new Set()) {
        if (visited.has(name)) {
            throw new Error(`Circular dependency detected: ${name} is part of a loop.`);
        }

        visited.add(name);
        const root = { item: new QueueItem(name, quantity), parent };

        if (name in this.recipes) {
            const recipe = this.recipes[name];
            root.children = Object.entries(recipe.requirements).map(
                ([item, requiredQuantity]) => this.createTree(item, quantity * requiredQuantity, root, new Set(visited))
            );
        } else {
            root.children = [];
        }

        return root;
    }

    getQueue(root, recipeType) {
        const requirements = [];
        const nodes = [root];
        while (nodes.length) {
            const node = nodes.pop();
            if (node.item.name in this.recipes && this.recipes[node.item.name].producer === recipeType) {
                requirements.push(new QueueItem(node.item.name, node.item.quantity));
            }
            nodes.push(...node.children.reverse());
        }
        return this.flattenQueue(requirements);
    }

    flattenQueue(queue) {
        const result = [];
        const map = new Map();
        queue.forEach(qi => {
            if (map.has(qi.name)) {
                map.get(qi.name).quantity += qi.quantity;
            } else {
                const newQi = new QueueItem(qi.name, qi.quantity);
                map.set(qi.name, newQi);
                result.push(newQi);
            }
        });
        return result;
    }

    updateOre() {
        Object.entries(this.income).forEach(([ore, amount]) => {
            this.resources[ore] = (this.resources[ore] || 0) + amount;
        });
    }

    checkRequirements(recipe) {
        let canFulfill = true;
        Object.entries(recipe.requirements).forEach(([req, amount]) => {
            if ((this.resources[req] || 0) < amount) {
                canFulfill = false;
                if (!this.bottlenecks[req]) {
                    this.bottlenecks[req] = [];
                }
                this.bottlenecks[req].push({ time: this.simulationTime, missing: amount - (this.resources[req] || 0) });
            }
        });
        return canFulfill;
    }

    setWorker(worker, recipe) {
        if (!worker.busy && this.checkRequirements(recipe)) {
            Object.entries(recipe.requirements).forEach(([req, amount]) => {
                this.resources[req] -= amount;
            });
            worker.set(recipe);
            return true;
        }
        return false;
    }

    allocateWorkers(producer) {
        let activeWorkers = 0;
        this.workers[producer].forEach(worker => {
            if (!worker.busy) {
                const checkedItems = new Set();
                for (let i = 0; i < this.queue[producer].length; i++) {
                    const queueItem = this.queue[producer][i];
                    const recipe = this.recipes[queueItem.name];
                    if (this.setWorker(worker, recipe)) {
                        queueItem.quantity -= 1;
                        if (queueItem.quantity <= 0) {
                            this.queue[producer].splice(i, 1);
                            const extension = this.flattenQueue(this.requirements[producer]);

                            if (producer === Producer.CRAFTER) {
                                if (this.queue[producer].length === 0) {
                                    this.queue[producer] = extension;
                                }
                            } else if (producer === Producer.SMELTER) {
                                if (this.queue[producer].slice(-extension.length).toString() !== extension.toString()) {
                                    this.queue[producer].push(...extension);
                                    this.queue[producer] = this.flattenQueue(this.queue[producer]);
                                }
                            }
                        }
                        break;
                    }
                    checkedItems.add(queueItem.name);
                    if (checkedItems.size === this.neededItems[producer].size) {
                        break;
                    }
                }
            }

            if (worker.busy) {
                activeWorkers++;
            }

            const alloyName = worker.work();
            if (alloyName !== null) {
                this.resources[alloyName] = (this.resources[alloyName] || 0) + 1;
            }

        });

        this.activeWorkers[producer] += activeWorkers;
    }

    simulate() {
        for (let time = 0; time < this.simulationTime; time++) {
            this.updateOre();
            [Producer.SMELTER, Producer.CRAFTER].forEach(producer => {
                if (this.neededItems[producer].size > 0) {
                    this.allocateWorkers(producer);
                }
            });
        }
        return Math.floor(this.resources[this.targetItem] || 0);
    }
}
