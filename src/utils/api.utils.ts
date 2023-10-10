import axios from 'axios';
import { newToken } from '../index';

export const getRequest = async (endpoint: string, params?: any) => {
  //console.log(newToken);
  const url = `https://api.github.com${endpoint}`;
  const token = newToken;
  if (!token) {
    throw new Error('No bearer token found');
  }
  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params: params
    });
    return response.data;
  } catch (error) {
    //console.error('Error making GET request:', error);
    throw error;
  }
};
