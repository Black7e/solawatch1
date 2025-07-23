// X (Twitter) OAuth Configuration
const X_CLIENT_ID = import.meta.env.VITE_X_CLIENT_ID;
const X_REDIRECT_URI = import.meta.env.VITE_X_REDIRECT_URI || `${window.location.origin}/auth/callback`;
const X_SCOPE = 'tweet.read users.read offline.access';

export interface XUser {
  id: string;
  username: string;
  name: string;
  profile_image_url?: string;
  verified?: boolean;
  followers_count?: number;
  following_count?: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: XUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
}

class AuthService {
  private state: AuthState = {
    isAuthenticated: false,
    user: null,
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
  };

  private listeners: ((state: AuthState) => void)[] = [];

  constructor() {
    this.loadFromStorage();
  }

  // Initialize X OAuth flow
  async signInWithX(): Promise<void> {
    if (!X_CLIENT_ID) {
      throw new Error('X Client ID is not configured. Please add VITE_X_CLIENT_ID to your .env file');
    }

    // Generate PKCE challenge
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);
    
    // Store code verifier for later use
    sessionStorage.setItem('x_code_verifier', codeVerifier);
    
    // Build authorization URL
    const authUrl = new URL('https://twitter.com/i/oauth2/authorize');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', X_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', X_REDIRECT_URI);
    authUrl.searchParams.set('scope', X_SCOPE);
    authUrl.searchParams.set('state', this.generateState());
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');

    // Redirect to X authorization
    window.location.href = authUrl.toString();
  }

  // Handle OAuth callback
  async handleCallback(): Promise<XUser | null> {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');

    if (error) {
      throw new Error(`OAuth error: ${error}`);
    }

    if (!code) {
      throw new Error('No authorization code received');
    }

    const codeVerifier = sessionStorage.getItem('x_code_verifier');
    if (!codeVerifier) {
      throw new Error('No code verifier found');
    }

    try {
      // Exchange code for tokens
      const tokenResponse = await this.exchangeCodeForTokens(code, codeVerifier);
      
      // Get user information
      const user = await this.getXUser(tokenResponse.access_token);
      
      // Update state
      this.state = {
        isAuthenticated: true,
        user,
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresAt: Date.now() + (tokenResponse.expires_in * 1000),
      };

      this.saveToStorage();
      this.notifyListeners();
      
      // Clean up
      sessionStorage.removeItem('x_code_verifier');
      
      return user;
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      throw error;
    }
  }

  // Exchange authorization code for tokens
  private async exchangeCodeForTokens(code: string, codeVerifier: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }> {
    const response = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${X_CLIENT_ID}:`)}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: X_REDIRECT_URI,
        code_verifier: codeVerifier,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token exchange failed: ${error}`);
    }

    return response.json();
  }

  // Get X user information
  private async getXUser(accessToken: string): Promise<XUser> {
    const response = await fetch('https://api.twitter.com/2/users/me?user.fields=id,username,name,profile_image_url,verified,public_metrics', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user information');
    }

    const data = await response.json();
    const user = data.data;

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      profile_image_url: user.profile_image_url,
      verified: user.verified,
      followers_count: user.public_metrics?.followers_count,
      following_count: user.public_metrics?.following_count,
    };
  }

  // Sign out
  signOut(): void {
    this.state = {
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
    };
    
    this.saveToStorage();
    this.notifyListeners();
    
    // Clear session storage
    sessionStorage.removeItem('x_code_verifier');
  }

  // Get current auth state
  getAuthState(): AuthState {
    return { ...this.state };
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.state.isAuthenticated && this.state.accessToken !== null;
  }

  // Get current user
  getCurrentUser(): XUser | null {
    return this.state.user;
  }

  // Get access token
  getAccessToken(): string | null {
    return this.state.accessToken;
  }

  // Subscribe to auth state changes
  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Notify all listeners
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.getAuthState()));
  }

  // Generate PKCE code verifier
  private generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return this.base64URLEncode(array);
  }

  // Generate PKCE code challenge
  private async generateCodeChallenge(codeVerifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return this.base64URLEncode(new Uint8Array(digest));
  }

  // Base64URL encoding
  private base64URLEncode(buffer: Uint8Array): string {
    return btoa(String.fromCharCode(...buffer))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  // Generate random state
  private generateState(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Save auth state to localStorage
  private saveToStorage(): void {
    try {
      localStorage.setItem('x_auth_state', JSON.stringify(this.state));
    } catch (error) {
      console.error('Failed to save auth state to storage:', error);
    }
  }

  // Load auth state from localStorage
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('x_auth_state');
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // Check if token is still valid
        if (parsed.expiresAt && Date.now() < parsed.expiresAt) {
          this.state = parsed;
        } else {
          // Token expired, clear storage
          localStorage.removeItem('x_auth_state');
        }
      }
    } catch (error) {
      console.error('Failed to load auth state from storage:', error);
      localStorage.removeItem('x_auth_state');
    }
  }

  // Refresh access token
  async refreshAccessToken(): Promise<string | null> {
    if (!this.state.refreshToken) {
      return null;
    }

    try {
      const response = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${X_CLIENT_ID}:`)}`,
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.state.refreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      
      this.state.accessToken = data.access_token;
      this.state.refreshToken = data.refresh_token;
      this.state.expiresAt = Date.now() + (data.expires_in * 1000);

      this.saveToStorage();
      this.notifyListeners();

      return data.access_token;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      this.signOut();
      return null;
    }
  }
}

// Create singleton instance
export const authService = new AuthService();
export default authService; 