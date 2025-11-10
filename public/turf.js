class TurfHelper {
    constructor(map, getTripsFn = () => [], getActionsFn = () => []) {
        this.map = map;
        this.getTrips = getTripsFn;
        this.getActions = getActionsFn;
        this.countryBoundaries = null;
        this.countryLayer = null;
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
        this.countryLayer = L.geoJSON(this.countryBoundaries, {
            style: feature => {
                const name = feature.properties?.name;
                const val = counts[name] || 0;
                const ratio = val / max;
                const color = val
                    ? `rgb(${255 * ratio}, ${80 + 50 * (1 - ratio)}, ${255 * (1 - ratio)})`
                    : 'rgba(0,0,0,0)';
                return {
                    color: '#444',
                    weight: 1,
                    fillColor: color,
                    fillOpacity: val ? 0.6 : 0
                };
            },
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