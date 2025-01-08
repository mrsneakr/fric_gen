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

import { initializeApp } from "firebase/app";

// Firebase-Konfiguration
const firebaseConfig = {
  apiKey: "AIzaSyDVtb9rKrhW4qhPuEpL3bSRTEAr0i_ZrlI",
  authDomain: "fric-generator.firebaseapp.com",
  databaseURL: "https://fric-generator-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "fric-generator",
  storageBucket: "fric-generator.firebasestorage.app",
  messagingSenderId: "843112915879",
  appId: "1:843112915879:web:714f87a5ef147470f30c82"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.getDatabase(app);

function updateLeaderboardFirebase(name, rank) {
    const leaderboardRef = firebase.ref(db, "leaderboard/");
    firebase.push(leaderboardRef, { name, rank });
}

function renderLeaderboardFirebase() {
    const leaderboardRef = firebase.ref(db, "leaderboard/");
    firebase.onValue(leaderboardRef, snapshot => {
        const leaderboard = [];
        snapshot.forEach(childSnapshot => {
            leaderboard.push(childSnapshot.val());
        });

        // Sortiere die Rangliste und begrenze sie auf die Top 10
        leaderboard.sort((a, b) => a.rank - b.rank);

        const leaderboardList = document.getElementById("leaderboardList");
        leaderboardList.innerHTML = leaderboard.slice(0, 10)
            .map((entry, index) => `<li>#${index + 1}: ${entry.name} (Rank ${entry.rank})</li>`)
            .join("");
    });
}

function randomizeCharacter() {
    // Funktionalität bleibt wie zuvor
}

// Initialisiere die Rangliste und die Anzeige
renderLeaderboardFirebase();
randomizeCharacter();


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
    const name = document.getElementById("nameInput").value.trim();
    const rankMatch = document.querySelector(".score-section").textContent.match(/Rank: (\d+) of \d+/);
    const rank = rankMatch ? parseInt(rankMatch[1]) : null;

    if (name && rank) {
        // Füge den Benutzer in die Firebase-Rangliste ein
        updateLeaderboardFirebase(name, rank);
    }

    const nameForImage = name || "Unnamed";

    html2canvas(document.getElementById("previewContainer")).then(canvas => {
        const finalCanvas = document.createElement("canvas");
        finalCanvas.width = canvas.width;
        finalCanvas.height = canvas.height;
        const context = finalCanvas.getContext("2d");

        context.drawImage(canvas, 0, 0);

        context.font = "24px 'Patrick Hand'";
        context.fillStyle = "#000000";
        context.textAlign = "left";

        const text = `Rank ${rank} - ${nameForImage}`;
        context.fillText(text, 20, finalCanvas.height - 20);

        const fileName = `Fric_${nameForImage.replace(/\s+/g, "_")}_Rank${rank}.png`;
        
        const link = document.createElement("a");
        link.href = finalCanvas.toDataURL("image/png");
        link.download = fileName;
        link.click();
    });
});

document.getElementById("randomizeButton").addEventListener("click", randomizeCharacter);

// Initialize with a random character
randomizeCharacter();
