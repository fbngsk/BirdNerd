import { useState, useEffect, useCallback } from 'react';
import { Bird, LocationType } from '../types';
import { fetchLocalBirds } from '../services/birdService';

export const useBirdData = (isVacationMode: boolean) => {
    const [nearbyBirds, setNearbyBirds] = useState<Bird[]>([]);
    const [loading, setLoading] = useState(false);
    const [locationStatus, setLocationStatus] = useState('Warte auf GPS...');

    const refreshBirds = useCallback(() => {
        setLoading(true);
        
        // Define mode for this fetch
        const currentMode: LocationType = isVacationMode ? 'vacation' : 'local';

        if (!navigator.geolocation) {
            setLocationStatus("GPS nicht unterstützt");
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                setLocationStatus("Ortung erfolgreich");
                const { latitude, longitude } = position.coords;
                const birds = await fetchLocalBirds(latitude, longitude, currentMode);
                setNearbyBirds(birds);
                setLoading(false);
            },
            () => {
                setLocationStatus("GPS verweigert - Demo");
                fetchLocalBirds(52.52, 13.40, currentMode).then(birds => {
                    setNearbyBirds(birds);
                    setLoading(false);
                });
            }
        );
    }, [isVacationMode]); // Re-create when mode changes

    useEffect(() => {
        refreshBirds();
    }, [refreshBirds]);

    return { nearbyBirds, loading, locationStatus, refreshBirds };
};