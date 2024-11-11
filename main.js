class DetectionApp {
    constructor() {
        this.detectionLogs = [];
        this.worker = new Worker('detection.worker.js');
        this.warningTimeout = null;
        this.setupCanvas();
        this.setupWorkerHandlers();
        this.setupDownloadButton();
        this.init();
    }

    setupCanvas() {
        this.canvas = document.getElementById('detectionCanvas');
        this.ctx = this.canvas.getContext('2d');
    }

    async init() {
        await this.setupWebcam();
        this.worker.postMessage({ type: 'load' });
    }

    setupWorkerHandlers() {
        this.worker.onmessage = (e) => {
            if (e.data.type === 'modelLoaded') {
                this.startDetection();
            } else if (e.data.type === 'predictions') {
                this.handlePredictions(e.data.predictions);
            }
        };
    }

    async setupWebcam() {
        const video = document.getElementById('webcam');
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
            audio: false
        });
        video.srcObject = stream;
        return new Promise(resolve => {
            video.onloadedmetadata = () => {
                // Set canvas size to match video
                this.canvas.width = video.videoWidth;
                this.canvas.height = video.videoHeight;
                resolve();
            };
        });
    }

    async startDetection() {
        const video = document.getElementById('webcam');
        const offscreenCanvas = new OffscreenCanvas(video.videoWidth, video.videoHeight);
        const offscreenCtx = offscreenCanvas.getContext('2d');
        
        const detect = async () => {
            offscreenCtx.drawImage(video, 0, 0);
            const imageData = offscreenCtx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height);
            this.worker.postMessage({ 
                type: 'detect',
                imageData: imageData
            }, [imageData.data.buffer]);
            
            fpsCounter.update();
            requestAnimationFrame(detect);
        };
        
        detect();
    }

    drawBoundingBoxes(predictions) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        predictions.forEach(prediction => {
            if (prediction.score > 0.5) {
                const [x, y, width, height] = prediction.bbox;
                
                // Draw semi-transparent green box
                this.ctx.strokeStyle = '#00FF00';
                this.ctx.lineWidth = 2;
                this.ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
                
                this.ctx.beginPath();
                this.ctx.rect(x, y, width, height);
                this.ctx.fill();
                this.ctx.stroke();
                
                // Draw label
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                this.ctx.fillRect(x, y - 25, prediction.class.length * 10 + 40, 25);
                this.ctx.fillStyle = '#00FF00';
                this.ctx.font = '16px Arial';
                this.ctx.fillText(
                    `${prediction.class} ${(prediction.score * 100).toFixed(0)}%`,
                    x + 5, y - 7
                );
            }
        });
    }

    handlePredictions(predictions) {
        this.drawBoundingBoxes(predictions);
        
        predictions.forEach(prediction => {
            if (prediction.score > 0.5) {
                const currentPosition = gpsTracker.getCurrentPosition();
                const log = {
                    datetime: new Date().toISOString(),
                    event: prediction.class,
                    coordinates: currentPosition ? 
                        `${currentPosition.coords.latitude},${currentPosition.coords.longitude}` : 'N/A',
                    quantity: 1,
                    confidence: prediction.score.toFixed(2)
                };
                this.detectionLogs.push(log);
                this.updateDetectionLogs();
                
                if (prediction.class === 'person' && prediction.score > 0.7) {
                    this.showWarning(`Pedestrian detected ${(prediction.score * 100).toFixed(0)}% confidence`);
                }
            }
        });
    }

    updateDetectionLogs() {
        const logsDiv = document.getElementById('logs');
        logsDiv.innerHTML = this.detectionLogs
            .slice(-5)
            .map(log => `<div>${log.datetime.split('T')[1].split('.')[0]} - ${log.event}</div>`)
            .join('');
    }

    showWarning(text) {
        const warning = document.getElementById('warning');
        const warningText = document.getElementById('warningText');
        
        // Clear any existing timeout
        if (this.warningTimeout) {
            clearTimeout(this.warningTimeout);
            this.warningTimeout = null;
        }
        
        // Only show new warning if not already displayed
        if (warning.style.display !== 'block') {
            warningText.textContent = text;
            warning.style.display = 'block';
            

        }
        // Set new timeout
        this.warningTimeout = setTimeout(() => {
            warning.style.display = 'none';
            this.warningTimeout = null;
        }, 1000);
    }

    setupDownloadButton() {
        document.getElementById('downloadBtn').addEventListener('click', () => {
            const csv = [
                ['DateTime', 'Event', 'Coordinates', 'Quantity', 'Confidence'],
                ...this.detectionLogs.map(log => [
                    log.datetime,
                    log.event,
                    log.coordinates,
                    log.quantity,
                    log.confidence
                ])
            ].map(row => row.join(',')).join('\n');

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'detection_logs.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }
}

// Start the application
const app = new DetectionApp();