import axios from 'axios';
const api = axios.create({ baseURL: 'http://localhost:4000/api' });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = 'Bearer ' + token;
  return cfg;
});

// Room API functions
export const roomAPI = {
  createRoom: (partnerUserId) => api.post('/rooms/create', { partnerUserId }),
  getRooms: () => api.get('/rooms'),
  getRoom: (roomId) => api.get(`/rooms/${roomId}`)
};

export default api;
