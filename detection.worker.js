importScripts('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs');
importScripts('https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd');

let model = null;

async function loadModel() {
    model = await cocoSsd.load();
    postMessage({ type: 'modelLoaded' });
}

async function detectObjects(imageData) {
    if (!model) return;
    
    const predictions = await model.detect(imageData);
    postMessage({ 
        type: 'predictions',
        predictions: predictions
    });
}

self.onmessage = async function(e) {
    switch (e.data.type) {
        case 'load':
            await loadModel();
            break;
        case 'detect':
            await detectObjects(e.data.imageData);
            break;
    }
};