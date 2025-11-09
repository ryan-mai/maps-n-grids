class turfHelper {
    constructor() {
        this.map = L.map(document.getElementById('map'));
        this.countryBoundaries = null;
        this.countryLayer = null;
        this.init();
    }
    
    async init() {
        await this.loadCountries();

        this.countryLayer.addTo(this.map);
    }

    async loadCountries() {
        const url = 'https://r2.datahub.io/clvyjaryy0000la0cxieg4o8o/main/raw/data/countries.geojson';
        const res = await fetch(url);
        const data = res.json();
        this.countryBoundaries = data;
    }


    getAllPoints() {
        const a = (this.trips || [])
            .map(t => ({ lat: Number(t.lat), lng: Number(t.lng) }))
            .filter(pt => Number.isFinite(pt.lat) && Number.isFinite(pt.lng));
        const b = (this.actions || [])
            .map(t => ({ lat: Number(t.lat), lng: Number(t.lng) }))
            .filter(pt => Number.isFinite(pt.lat) && Number.isFinite(pt.lng));
        return a.concat(b);
    }

    getCountryCounts() {
        const counts = {}
        const points = this.getAllPoints();

        for (const country of this.countryBoundaries) {
            const name = country.properties.name;
            let count = 0;

            for (const p of points) {
                const pt = turf.points([p.lng, p.lat]);
                const insideBounds = turf.booleanPointInPolygon(pt, country);
                if (insideBounds) count++;
            }
            if (count > 0) counts[name] = count;
        }
        return counts
    }

    drawPolygons() {
        const counts = this.getCountryCounts();
        const max = Math.max(...Object.values(counts), 1);
        
        this.countryLayer = L.geoJSON(data, {
            style: feature => {
                const name = feature.properties.name;
                const val = counts[name] || 0;
                const ratio = val / max; // Count between 0-1
                const color = `rgb(${255 * ratio}, ${80 + 50 * (1 - ratio)}, ${255* (1 - ratio)})`;

                return {
                    color: '#444',
                    weight: 1,
                    fillColor: color,
                    fillOpacity: 0.6,
                };
            },
            onEachFeature: (feature, layer) => {
                const name = feature.properties.name;
                const val = counts[name] || 0;
                layer.bindPopup(`${name}: ${val} actions`);
            }
        }).addTo(this.map);
    }
}

new turfHelper();
