import { useEffect, useRef } from 'react';
import { useMap } from '@vis.gl/react-google-maps';

export interface MapCircleProps {
  center: { lat: number; lng: number };
  radius: number;
  strokeColor?: string;
  strokeOpacity?: number;
  strokeWeight?: number;
  fillColor?: string;
  fillOpacity?: number;
  editable?: boolean;
  onRadiusChanged?: (radius: number) => void;
  onCenterChanged?: (center: { lat: number; lng: number }) => void;
}

export function MapCircle({
  center,
  radius,
  strokeColor = '#2563eb',
  strokeOpacity = 0.85,
  strokeWeight = 2,
  fillColor = '#3b82f6',
  fillOpacity = 0.18,
  editable = false,
  onRadiusChanged,
  onCenterChanged,
}: MapCircleProps) {
  const map = useMap();
  const circleRef = useRef<google.maps.Circle | null>(null);

  useEffect(() => {
    if (!map) return;

    const circle = new google.maps.Circle({
      map,
      center,
      radius,
      strokeColor,
      strokeOpacity,
      strokeWeight,
      fillColor,
      fillOpacity,
      editable,
      clickable: false,
    });

    circleRef.current = circle;

    let radiusListener: google.maps.MapsEventListener | null = null;
    let centerListener: google.maps.MapsEventListener | null = null;

    if (onRadiusChanged) {
      radiusListener = circle.addListener('radius_changed', () => {
        onRadiusChanged(circle.getRadius());
      });
    }

    if (onCenterChanged) {
      centerListener = circle.addListener('center_changed', () => {
        const c = circle.getCenter();
        if (c) {
          onCenterChanged({ lat: c.lat(), lng: c.lng() });
        }
      });
    }

    return () => {
      if (radiusListener) google.maps.event.removeListener(radiusListener);
      if (centerListener) google.maps.event.removeListener(centerListener);
      circle.setMap(null);
      circleRef.current = null;
    };
  }, [map]);

  // Sync updates to props
  useEffect(() => {
    if (!circleRef.current) return;
    circleRef.current.setCenter(center);
  }, [center.lat, center.lng]);

  useEffect(() => {
    if (!circleRef.current) return;
    if (Math.abs(circleRef.current.getRadius() - radius) > 1) {
      circleRef.current.setRadius(radius);
    }
  }, [radius]);

  useEffect(() => {
    if (!circleRef.current) return;
    circleRef.current.setOptions({
      strokeColor,
      strokeOpacity,
      strokeWeight,
      fillColor,
      fillOpacity,
      editable,
    });
  }, [strokeColor, strokeOpacity, strokeWeight, fillColor, fillOpacity, editable]);

  return null;
}
