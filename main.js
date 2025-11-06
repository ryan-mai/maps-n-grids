class formManager {
    constructor() {
        this.map = L.map(document.getElementById('map'));
        this.geocoderControl = L.Control.geocoder({ defaultMarkGeocode: true });
        this.geocoderService = L.Control.Geocoder.nominatim();
        
        this.geoMarker = null;
        this.geoCircle = null;
        this.dropMarker = null;
        this.zoomed = false;

        this.city = document.getElementById('city');
        this.pic = document.getElementById('pic');
        this.desc = document.getElementById('desc');
        this.form = document.getElementById('form');
        this.errorEl = document.getElementById('error');
        this.preview = document.getElementById('preview');

        this.isUploaded = false;
        this.uploadedUrl = null;
        this.pendingCoord = null;
        this.init();
    }

    init() {
        this.map.setView([51.05, -0.09], 1);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(this.map);

        this.geocoderControl.on('markgeocode', (e) => {
            const loc = e.geocode.center;
            L.marker(loc).addTo(this.map);
            this.map.setView(loc, 13);

            // Approximate location
            var bbox = e.geocode.bbox;
            var poly = new L.Polygon([
            bbox.getSouthEast(),
            bbox.getNorthEast(),
            bbox.getNorthWest(),
            bbox.getSouthWest()
            ]).addTo(this.map);
            this.map.fitBounds(poly.getBounds());
        })

        this.geocoderControl.addTo(this.map);
        

        var trips = [
            {
                lat: 48.85838902073378,
                lng: 2.294531041509247,
                title: "Paris",
                desc: "<img src='/img/eiffel_tower.jpg' width='200'><p>The beautiful Eiffel Tower lit up at night!</p>"
            }
        ];

        trips.forEach((trip) => {
            const tripMarker = L.marker([trip.lat, trip.lng], { title: trip.title }).addTo(this.map);
            tripMarker.bindPopup("<img src='/img/eiffel_tower.jpg'><p>The beautiful Eiffel Tower at night!</p>")
            this.editMarker(tripMarker, trip.desc);
        });

        this.map.on('click', (e) => {
            this.pendingCoord = e.latlng;
            if (this.dropMarker) this.map.removeLayer(this.dropMarker);
            this.dropMarker = L.marker(e.latlng).addTo(this.map);
            this.errorEl.innerText = '';

            const container = L.DomUtil.create('div', 'edit-popup');
            const textArea =L.DomUtil.create('textarea', '', container);
            textArea.style.width = '220px';
            textArea.rows = 4;
            textArea.value = this.desc.value || '';

            const btnWrap = L.DomUtil.create('div', '', container);
            btnWrap.style.marginTop = '6px';

            const saveBtn = L.DomUtil.create('button', '', btnWrap);
            saveBtn.type = 'button';
            saveBtn.textContent = 'Save';
            saveBtn.style.marginRight = '6px';

            const cancelBtn = L.DomUtil.create('button', '', btnWrap);
            cancelBtn.type = 'button';
            cancelBtn.textContent = 'Cancel';

            L.DomEvent.disableClickPropagation(container);
            L.DomEvent.disableScrollPropagation(container);

            L.DomEvent.on(saveBtn, 'click', (ev) => {
                L.DomEvent.stop(ev);
                const updateDesc = textArea.value.trim();
                this.desc.value = updateDesc;
                if (this.dropMarker) {
                    this.dropMarker.bindPopup(`<p>${this.escape(updateDesc)}</p>`);
                }
                this.map.closePopup();
            });

            L.DomEvent.on(cancelBtn, 'click', (ev) => {
                L.DomEvent.stop(ev);
                this.map.closePopup();
            });

            this.dropMarker.bindPopup(container).openPopup();
        });

        this.pic.addEventListener('change', (e) => { 
            const file = e.target.files && e.target.files[0];
            if (file) this.fileUpload(file)
        });

        this.form.addEventListener('submit', this.handleSubmit.bind(this));
    }

    strip(html) {
        const div = document.createElement('div');
        div.innerHTML = html || '';
        return div.textContent || div.innerText || '';
    }

    editMarker(marker, desc) {
        let currentDesc = desc || '';

        const viewPopup = () => {
            const container = L.DomUtil.create('div', 'edit-popup');
            const view = L.DomUtil.create('div', '', container);
            view.innerHTML = currentDesc || '<p>(no description)</p>';

            const btnWrap = L.DomUtil.create('div', '', container);
            btnWrap.style.marginTop = '6px';
            const editBtn = L.DomUtil.create('button', '', btnWrap);
            editBtn.type = 'button';
            editBtn.textContent = 'Edit';

            L.DomEvent.disableClickPropagation(container);
            L.DomEvent.disableScrollPropagation(container);

            L.DomEvent.on(editBtn, 'click', (ev) => {
                L.DomEvent.stop(ev);
                container.innerHTML = '';

                const textArea = L.DomUtil.create('textarea', '', container);
                textArea.style.width = '220px';
                textArea.rows = 4;
                textArea.value = this.desc.value || this.strip(currentDesc);

                const editorBtn = L.DomUtil.create('div', '', container);
                editorBtn.style.marginTop = '6px';

                const saveBtn = L.DomUtil.create('button', '', editorBtn);
                saveBtn.type = 'button';
                saveBtn.textContent = 'Save';
                saveBtn.style.marginRight = '6px';
                
                const cancelBtn = L.DomUtil.create('button', '', editorBtn);
                cancelBtn.type = 'button';
                cancelBtn.textContent = 'Cancel';

                L.DomEvent.on(saveBtn, 'click', (ev2) => {
                    L.DomEvent.stop(ev2);
                    const updateText = textArea.value.trim();
                    this.desc.value = updateText || '';
                    
                    currentDesc = `<p>${this.escape(updateText)}</p>`;
                    marker.bindPopup(currentDesc).openPopup();
                });

                L.DomEvent.on(cancelBtn, 'click', (ev2) => {
                    L.DomEvent.stop(ev2);
                    this.map.closePopup();
                });
            });

            return container;
        };

        marker.on('click', (e) => {
            marker.bindPopup(viewPopup()).openPopup();
        })
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
                this.uploadedUrl = ev.target.result;

                if (this.preview) {
                    this.preview.src = ev.target.result;
                    this.preview.style.display = 'block';
                }
                this.errorEl.innerText = '';
            };
            uploadImg.src = ev.target.result;
        };
        reader.onerror = (err) => this.errorEl.innerText = `So cooked, got errr: ${err}`;
        reader.readAsDataURL(file);
    }

    handleSubmit(e) {
        e.preventDefault();
        const city = (this.city.value || '').trim();
        const desc = (this.desc.value || '').trim();

        // if (!this.pendingCoord) {
        //     this.errorEl.innerText = 'Click map to choose location...';
        //     return;
        // }

        if (!city || !desc) {
            this.errorEl.innerText = 'City and description needed!!';
            return;
        }

        const safeCity = this.escape(city);
        const safeDesc = this.escape(desc);
        const imageHtml = this.isUploaded && this.uploadedUrl
            ? `<img src="${this.uploadedUrl}" width="200" style="display:block;margin-bottom:8px;">`
            : '';

        const popupHtml = `
            ${imageHtml}
            <strong>${safeCity}</strong>
            <p style="margin:6px 0 0;">${safeDesc}</p>
        `;

        this.geocoderService.geocode(safeCity)
            .then((results) => this.geocodeLookup(results, popupHtml))
            .catch((err) => {
                console.error('geocode error', err);
                this.errorEl.innerText = 'Geocoding failed';
            });
        
            // const marker = L.marker(this.pendingCoord).addTo(this.map);
        // marker.bindPopup(popupHtml).openPopup();

        this.form.reset();
        if (this.preview) {
            this.preview.src = '';
            this.preview.style.display = 'none';
        }
        this.isUploaded = false;
        this.uploadedUrl = null;
        this.pendingCoord = null;
        if (this.dropMarker) {
            this.map.removeLayer(this.dropMarker);
            this.dropMarker = null;
        }
        this.errorEl.innerText = '';

        // this.map.setView(marker.getLatLng(), Math.max(this.map.getZoom(), 8));
    }

    geocodeLookup(res, popup) {
        if (!res || res.length === 0) {
            this.errorEl.innerText = 'No city/country found :(';
            return;
        };

        const result = res[0];
        const loc = result.center;

        const marker = L.marker(loc, { draggable: true }).addTo(this.map);
        marker.on('dragend', (e) => {
            const { lat, lng } = e.target.getLatLng();
            this.reverseGeocode(lat, lng, marker);
        });

        this.editMarker(marker, popup || '');
        if (popup) marker.openPopup();

        const zoom = Math.max(this.map.getZoom(), 8)
        this.map.setView(loc, zoom);
    }

    reverseGeocode(lat, lng, marker) {
        this.geocoderService.reverse({ lat, lng }, this.map.getZoom())
            .then((res) => {
                if (!res || res.length === 0) {
                    console.error('Could not find city/country');
                    return;
                }

                const result = res[0];
                const name = result.name || (result.properties && result.properties.display_name) || '???';
                const safeName = this.escape(String(name));
                
                if (marker && typeof marker.bindPopup === 'function') {
                    marker.bindPopup(`<strong>${safeName}</strong>`).openPopup();
                } else {
                    this.errorEl.innerText = safeName
                };
            })
            .catch((err) => {
                console.error(err);
            });
    }

    success(pos) {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const acc = pos.coords.accuracy;

        if (this.geoMarker) this.map.removeLayer(this.geoMarker);
        if(this.geoCircle) this.map.removeLayer(this.geoCircle);

        this.geoMarker = L.marker([lat, lng]).addTo(this.map);
        this.geoCircle = L.circle([lat, lng], { radius: acc }).addTo(this.map);
        
        if (!this.zoomed) {
            this.map.fitBounds(this.geoCircle.getBounds());
            this.zoomed = true;
        }
        // this.map.setView([lat, lng]);
    }

    error(err) {
        if (err.code === 1) alert('Please enable access');
        else this.errorEl.innerText = 'Could not access your location :(';
    }

    escape(s) {
        return s.replace(/[&<>"']/g, (c) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[c]);
    }
}

window.addEventListener('DOMContentLoaded', () => new formManager());