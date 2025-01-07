const layers = {
    head: [
        { src: "head1.png", rarity: "common" },
        { src: "head2.png", rarity: "rare" },
        { src: "head3.png", rarity: "legendary" }
    ],
    arms: [
        { src: "arms1.png", rarity: "uncommon" },
        { src: "arms2.png", rarity: "common" },
        { src: "arms3.png", rarity: "epic" },
        { src: "arms4.png", rarity: "rare" }
    ],
    eyes: [
        { src: "eyes1.png", rarity: "common" },
        { src: "eyes2.png", rarity: "uncommon" },
        { src: "eyes3.png", rarity: "epic" },
        { src: "eyes4.png", rarity: "legendary" }
    ],
    mouth: [
        { src: "mouth1.png", rarity: "rare" },
        { src: "mouth2.png", rarity: "common" },
        { src: "mouth3.png", rarity: "uncommon" },
        { src: "mouth4.png", rarity: "epic" },
        { src: "mouth5.png", rarity: "legendary" },
        { src: "mouth6.png", rarity: "common" }
    ],
    accessories: [
        { src: "accessorie1.png", rarity: "common" },
        { src: "accessorie2.png", rarity: "uncommon" },
        { src: "accessorie3.png", rarity: "epic" },
        { src: "accessorie4.png", rarity: "legendary" }
    ]
};

const rarityWeights = {
    common: 50,
    uncommon: 30,
    rare: 15,
    epic: 4,
    legendary: 1
};

const rarityPoints = {
    common: 1,
    uncommon: 2,
    rare: 3,
    epic: 4,
    legendary: 5
};

const rarityColors = {
    common: "rarity-common",
    uncommon: "rarity-uncommon",
    rare: "rarity-rare",
    epic: "rarity-epic",
    legendary: "rarity-legendary"
};

// Calculate all possible combinations for ranking
let allCombinations = [];
function calculateAllCombinations() {
    const layersArray = Object.values(layers);

    function combine(current, depth) {
        if (depth === layersArray.length) {
            const probability = current.reduce(
                (prob, asset) => prob * (rarityWeights[asset.rarity] / 100),
                1
            );
            allCombinations.push({ assets: current, probability });
            return;
        }
        for (const asset of layersArray[depth]) {
            combine([...current, asset], depth + 1);
        }
    }
    combine([], 0);

    // Sort combinations by probability (ascending: rarest first)
    allCombinations.sort((a, b) => a.probability - b.probability);
}

calculateAllCombinations();

function getRank(selectedAssets) {
    const selectedCombination = Object.values(selectedAssets).map(asset => asset.src);
    for (let i = 0; i < allCombinations.length; i++) {
        const combination = allCombinations[i].assets.map(asset => asset.src);
        if (JSON.stringify(selectedCombination) === JSON.stringify(combination)) {
            return i + 1; // Rank is 1-based
        }
    }
    return allCombinations.length; // Fallback (should not occur)
}

function getRandomAsset(assets) {
    const weightedAssets = assets.flatMap(asset =>
        Array(rarityWeights[asset.rarity]).fill(asset)
    );
    return weightedAssets[Math.floor(Math.random() * weightedAssets.length)];
}

function calculateScore(selectedAssets) {
    return Object.values(selectedAssets).reduce(
        (score, asset) => score + rarityPoints[asset.rarity],
        0
    );
}

function randomizeCharacter() {
    const selectedAssets = {};
    for (const layer in layers) {
        const selectedAsset = getRandomAsset(layers[layer]);
        selectedAssets[layer] = selectedAsset;
        document.getElementById(layer).src = selectedAsset.src;
    }

    const score = calculateScore(selectedAssets);
    const rank = getRank(selectedAssets);

    generateRarityDisplay(selectedAssets, score, rank);
}

function generateRarityDisplay(selectedAssets, score, rank) {
    const rarityContainer = document.querySelector(".attributes");
    rarityContainer.innerHTML = "";

    for (const [layer, asset] of Object.entries(selectedAssets)) {
        const rarityDiv = document.createElement("div");
        rarityDiv.classList.add("attribute");
        rarityDiv.innerHTML = `
            <div class="name">${layer}</div>
            <div>${asset.src.replace(".png", "")} - <span class="rarity ${rarityColors[asset.rarity]}">${asset.rarity.toUpperCase()}</span></div>
        `;
        rarityContainer.appendChild(rarityDiv);
    }

    const scoreContainer = document.querySelector(".score-section");
    scoreContainer.innerHTML = `
        <div><strong>Total Score:</strong> ${score}</div>
        <div><strong>Rank:</strong> ${rank} of ${allCombinations.length}</div>
    `;
}

document.getElementById("downloadButton").addEventListener("click", () => {
    const name = document.getElementById("nameInput").value.trim() || "Unnamed";
    const rank = document.querySelector(".score-section").textContent.match(/Rank: (\d+) of \d+/)[1];

    html2canvas(document.getElementById("previewContainer")).then(canvas => {
        const context = canvas.getContext("2d");

        // Text styling
        context.font = "12px 'Patrick Hand'";
        context.fillStyle = "#000000";
        context.textAlign = "left";

        // Add "Rank X - Name" to the bottom left of the canvas
        const text = `Rank ${rank} - ${name}`;
        context.fillText(text, 10, canvas.height - 10); // 10px padding from the left and bottom

        // Create downloadable image
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = `${name}_character.png`;
        link.click();
    });
});


document.getElementById("randomizeButton").addEventListener("click", randomizeCharacter);

// Initialize with a random character
randomizeCharacter();
