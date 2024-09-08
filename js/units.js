function parseValue(value) {
    const suffixes = {
        'K': 1e3,
        'M': 1e6,
        'B': 1e9,
        'T': 1e12,
        'P': 1e15,
        'E': 1e18,
        'Z': 1e21,
        'Y': 1e24,
        'R': 1e27
    };

    let suffix = value.slice(-1).toUpperCase();
    let number = parseFloat(value.slice(0, -1));

    if (suffixes[suffix]) {
        return number * suffixes[suffix];
    } else {
        return parseFloat(value);
    }
}

function formatWithSuffix(value) {
    const suffixes = [
        { value: 1e27, symbol: "R" },
        { value: 1e24, symbol: "Y" },
        { value: 1e21, symbol: "Z" },
        { value: 1e18, symbol: "E" },
        { value: 1e15, symbol: "P" },
        { value: 1e12, symbol: "T" },
        { value: 1e9, symbol: "B" },
        { value: 1e6, symbol: "M" },
        { value: 1e3, symbol: "K" }
    ];
    for (let i = 0; i < suffixes.length; i++) {
        if (value >= suffixes[i].value) {
            return (value / suffixes[i].value).toFixed(2) + suffixes[i].symbol;
        }
    }
    return value.toString();
}
