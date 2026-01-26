type Position = {
	lat: number;
	lng: number;
	accuracy: number | null;
	timestamp: number;
};

// État réactif
let position = $state<Position | null>(null);
let isActive = $state(false);
let error = $state<string | null>(null);
let watchId = $state<number | null>(null);

export const gpsService = {
	get position() { return position; },
	get isActive() { return isActive; },
	get error() { return error; },
	get watchId() { return watchId; },

	async start() {
		if (!navigator.geolocation) {
			error = 'Géolocalisation non supportée';
			return;
		}

		error = null;

		// Demander la permission
		const permission = await navigator.permissions?.query({ name: 'geolocation' });
		if (permission?.state === 'denied') {
			error = 'Permission de géolocalisation refusée';
			return;
		}

		watchId = navigator.geolocation.watchPosition(
			(pos) => {
				position = {
					lat: pos.coords.latitude,
					lng: pos.coords.longitude,
					accuracy: pos.coords.accuracy,
					timestamp: Date.now()
				};
				isActive = true;
				error = null;
			},
			(err) => {
				error = `Erreur GPS: ${err.message}`;
				isActive = false;
			},
			{
				enableHighAccuracy: true,
				timeout: 10000,
				maximumAge: 5000
			}
		);
	},

	stop() {
		if (watchId !== null) {
			navigator.geolocation.clearWatch(watchId);
			watchId = null;
		}
		isActive = false;
	}
};
