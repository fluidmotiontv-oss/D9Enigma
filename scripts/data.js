const getOffsetForZone = (timeZone, fallback) => {
    try {
        const d = new Date();
        const formatterUTC = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' });
        const formatterTZ = new Intl.DateTimeFormat('en-GB', { timeZone: timeZone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' });
        
        const getMap = (f) => {
            const parts = f.formatToParts(d);
            const map = {};
            parts.forEach(p => {
                const val = parseInt(p.value, 10);
                if (!isNaN(val)) map[p.type] = val;
            });
            return map;
        };
        
        const utcMap = getMap(formatterUTC);
        const tzMap = getMap(formatterTZ);
        
        const utcTime = Date.UTC(utcMap.year, utcMap.month - 1, utcMap.day, utcMap.hour, utcMap.minute || 0);
        const tzTime = Date.UTC(tzMap.year, tzMap.month - 1, tzMap.day, tzMap.hour, tzMap.minute || 0);
        
        let diffHours = (tzTime - utcTime) / 3600000;
        
        // Handle potential day boundary edge cases
        if (diffHours > 14) diffHours -= 24;
        if (diffHours < -12) diffHours += 24;
        
        return diffHours;
    } catch (e) {
        return fallback;
    }
};

const nzOffset = getOffsetForZone('Pacific/Auckland', 12);
const chathamOffset = getOffsetForZone('Pacific/Chatham', 12.75);

export const countryNodes = [
    { n: 'Chatham Islands', o: chathamOffset },
    { n: 'Auckland', o: nzOffset },
    { n: 'Okiwi', o: nzOffset },
    { n: 'Wellington Harbor', o: nzOffset },
    { n: 'Wellington', o: nzOffset },
    { n: 'Gisborne', o: nzOffset },
    { n: 'Christchurch', o: nzOffset },
    { n: 'Fiji', o: getOffsetForZone('Pacific/Fiji', 12) },
    { n: 'Sydney', o: getOffsetForZone('Australia/Sydney', 10) },
    { n: 'Melbourne', o: getOffsetForZone('Australia/Melbourne', 10) },
    { n: 'Brisbane', o: getOffsetForZone('Australia/Brisbane', 10) },
    { n: 'Tokyo', o: getOffsetForZone('Asia/Tokyo', 9) },
    { n: 'Seoul', o: getOffsetForZone('Asia/Seoul', 9) },
    { n: 'Singapore', o: getOffsetForZone('Asia/Singapore', 8) },
    { n: 'Hong Kong', o: getOffsetForZone('Asia/Hong_Kong', 8) },
    { n: 'Perth', o: getOffsetForZone('Australia/Perth', 8) },
    { n: 'Bangkok', o: getOffsetForZone('Asia/Bangkok', 7) },
    { n: 'Jakarta', o: getOffsetForZone('Asia/Jakarta', 7) },
    { n: 'Mumbai', o: getOffsetForZone('Asia/Kolkata', 5.5) },
    { n: 'Dubai', o: getOffsetForZone('Asia/Dubai', 4) },
    { n: 'Moscow', o: getOffsetForZone('Europe/Moscow', 3) },
    { n: 'Nairobi', o: getOffsetForZone('Africa/Nairobi', 3) },
    { n: 'Cairo', o: getOffsetForZone('Africa/Cairo', 2) },
    { n: 'Cape Town', o: getOffsetForZone('Africa/Johannesburg', 2) },
    { n: 'Paris', o: getOffsetForZone('Europe/Paris', 1) },
    { n: 'Berlin', o: getOffsetForZone('Europe/Berlin', 1) },
    { n: 'London', o: getOffsetForZone('Europe/London', 0) },
    { n: 'Casablanca', o: getOffsetForZone('Africa/Casablanca', 0) },
    { n: 'Azores', o: getOffsetForZone('Atlantic/Azores', -1) },
    { n: 'Rio de Janeiro', o: getOffsetForZone('America/Sao_Paulo', -3) },
    { n: 'Sao Paulo', o: getOffsetForZone('America/Sao_Paulo', -3) },
    { n: 'Buenos Aires', o: getOffsetForZone('America/Argentina/Buenos_Aires', -3) },
    { n: 'Santiago', o: getOffsetForZone('America/Santiago', -4) },
    { n: 'New York', o: getOffsetForZone('America/New_York', -5) },
    { n: 'Miami', o: getOffsetForZone('America/New_York', -5) },
    { n: 'Chicago', o: getOffsetForZone('America/Chicago', -6) },
    { n: 'Mexico City', o: getOffsetForZone('America/Mexico_City', -6) },
    { n: 'Denver', o: getOffsetForZone('America/Denver', -7) },
    { n: 'Phoenix', o: getOffsetForZone('America/Phoenix', -7) },
    { n: 'Seattle', o: getOffsetForZone('America/Los_Angeles', -8) },
    { n: 'Los Angeles', o: getOffsetForZone('America/Los_Angeles', -8) },
    { n: 'Vancouver', o: getOffsetForZone('America/Vancouver', -8) },
    { n: 'Anchorage', o: getOffsetForZone('America/Anchorage', -9) },
    { n: 'Honolulu', o: getOffsetForZone('Pacific/Honolulu', -10) },
    { n: 'Tahiti', o: getOffsetForZone('Pacific/Tahiti', -10) },
    { n: 'American Samoa', o: getOffsetForZone('Pacific/Pago_Pago', -11) }
];

export const CONFIG = {
    DRAGON: {
        HOURS_PER_HALF: 13,
        MIN_PER_HOUR: 54,
        SEC_PER_HOUR: 3240,
        RELAX_WINDOW: 540,
        MIDDAY: 43200,
        DAY_END: 86400
    }
};
