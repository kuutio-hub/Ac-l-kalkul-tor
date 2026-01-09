let customMaterials = {};
let savedPrices = [];

const db = {
    init(initialCustomMaterials = {}, initialSavedPrices = []) {
        customMaterials = initialCustomMaterials;
        savedPrices = initialSavedPrices;
    },

    getCustomMaterials() {
        return customMaterials;
    },
    
    saveCustomMaterial(name, density) {
        customMaterials[name] = density;
    },
    
    deleteCustomMaterial(name) {
        delete customMaterials[name];
    },
    
    getSavedPrices() {
        return savedPrices;
    },
    
    savePrice(priceEntry) {
        savedPrices.push(priceEntry);
    },
    
    deleteSavedPrice(index) {
        if (index > -1 && index < savedPrices.length) {
            savedPrices.splice(index, 1);
        }
    },
    
    async getExchangeRates(periodInDays) {
        const cacheKey = `exchangeRates_${periodInDays}`;
        const cachedData = localStorage.getItem(cacheKey);
        const now = new Date().getTime();

        if (cachedData) {
            const { timestamp, data } = JSON.parse(cachedData);
            // Cache is valid for 24 hours
            if (now - timestamp < 24 * 60 * 60 * 1000) {
                return data;
            }
        }
        
        // Fetch new data
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - periodInDays);
        const formatDate = (date) => date.toISOString().split('T')[0];
        
        const url = periodInDays === 1 
            ? 'https://api.frankfurter.app/latest?from=EUR&to=HUF'
            : `https://api.frankfurter.app/${formatDate(startDate)}..${formatDate(endDate)}?from=EUR&to=HUF`;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');
            const apiData = await response.json();
            const rates = apiData.rates;
            
            // For 'latest' endpoint, the structure is slightly different
            if (periodInDays === 1 && apiData.date) {
                const singleDayData = { [apiData.date]: { HUF: rates.HUF } };
                localStorage.setItem(cacheKey, JSON.stringify({ timestamp: now, data: singleDayData }));
                return singleDayData;
            }

            localStorage.setItem(cacheKey, JSON.stringify({ timestamp: now, data: rates }));
            return rates;
        } catch (error) {
            console.error(`Failed to fetch exchange rates for period ${periodInDays}:`, error);
            // Return cached data if fetch fails, even if stale
            return cachedData ? JSON.parse(cachedData).data : null;
        }
    }
};

export { db };
