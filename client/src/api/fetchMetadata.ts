const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_KEY = import.meta.env.VITE_API_KEY;

export async function fetchStationMetadata(staCode: string) {
  try {
    const response = await fetch(`${API_BASE_URL}api/metadata/pg-combined/${staCode}`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,  // if required by the backend
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}
