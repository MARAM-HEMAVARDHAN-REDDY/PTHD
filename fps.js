class FPSCounter {
    constructor() {
        this.fps = 0;
        this.frames = 0;
        this.lastTime = performance.now();
        this.fpsElement = document.getElementById('fps');
    }

    update() {
        this.frames++;
        const currentTime = performance.now();
        const elapsed = currentTime - this.lastTime;

        if (elapsed >= 1000) {
            this.fps = Math.round((this.frames * 1000) / elapsed);
            this.fpsElement.textContent = this.fps;
            this.frames = 0;
            this.lastTime = currentTime;
        }
    }
}

const fpsCounter = new FPSCounter();