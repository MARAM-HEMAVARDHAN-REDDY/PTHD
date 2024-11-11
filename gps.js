class GPSTracker {
    constructor() {
        this.currentPosition = null;
        this.previousPosition = null;
        this.setupGPS();
    }

    setupGPS() {
        if ('geolocation' in navigator) {
            navigator.geolocation.watchPosition(
                position => {
                    this.previousPosition = this.currentPosition;
                    this.currentPosition = position;
                    this.updateSpeed();
                    this.updateCoordinates();
                },
                error => console.error('GPS Error:', error),
                { enableHighAccuracy: true }
            );
        }
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3;
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    updateSpeed() {
        if (this.previousPosition && this.currentPosition) {
            const distance = this.calculateDistance(
                this.previousPosition.coords.latitude,
                this.previousPosition.coords.longitude,
                this.currentPosition.coords.latitude,
                this.currentPosition.coords.longitude
            );
            const time = (this.currentPosition.timestamp - this.previousPosition.timestamp) / 1000;
            const speed = (distance / time) * 3.6;
            document.getElementById('speed').textContent = `${Math.round(speed)} km/h`;
        }
    }

    updateCoordinates() {
        if (this.currentPosition) {
            const coords = this.currentPosition.coords;
            document.getElementById('coordinates').textContent = 
                `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
        }
    }

    getCurrentPosition() {
        return this.currentPosition;
    }
}

const gpsTracker = new GPSTracker();