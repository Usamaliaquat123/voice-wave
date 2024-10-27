const canvas = document.getElementById("waveCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const turbulenceFactor = 0.25;
const maxAmplitude = canvas.height / 3.5; // Max amplitude of the wave
const baseLine = canvas.height / 2; // Vertical center of the canvas
const numberOfWaves = 10;
let globalTime = 0;

function createGradient() {
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, "rgba(255, 25, 255, 0.2)");
    gradient.addColorStop(0.5, "rgba(25, 255, 255, 0.75)");
    gradient.addColorStop(1, "rgba(255, 255, 25, 0.2");
    return gradient;
}

const gradient = createGradient();

function generateSmoothWave(dataArray, frequency = 0.1, amplitude = 64) {
    const array = new Uint8Array(100);
    for (let i = 0; i < array.length; i++) {
        array[i] = (Math.sin(i * frequency + globalTime) + 1) * amplitude;
    }

    return array;
}

function animateWaves(dataArray, analyser) {
    const isSpeaking = dataArray.some((value) => value > 0);
    if (isSpeaking) {
        // Speaking
        analyser.getByteFrequencyData(dataArray);
    } else {
        // Thinking Mode
        dataArray = generateSmoothWave(dataArray, 0.05, 16);
    }
    drawWave(dataArray, analyser);
}

navigator.mediaDevices
    .getUserMedia({ audio: true, video: false })
    .then((stream) => {
        const audioContext = new (window.AudioContext ||
            window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const waves = dataArray.slice(0, 250);
        animateWaves(waves, analyser);
    })
    .catch((error) => {
        console.error("Access to microphone denied", error);
    });

function drawWave(dataArray, analyser) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    globalTime += 0.05;

    for (let j = 0; j < numberOfWaves; j++) {
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = gradient;

        let x = 0;

        let sliceWidth = (canvas.width * 1.0) / dataArray.length;

        let lastX = 0;
        let lastY = baseLine;

        for (let i = 0; i < dataArray.length; i++) {
            const v = dataArray[i] / 96.0;
            const mid = dataArray.length / 2;
            const distanceFromMid = Math.abs(i - mid) / mid;
            const dampFactor = 1 - Math.pow((2 * i) / dataArray.length - 1, 2); // Creates a parabolic falloff

            const amplitude = maxAmplitude * dampFactor * (1 - distanceFromMid);
            const isWaveInverted = j % 2 ? 1 : -1;
            const frequency = isWaveInverted * (0.05 + turbulenceFactor);

            const y =
                baseLine + Math.sin(i * frequency + globalTime + j) * amplitude * v;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                let xc = (x + lastX) / 2;
                let yc = (y + lastY) / 2;
                ctx.quadraticCurveTo(lastX, lastY, xc, yc);
            }

            lastX = x;
            lastY = y;
            x += sliceWidth;
        }

        ctx.lineTo(canvas.width, lastY);
        ctx.stroke();
    }

    requestAnimationFrame(() => animateWaves(dataArray, analyser));
}
