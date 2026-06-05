
export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
}

export const authService = {
  login: async (username: string, password: string): Promise<AuthResponse> => {
    // Simulasi delay jaringan
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Kredensial hardcoded (bisa dipindah ke env atau backend nantinya)
    if (username === 'adminGPIB' && password === 'admin') {
      localStorage.setItem('isGPBAdmin', 'true');
      const token = 'session_' + Math.random().toString(36).substr(2);
      localStorage.setItem('adminToken', token);
      return { 
        success: true, 
        token: token 
      };
    }
    
    return { 
      success: false, 
      message: 'Username atau Password salah. Silakan coba lagi.' 
    };
  },
  
  logout: () => {
    localStorage.removeItem('isGPBAdmin');
    localStorage.removeItem('adminToken');
  },
  
  isAuthenticated: (): boolean => {
    return localStorage.getItem('isGPBAdmin') === 'true';
  }
};
