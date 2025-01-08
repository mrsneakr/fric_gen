import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// Firebase-Konfiguration
const firebaseConfig = {
  apiKey: "AIzaSyDVtb9rKrhW4qhPuEpL3bSRTEAr0i_ZrlI",
  authDomain: "fric-generator.firebaseapp.com",
  databaseURL: "https://fric-generator-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "fric-generator",
  storageBucket: "fric-generator.firebasestorage.app",
  messagingSenderId: "843112915879",
  appId: "1:843112915879:web:714f87a5ef147470f30c82",
};

// Firebase initialisieren
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Layers und Wahrscheinlichkeitswerte
const layers = {
  head: [
    { src: "head1.png", rarity: "common" },
    { src: "head2.png", rarity: "rare" },
    { src: "head3.png", rarity: "legendary" },
  ],
  arms: [
    { src: "arms1.png", rarity: "uncommon" },
    { src: "arms2.png", rarity: "common" },
    { src: "arms3.png", rarity: "epic" },
    { src: "arms4.png", rarity: "rare" },
  ],
  eyes: [
    { src: "eyes1.png", rarity: "common" },
    { src: "eyes2.png", rarity: "uncommon" },
    { src: "eyes3.png", rarity: "epic" },
    { src: "eyes4.png", rarity: "legendary" },
  ],
  mouth: [
    { src: "mouth1.png", rarity: "rare" },
    { src: "mouth2.png", rarity: "common" },
    { src: "mouth3.png", rarity: "uncommon" },
    { src: "mouth4.png", rarity: "epic" },
    { src: "mouth5.png", rarity: "legendary" },
    { src: "mouth6.png", rarity: "common" },
  ],
  accessories: [
    { src: "accessorie1.png", rarity: "common" },
    { src: "accessorie2.png", rarity: "uncommon" },
    { src: "accessorie3.png", rarity: "epic" },
    { src: "accessorie4.png", rarity: "legendary" },
  ],
};

const rarityWeights = { common: 50, uncommon: 30, rare: 15, epic: 4, legendary: 1 };
const rarityPoints = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5 };
const rarityColors = {
  common: "rarity-common",
  uncommon: "rarity-uncommon",
  rare: "rarity-rare",
  epic: "rarity-epic",
  legendary: "rarity-legendary",
};

// Leaderboard-Funktionen
function updateLeaderboard(name, rank) {
  const leaderboardRef = ref(db, "leaderboard/");
  push(leaderboardRef, { name, rank });
}

function renderLeaderboard() {
  const leaderboardRef = ref(db, "leaderboard/");
  onValue(leaderboardRef, (snapshot) => {
    const leaderboard = [];
    snapshot.forEach((childSnapshot) => {
      leaderboard.push(childSnapshot.val());
    });

    leaderboard.sort((a, b) => a.rank - b.rank);

    const leaderboardList = document.getElementById("leaderboardList");
    leaderboardList.innerHTML = leaderboard
      .slice(0, 10)
      .map((entry, index) => `<li>#${index + 1}: ${entry.name} (Rank ${entry.rank})</li>`)
      .join("");
  });
}

// Funktionen für Charakter und Attribute
function randomizeCharacter() {
  const selectedAssets = {};
  for (const layer in layers) {
    const assets = layers[layer];
    const weightedAssets = assets.flatMap((asset) =>
      Array(rarityWeights[asset.rarity]).fill(asset)
    );
    selectedAssets[layer] = weightedAssets[Math.floor(Math.random() * weightedAssets.length)];
    document.getElementById(layer).src = selectedAssets[layer].src;
  }

  const score = calculateScore(selectedAssets);
  const rank = calculateRank(selectedAssets);
  updateAttributes(selectedAssets, score, rank);
}

function calculateScore(assets) {
  return Object.values(assets).reduce((score, asset) => score + rarityPoints[asset.rarity], 0);
}

function calculateRank(assets) {
  const probabilities = Object.values(assets).map((asset) => rarityWeights[asset.rarity] / 100);
  const combinedProbability = probabilities.reduce((prod, prob) => prod * prob, 1);

  const rank = Math.ceil(1 / combinedProbability);
  return rank;
}

function updateAttributes(assets, score, rank) {
  const attributesContainer = document.querySelector(".attributes");
  attributesContainer.innerHTML = Object.entries(assets)
    .map(
      ([layer, asset]) =>
        `<div>${layer}: ${asset.src.replace(".png", "")} - <span class="${rarityColors[asset.rarity]}">${asset.rarity.toUpperCase()}</span></div>`
    )
    .join("");

  const scoreSection = document.querySelector(".score-section");
  scoreSection.innerHTML = `<div>Total Score: ${score}</div><div>Rank: ${rank}</div>`;
}

// Bild-Download mit Rank und Name
function downloadCharacterImage() {
  const name = document.getElementById("nameInput").value || "Unnamed";
  const rankText = document.querySelector(".score-section").textContent.match(/Rank: (\d+)/);
  const rank = rankText ? rankText[1] : "Unknown";

  // Bild herunterladen
  html2canvas(document.getElementById("previewContainer")).then((canvas) => {
    const finalCanvas = document.createElement("canvas");
    finalCanvas.width = canvas.width;
    finalCanvas.height = canvas.height;
    const context = finalCanvas.getContext("2d");

    context.drawImage(canvas, 0, 0);

    context.font = "24px 'Patrick Hand'";
    context.fillStyle = "#000000";
    context.textAlign = "left";
    context.fillText(`Rank ${rank} - ${name}`, 20, 980);

    const fileName = `Fric_${name.replace(/\s+/g, "_")}_Rank${rank}.png`;
    const link = document.createElement("a");
    link.href = finalCanvas.toDataURL("image/png");
    link.download = fileName;
    link.click();
  });

  // Leaderboard aktualisieren
  updateLeaderboard(name, rank);
}

document.getElementById("randomizeButton").addEventListener("click", randomizeCharacter);
document.getElementById("downloadButton").addEventListener("click", downloadCharacterImage);

// Initialisieren
randomizeCharacter();
renderLeaderboard();
