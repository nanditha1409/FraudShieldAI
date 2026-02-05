const API_URL = "http://localhost:8000/analyze-call"; // Update this to your ngrok URL for remote testing
const API_KEY = "HACKATHON_DEMO_2026";

const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const loader = document.getElementById('loader');
const resultsDiv = document.getElementById('results');

// File Upload Handling
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('active');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('active');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('active');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
});

async function handleFile(file) {
    const reader = new FileReader();
    reader.onload = async (e) => {
        const base64 = e.target.result.split(',')[1];
        const format = file.name.split('.').pop();
        await analyze({
            audio_base64: base64,
            audio_format: format,
            language: "en"
        });
    };
    reader.readAsDataURL(file);
}

async function analyzeUrl() {
    const url = document.getElementById('url-input').value;
    if (!url) return alert("Please enter a valid URL");

    await analyze({
        audio_url: url,
        audio_format: url.split('.').pop() || "mp3",
        language: "en"
    });
}

async function analyze(payload) {
    showLoader(true);
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (response.status === 200) {
            displayResults(data);
        } else {
            alert("Error: " + (data.detail || "Analysis failed"));
        }
    } catch (error) {
        console.error(error);
        alert("Could not connect to API. Make sure the server is running.");
    } finally {
        showLoader(false);
    }
}

function displayResults(data) {
    resultsDiv.style.display = 'block';
    resultsDiv.scrollIntoView({ behavior: 'smooth' });

    // Update Score & Label
    const score = Math.round(data.confidence * 100);
    document.getElementById('risk-score').innerText = score + "%";
    document.getElementById('risk-label').innerText = data.classification;

    // Update Gauge
    const circle = document.getElementById('risk-circle');
    const offset = 283 - (283 * data.confidence);
    circle.style.strokeDashoffset = offset;

    // Set Color based on risk
    let color = 'var(--safe)';
    if (data.classification === 'HIGH') color = 'var(--danger)';
    else if (data.classification === 'MEDIUM') color = 'var(--warning)';
    circle.style.stroke = color;

    // Update Text
    document.getElementById('final-verdict').innerText = data.classification === 'SAFE' ? 'SECURE CALL' : 'THREAT DETECTED';
    document.getElementById('final-verdict').style.color = color;
    document.getElementById('explain-reason').innerText = data.reason;
    document.getElementById('transcript-text').innerText = data.transcript || "No speech detected.";

    // Update Stats
    document.getElementById('stat-db').innerText = (data.acoustics?.avg_db || 0) + " dB";
    document.getElementById('stat-silence').innerText = Math.round((data.acoustics?.silence_ratio || 0) * 100) + "%";

    // Update Keywords
    const list = document.getElementById('keywords-list');
    list.innerHTML = "";
    if (data.matched_keywords && data.matched_keywords.length > 0) {
        data.matched_keywords.forEach(kw => {
            const span = document.createElement('span');
            span.className = 'tag';
            span.innerText = kw;
            list.appendChild(span);
        });
    } else {
        list.innerHTML = "<small>No specific fraud keywords identified.</small>";
    }
}

function showLoader(show) {
    loader.style.display = show ? 'flex' : 'none';
}
