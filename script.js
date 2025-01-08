// Alle bisherigen Funktionen bleiben unverändert

// Initialisiere oder lade die Rangliste aus LocalStorage
function getLeaderboard() {
    const leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];
    return leaderboard;
}

function saveLeaderboard(leaderboard) {
    localStorage.setItem("leaderboard", JSON.stringify(leaderboard));
}

function updateLeaderboard(name, rank) {
    const leaderboard = getLeaderboard();

    // Füge neuen Eintrag hinzu
    leaderboard.push({ name, rank });

    // Sortiere Rangliste nach Rank (aufsteigend) und begrenze auf Top 10
    leaderboard.sort((a, b) => a.rank - b.rank);
    const top10 = leaderboard.slice(0, 10);

    // Speichere aktualisierte Rangliste
    saveLeaderboard(top10);

    // Aktualisiere die Anzeige
    renderLeaderboard();
}

function renderLeaderboard() {
    const leaderboard = getLeaderboard();
    const leaderboardList = document.getElementById("leaderboardList");

    // Lösche bestehende Einträge
    leaderboardList.innerHTML = "";

    // Füge aktuelle Rangliste hinzu
    leaderboard.forEach((entry, index) => {
        const li = document.createElement("li");
        li.innerHTML = `
            <span class="rank">#${index + 1}</span>
            <span>${entry.name}</span>
            <span>Rank ${entry.rank}</span>
        `;
        leaderboardList.appendChild(li);
    });
}

// Hook in den Download-Button
document.getElementById("downloadButton").addEventListener("click", () => {
    const name = document.getElementById("nameInput").value.trim();
    const rankMatch = document.querySelector(".score-section").textContent.match(/Rank: (\d+) of \d+/);
    const rank = rankMatch ? parseInt(rankMatch[1]) : null;

    if (name && rank) {
        // Füge den Benutzer in die Rangliste ein
        updateLeaderboard(name, rank);
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

// Initiale Anzeige der Rangliste
renderLeaderboard();
