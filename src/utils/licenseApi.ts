import axios from 'axios';

const GITHUB_API_BASE_URL = 'https://api.github.com';

export const fetchLicense = async (repoOwner: string, repoName: string) => {
  try {
    const response = await axios.get(
      `${GITHUB_API_BASE_URL}/repos/${repoOwner}/${repoName}/license`
    );

    if (response.status === 200 && response.data) {
      return response.data;
    } else {
      throw new Error('Failed to fetch license data');
    }
  } catch (error) {
    //console.error('Error fetching license data:', error);
    throw error;
  }
};