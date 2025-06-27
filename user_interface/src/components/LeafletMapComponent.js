// import React from 'react';
// import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
// import 'leaflet/dist/leaflet.css';
// import '../styles/SearchResultsComponent.css';

// const LeafletMapComponent = ({ center, markers }) => {
//   return (
//     <MapContainer center={center} zoom={13} className="map-container">
//       <TileLayer
//         url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//         attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//       />
//       {markers.map((marker, index) => (
//         <Marker key={index} position={[marker.lat, marker.lng]}>
//           <Popup>
//             <b>{marker.name}</b>
//           </Popup>
//         </Marker>
//       ))}
//     </MapContainer>
//   );
// };

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/SearchResultsComponent.css';

const RefreshMap = () => {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [map]);
  return null;
};

const LeafletMapComponent = ({ center, markers = [] }) => {
  return (
    <MapContainer
      center={center}
      zoom={13}
      className="map-container"
      style={{ height: "500px", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <RefreshMap />
      {markers.length > 0 &&
        markers.map((marker, index) => (
          <Marker key={index} position={[marker.lat, marker.lng]}>
            <Popup>
              <b>{marker.name}</b>
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
};

export default LeafletMapComponent;
