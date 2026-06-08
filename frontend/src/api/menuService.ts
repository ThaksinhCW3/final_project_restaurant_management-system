import axios from 'axios';
import type { MenuItem } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export async function fetchMenus(): Promise<MenuItem[]> {
  const response = await axios.get<MenuItem[]>(`${API_BASE}/api/menus`);
  return response.data;
}
