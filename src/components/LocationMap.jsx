'use client';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for Leaflet default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapClickHandler({ onMapClick }) {
    useMapEvents({
        click: onMapClick,
    });
    return null;
}

export default function LocationMap({ center, location, onMapClick }) {
    return (
        <MapContainer
            center={center}
            zoom={15}
            style={{ height: '100%', width: '100%' }}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {location && (
                <Marker 
                    position={[
                        location.coordinates.latitude,
                        location.coordinates.longitude
                    ]}
                >
                    <Popup>
                        <div className="text-sm">
                            <p className="font-medium">Your Location</p>
                            <p className="text-xs text-gray-600 mt-1">
                                {location.address}
                            </p>
                        </div>
                    </Popup>
                </Marker>
            )}
            <MapClickHandler onMapClick={onMapClick} />
        </MapContainer>
    );
}
