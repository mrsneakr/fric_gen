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

const rarityColors = {
    common: "rarity-common",
    uncommon: "rarity-uncommon",
    rare: "rarity-rare",
    epic: "rarity-epic",
    legendary: "rarity-legendary"
};

function getRandomAsset(assets) {
    const weightedAssets = assets.flatMap(asset => Array(asset.rarity === "common" ? 50 : asset.rarity === "uncommon" ? 30 : asset.rarity === "rare" ? 15 : asset.rarity === "epic" ? 4 : 1).fill(asset));
    return weightedAssets[Math.floor(Math.random() * weightedAssets.length)];
}

function randomizeCharacter() {
    const selectedAssets = {};
    for (const layer in layers) {
        const selectedAsset = getRandomAsset(layers[layer]);
        selectedAssets[layer] = selectedAsset;
        document.getElementById(layer).src = selectedAsset.src;
    }
    generateRarityDisplay(selectedAssets);
}

function generateRarityDisplay(selectedAssets) {
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
}

document.getElementById("randomizeButton").addEventListener("click", randomizeCharacter);
document.getElementById("downloadButton").addEventListener("click", () => {
    html2canvas(document.getElementById("previewContainer")).then(canvas => {
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = "character.png";
        link.click();
    });
});

randomizeCharacter();
