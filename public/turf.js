class TurfHelper {
    constructor(map, getTripsFn = () => [], getActionsFn = () => [], colorsMap = {}) {
        this.map = map;
        this.getTrips = getTripsFn;
        this.getActions = getActionsFn;
        this.countryBoundaries = null;
        this.countryLayer = null;
        this.colorsMap = colorsMap || {};
    }

    async loadCountries() {
        const url = 'https://r2.datahub.io/clvyjaryy0000la0cxieg4o8o/main/raw/data/countries.geojson';
        const res = await fetch(url);
        this.countryBoundaries = await res.json();
    }

    getAllPoints() {
        const a = (this.getTrips() || [])
            .map(t => ({ lat: Number(t.lat), lng: Number(t.lng) }))
            .filter(pt => Number.isFinite(pt.lat) && Number.isFinite(pt.lng));
        const b = (this.getActions() || [])
            .map(t => ({ lat: Number(t.lat), lng: Number(t.lng) }))
            .filter(pt => Number.isFinite(pt.lat) && Number.isFinite(pt.lng));
        return a.concat(b);
    }

    getCountryCounts() {
        if (!this.countryBoundaries?.features) return {};
        const points = this.getAllPoints();
        if (!points.length) return {};
        const counts = {};
        for (const f of this.countryBoundaries.features) {
            const name = f.properties?.name;
            if (name) counts[name] = 0;
        }
        for (const p of points) {
            const pt = turf.point([p.lng, p.lat]);
            for (const f of this.countryBoundaries.features) {
                try {
                    if (turf.booleanPointInPolygon(pt, f)) {
                        const name = f.properties?.name;
                        if (name) counts[name] = (counts[name] || 0) + 1;
                        break;
                    }
                } catch (err) {
                    console.error('Polygonnnn error', err);
                }
            }
        }
        Object.keys(counts).forEach(k => { if (!counts[k]) delete counts[k]; });
        return counts;
    }

    _getCountryColor(name) {
        if (!name) return 'hsl(0, 0%, 75%)';
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
        }
        const hue = hash % 360;
        return `hsl(${hue}, 65%, 55%)`;
    }

    drawPolygons() {
        if (!this.countryBoundaries) return;
        if (this.countryLayer) {
            try {
                this.map.removeLayer(this.countryLayer);
            } catch (err) {
                console.error(err)
            }
        }
        const counts = this.getCountryCounts();
        const max = Math.max(...Object.values(counts), 1);
        
        const styleFor = (feature) => {
            const name = feature.properties?.name;
            const val = counts[name] || 0;

            const baseColor = this._getCountryColor(name);

            return {
                color: '#444',
                weight: 1,
                fillColor: baseColor,
                fillOpacity: val ? 0.6 : 0.0
            };
        };

        this.countryLayer = L.geoJSON(this.countryBoundaries, {
            style: styleFor,
            onEachFeature: (feature, layer) => {
                const name = feature.properties?.name;
                const val = counts[name] || 0;
                if (val) layer.bindPopup(`${name}: ${val} actions`);
            }
        }).addTo(this.map);
    }

    refresh() {
        this.drawPolygons();
    }

    clear() {
        if (this.countryLayer) {
            try {
                this.map.removeLayer(this.countryLayer);
            } catch (err) {
                console.error(err)
            }
            this.countryLayer = null;
        }
    }
}

window.TurfHelper = TurfHelper;