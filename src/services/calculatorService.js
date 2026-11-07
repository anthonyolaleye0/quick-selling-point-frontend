// frontend/src/services/calculatorService.js
export const calculatorService = {
    logCalculation: async (expression, result, userId) => {
        try {
            await fetch('http://localhost:5000/api/calculator/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ expression, result, userId })
            });
        } catch (err) {
            console.error('Failed to log calculator event to backend', err);
        }
    }
};