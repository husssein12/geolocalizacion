// Inicialización del mapa
const map = L.map('map').setView([-15.8402, -70.0219], 13);

// Añadir capa base al mapa
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

class Grid {
    constructor(size) {
        this.size = size;
        this.cells = new Map();
    }

    getCellKey(lat, lng) {
        const x = Math.floor(lat / this.size);
        const y = Math.floor(lng / this.size);
        return `${x},${y}`;
    }

    addRestaurant(restaurant) {
        const key = this.getCellKey(restaurant.lat, restaurant.lng);
        if (!this.cells.has(key)) {
            this.cells.set(key, []);
        }
        this.cells.get(key).push(restaurant);
        const marker = L.marker([restaurant.lat, restaurant.lng], {
            title: restaurant.name
        }).addTo(map);
        marker.bindTooltip(restaurant.name, {permanent: true, direction: 'right'});
        marker.bindPopup(`${restaurant.name} - ${restaurant.description}`);
    }

    getNearbyRestaurants(lat, lng) {
        const x = Math.floor(lat / this.size);
        const y = Math.floor(lng / this.size);
        const nearbyRestaurants = [];
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const key = `${x + dx},${y + dy}`;
                const restaurants = this.cells.get(key);
                if (restaurants) {
                    nearbyRestaurants.push(...restaurants.map(restaurant => ({
                        ...restaurant,
                        distance: Math.sqrt(
                            Math.pow(restaurant.lat - lat, 2) + Math.pow(restaurant.lng - lng, 2)
                        )
                    })));
                }
            }
        }
        return nearbyRestaurants.sort((a, b) => a.distance - b.distance);
    }
}

// Crear una instancia de la cuadrícula
const grid = new Grid(0.01); // Tamaño de celda aproximadamente 1km x 1km

// Datos de ejemplo con restaurantes más dispersos
const restaurants = [
    { name: "Pizza Pata", lat: -15.8402, lng: -70.0219, description: "Pizzería gourmet con ingredientes locales" },
    { name: "Mojsa Restaurant", lat: -15.8389, lng: -70.0278, description: "Cocina andina de alta calidad" },
    { name: "La Casona Restaurant", lat: -15.8350, lng: -70.0195, description: "Platos típicos en ambiente colonial" },
    { name: "Balcones de Puno", lat: -15.8321, lng: -70.0256, description: "Vista espectacular del lago Titicaca" },
    { name: "Café Bar de la Casa del Corregidor", lat: -15.8372, lng: -70.0281, description: "Café histórico con música en vivo" },
    { name: "Colors Restaurant", lat: -15.8425, lng: -70.0230, description: "Fusión de sabores internacionales y locales" },
    { name: "Tulipan's Restaurant & Pizzería", lat: -15.8410, lng: -70.0330, description: "Especialidad en pizzas y pastas" }
];

// Añadir restaurantes a la cuadrícula
restaurants.forEach(restaurant => {
    grid.addRestaurant(restaurant);
});

// Visualizar la cuadrícula
function drawGrid() {
    const bounds = map.getBounds();
    const northWest = bounds.getNorthWest();
    const southEast = bounds.getSouthEast();
    const startLat = Math.floor(northWest.lat / grid.size) * grid.size;
    const endLat = Math.ceil(southEast.lat / grid.size) * grid.size;
    const startLng = Math.floor(northWest.lng / grid.size) * grid.size;
    const endLng = Math.ceil(southEast.lng / grid.size) * grid.size;
    for (let lat = startLat; lat <= endLat; lat += grid.size) {
        for (let lng = startLng; lng <= endLng; lng += grid.size) {
            L.rectangle([[lat, lng], [lat + grid.size, lng + grid.size]], {
                color: "#ff7800",
                weight: 1
            }).addTo(map);
        }
    }
}

// Redibujar la cuadrícula cada vez que el mapa se mueva
map.on('moveend', drawGrid);
drawGrid();

// Mostrar restaurantes cercanos y actualizar cuadro de información
map.on('click', function(e) {
    const nearbyRestaurants = grid.getNearbyRestaurants(e.latlng.lat, e.latlng.lng);
    let content = 'Restaurantes cercanos:<br>';
    nearbyRestaurants.forEach((restaurant, index) => {
        content += `${index + 1}. ${restaurant.name} - ${restaurant.description}<br>`;
    });
    L.popup()
        .setLatLng(e.latlng)
        .setContent(content)
        .openOn(map);
});
