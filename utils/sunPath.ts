
import SunCalc from 'suncalc';

interface Coordinate {
    latitude: number;
    longitude: number;
}

interface SunAnalysisResult {
    totalDistance: number; // in kilometers
    leftSunDistance: number; // km where sun is on the left
    rightSunDistance: number; // km where sun is on the right
    bestSide: 'Left' | 'Right' | 'Any';
    sunExposurePercentage: number;
}

// Haversine formula for distance
const getDistance = (coord1: Coordinate, coord2: Coordinate): number => {
    const R = 6371; // Earth radius in km
    const dLat = toRad(coord2.latitude - coord1.latitude);
    const dLon = toRad(coord2.longitude - coord1.longitude);
    const lat1 = toRad(coord1.latitude);
    const lat2 = toRad(coord2.latitude);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const toRad = (value: number) => value * Math.PI / 180;
const toDeg = (value: number) => value * 180 / Math.PI;

const getBearing = (start: Coordinate, end: Coordinate): number => {
    const startLat = toRad(start.latitude);
    const startLng = toRad(start.longitude);
    const destLat = toRad(end.latitude);
    const destLng = toRad(end.longitude);

    const y = Math.sin(destLng - startLng) * Math.cos(destLat);
    const x = Math.cos(startLat) * Math.sin(destLat) -
        Math.sin(startLat) * Math.cos(destLat) * Math.cos(destLng - startLng);
    let brng = Math.atan2(y, x);
    brng = toDeg(brng);
    return (brng + 360) % 360; // Normalize to 0-360
};

export const analyzeSunExposure = (coordinates: Coordinate[], date: Date = new Date()): SunAnalysisResult => {
    if (coordinates.length < 2) {
        return {
            totalDistance: 0,
            leftSunDistance: 0,
            rightSunDistance: 0,
            bestSide: 'Any',
            sunExposurePercentage: 0
        };
    }

    let totalDist = 0;
    let leftSunDist = 0;
    let rightSunDist = 0;

    // We assume travel happens roughly at the provided time for the whole route
    // For long routes, really we should interpolate time, but for MVP this is okay
    const tripDate = date;

    for (let i = 0; i < coordinates.length - 1; i++) {
        const start = coordinates[i];
        const end = coordinates[i + 1];

        const segmentDist = getDistance(start, end);
        totalDist += segmentDist;

        // Calculate Bearing of the road
        const bearing = getBearing(start, end);

        // Calculate Sun Position
        // suncalc returns azimuth in radians (South=0, West=PI/2)
        // We convert to North-based degrees (North=0, East=90, South=180, West=270)
        // Formula: (azimuth * 180/PI) + 180
        const sunPos = SunCalc.getPosition(tripDate, start.latitude, start.longitude);
        const sunAzimuth = toDeg(sunPos.azimuth) + 180;

        // Skip if sun is below horizon (altitude < 0) - Night driving
        if (sunPos.altitude < 0) {
            continue;
        }

        // Relative Angle
        let relativeAngle = sunAzimuth - bearing;
        // Normalize to -180 to 180
        relativeAngle = (relativeAngle + 540) % 360 - 180;

        // If relative angle is positive (0 to 180), Sun is on the RIGHT
        // If relative angle is negative (-180 to 0), Sun is on the LEFT
        if (relativeAngle > 0) {
            rightSunDist += segmentDist;
        } else {
            leftSunDist += segmentDist;
        }
    }

    // Recommendation: If sun is on the Right, sit on the Left to avoid it.
    // If sun is on the Left, sit on the Right.
    let bestSide: 'Left' | 'Right' | 'Any' = 'Any';

    // Threshold to care (e.g. 10% difference?)
    if (leftSunDist > rightSunDist) {
        bestSide = 'Right'; // Sun on left, sit right
    } else if (rightSunDist > leftSunDist) {
        bestSide = 'Left'; // Sun on right, sit left
    }

    const maxSunDist = Math.max(leftSunDist, rightSunDist);
    const sunPercentage = totalDist > 0 ? (maxSunDist / totalDist) * 100 : 0;

    return {
        totalDistance: parseFloat(totalDist.toFixed(2)),
        leftSunDistance: parseFloat(leftSunDist.toFixed(2)),
        rightSunDistance: parseFloat(rightSunDist.toFixed(2)),
        bestSide,
        sunExposurePercentage: Math.round(sunPercentage)
    };
};
