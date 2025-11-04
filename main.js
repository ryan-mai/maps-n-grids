class formManager {
    constructor() {
        this.map = L.map(document.getElementById('map'));
        this.marker = null,
        this.circle = null,
        this.zoomed = false;

        this.city = document.getElementById('city');
        this.pic = document.getElementById('pic');
        this.desc = document.getElementById('desc');
        this.form = document.getElementById('form');
        this.errorEl = document.getElementById('error');

        this.isUploaded = false;
        this.init();
    }

    init() {
        this.map.setView([51.05, -0.09], 1);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(this.map);

        var trips = [
            {lat: 48.85838902073378, lng: 2.294531041509247, title: "Paris", desc: "<img src='/img/eiffel_tower.jpg' width='200'><p>The beautiful Eiffel Tower lit up at night!</p>"}
        ]
        trips.forEach((trip) => {
            const tripMarker = L.marker([trip.lat, trip.lng, trip.title]).addTo(map);
            tripMarker.bindPopup("<img src='/img/eiffel_tower.jpg'><p>The beautiful Eiffel Tower at night!</p>")
        });
        // navigator.geolocation.watchPosition(this.success(), this.error());
        this.pic.addEventListener('change', (e) => { 
            const file = e.target.files && e.target.files[0];
            if (file) this.fileUpload(file)
        });
    }

    fileUpload(file) {
        if (!file) {
            this.errorEl.innerText = 'Post a pic bruhhh';
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
            const uploadImg = new Image();
            uploadImg.onerror = (err) => this.errorEl.innerText = `Please upload a file, got errr: ${err}`;        
            uploadImg.onload = () => {
                this.isUploaded = true;
                const preview = document.getElementById('preview');
                if (preview) preview.src = ev.target.result;
            };
        };
        reader.onerror = (err) => this.errorEl.innerText = `So cooked, got errr: ${err}`;
        reader.readAsDataURL(file);
    }

    success(pos) {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const acc = pos.coords.accuracy;

        if (this.marker) {
            this.map.removeLayer(marker);
            this.map.removeLayer(circle);
        }

        this.marker = L.marker([lat, lng]).addTo(map);
        this.circle = L.circle([lat, lng], { radius: acc }).addTo(map);
        
        if (!this.zoomed) {
            this.map.fitBounds(circle.getBounds());
            this.zoomed = true;
        }

        this.map.setView([lat, lng]);
    }

    error(err) {
        if (err.code === 1) alert('Please enable access');
        else alert('Could not access geolocation :(');
    }

    pushInfo() {

    }
}