import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export const getRequest = async (endpoint: string, params?: any) => {
    const url = `https://api.github.com${endpoint}`;
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
        throw new Error('No bearer token found');
    }
    try {
        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            params: params,
        });
        return response.data;
    } catch (error) {
        console.error('Error making GET request:', error);
        throw error;
    }
};
