import axios from 'axios';

// Use your hosted backend URL here
const BASE_URL = 'https://your-backend-url.com/api/departments';

export const getAllDepartments = async () => {
    try {
        const response = await axios.get(BASE_URL);
        return response.data;
    } catch (error) {
        console.error("Error fetching departments:", error);
        throw error;
    }
};