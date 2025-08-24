const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'timer-data.json');

// Создаем файл с данными, если его нет
function ensureDataFile() {
    if (!fs.existsSync(dataFile)) {
        const defaultData = {
            startTime: '2025-08-24T00:00:00.000Z',
            lastUpdated: new Date().toISOString()
        };
        fs.writeFileSync(dataFile, JSON.stringify(defaultData, null, 2));
        return defaultData;
    }
    
    const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    
    // Если на сервере нет даты или она отличается от глобальной, устанавливаем глобальную
    if (!data.startTime || data.startTime !== '2025-08-24T00:00:00.000Z') {
        data.startTime = '2025-08-24T00:00:00.000Z';
        data.lastUpdated = new Date().toISOString();
        fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
    }
    
    return data;
}

exports.handler = async function(event, context) {
    try {
        // Разрешаем CORS
        const headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
        };

        // Обрабатываем preflight запрос
        if (event.httpMethod === 'OPTIONS') {
            return {
                statusCode: 200,
                headers,
                body: ''
            };
        }

        if (event.httpMethod === 'GET') {
            const data = ensureDataFile();
            
            return {
                statusCode: 200,
                headers: {
                    ...headers,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            };
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
}; 