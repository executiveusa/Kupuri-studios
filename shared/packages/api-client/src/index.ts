import axios, { AxiosInstance, AxiosError } from 'axios';
import type { ApiResponse, Comic, Character, User } from '@kupuri/types';

export class KupuriApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor(baseURL: string = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000') {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests
    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    // Handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          this.clearToken();
          // Emit logout event
          window.dispatchEvent(new Event('logout'));
        }
        throw error;
      }
    );
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  loadToken() {
    const token = localStorage.getItem('auth_token');
    if (token) {
      this.token = token;
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.client.post<ApiResponse<{ token: string; user: User }>>(
      '/api/auth/login',
      { email, password }
    );
    if (response.data.data?.token) {
      this.setToken(response.data.data.token);
    }
    return response.data.data;
  }

  async register(email: string, password: string, name: string) {
    const response = await this.client.post<ApiResponse<{ token: string; user: User }>>(
      '/api/auth/register',
      { email, password, name }
    );
    if (response.data.data?.token) {
      this.setToken(response.data.data.token);
    }
    return response.data.data;
  }

  // User endpoints
  async getProfile() {
    const response = await this.client.get<ApiResponse<User>>('/api/user/profile');
    return response.data.data;
  }

  // Comic endpoints
  async getComics(page: number = 1, limit: number = 10) {
    const response = await this.client.get('/api/comics', { params: { page, limit } });
    return response.data;
  }

  async getComic(id: string) {
    const response = await this.client.get<ApiResponse<Comic>>(`/api/comics/${id}`);
    return response.data.data;
  }

  async createComic(data: Partial<Comic>) {
    const response = await this.client.post<ApiResponse<Comic>>('/api/comics', data);
    return response.data.data;
  }

  async updateComic(id: string, data: Partial<Comic>) {
    const response = await this.client.put<ApiResponse<Comic>>(`/api/comics/${id}`, data);
    return response.data.data;
  }

  async deleteComic(id: string) {
    await this.client.delete(`/api/comics/${id}`);
  }

  // Character endpoints
  async getCharacters(page: number = 1, limit: number = 10) {
    const response = await this.client.get('/api/characters', { params: { page, limit } });
    return response.data;
  }

  async getCharacter(id: string) {
    const response = await this.client.get<ApiResponse<Character>>(`/api/characters/${id}`);
    return response.data.data;
  }

  async createCharacter(data: Partial<Character>) {
    const response = await this.client.post<ApiResponse<Character>>('/api/characters', data);
    return response.data.data;
  }

  // Token endpoints
  async getTokenBalance() {
    const response = await this.client.get('/api/tokens/balance');
    return response.data;
  }

  async purchaseTokens(packageId: string) {
    const response = await this.client.post('/api/tokens/purchase', { packageId });
    return response.data;
  }

  // Health check
  async healthCheck() {
    const response = await this.client.get('/api/health');
    return response.data;
  }
}

export default new KupuriApiClient();
