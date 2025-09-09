/**
 * Guest session service for managing anonymous user sessions and builds
 * @module GuestService
 */
import { v4 as uuidv4 } from 'uuid';
import { 
  createOrGetSession, 
  validateSession, 
  saveBuild, 
  getBuildsBySession, 
  getLatestBuild, 
  updateBuild 
} from '../api/guest/guest';
import type { 
  GuestSessionResponse, 
  GuestBuildResponse, 
  GuestBuildRequest 
} from '../api/model';

export interface GuestBuild {
  id: string;
  name: string;
  components: any[];
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface GuestSession {
  sessionId: string;
  isValid: boolean;
  expiresAt: Date;
  lastAccessed: Date;
}

class GuestService {
  private static instance: GuestService;
  private sessionId: string | null = null;
  private session: GuestSession | null = null;

  private constructor() {
    this.initializeSession();
  }

  static getInstance(): GuestService {
    if (!GuestService.instance) {
      GuestService.instance = new GuestService();
    }
    return GuestService.instance;
  }

  /**
   * Initialize guest session from localStorage or create new one
   */
  private initializeSession() {
    try {
      const storedSessionId = localStorage.getItem('rigarchitect_guest_session');
      if (storedSessionId) {
        this.sessionId = storedSessionId;
        // Validate session on next API call
      } else {
        this.createNewSession();
      }
    } catch (error) {
      console.error('Error initializing guest session:', error);
      this.createNewSession();
    }
  }

  /**
   * Create a new guest session ID
   */
  private createNewSession() {
    this.sessionId = `guest_${uuidv4()}`;
    localStorage.setItem('rigarchitect_guest_session', this.sessionId);
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    if (!this.sessionId) {
      this.createNewSession();
    }
    return this.sessionId!;
  }

  /**
   * Create or validate guest session with backend
   */
  async ensureValidSession(): Promise<GuestSession> {
    const sessionId = this.getSessionId();

    try {
      // Try to create or get existing session
      const response = await createOrGetSession({
        sessionId
      });

      this.session = {
        sessionId: response.data.sessionId,
        isValid: !response.data.isExpired,
        expiresAt: new Date(response.data.expiresAt),
        lastAccessed: new Date(response.data.lastAccessed)
      };

      return this.session;
    } catch (error) {
      console.error('Error ensuring valid session:', error);
      // Create new session if current one is invalid
      this.createNewSession();
      return this.ensureValidSession();
    }
  }

  /**
   * Validate current session
   */
  async validateCurrentSession(): Promise<boolean> {
    if (!this.sessionId) {
      return false;
    }

    try {
      const response = await validateSession(this.sessionId);
      return !response.data.isExpired;
    } catch (error) {
      console.error('Error validating session:', error);
      return false;
    }
  }

  /**
   * Save a build configuration for the guest session
   * @param buildData The build configuration data to save
   * @returns Promise resolving to the saved build response
   */
  async saveBuild(buildData: any): Promise<GuestBuildResponse> {
    await this.ensureValidSession();
    
    const buildRequest: GuestBuildRequest = {
      sessionId: this.getSessionId(),
      buildData: JSON.stringify(buildData)
    };

    const response = await saveBuild(buildRequest);

    return response.data;
  }

  /**
   * Update an existing build
   * @param buildId The ID of the build to update
   * @param buildData The updated build configuration data
   * @returns Promise resolving to the updated build response
   */
  async updateBuild(buildId: number, buildData: any): Promise<GuestBuildResponse> {
    await this.ensureValidSession();
    
    const buildRequest: GuestBuildRequest = {
      sessionId: this.getSessionId(),
      buildData: JSON.stringify(buildData)
    };

    const response = await updateBuild(buildId, buildRequest);

    return response.data;
  }

  /**
   * Get all builds for current session
   * @returns Promise resolving to array of guest build responses
   */
  async getBuilds(): Promise<GuestBuildResponse[]> {
    await this.ensureValidSession();
    
    const response = await getBuildsBySession(this.getSessionId());
    return response.data;
  }

  /**
   * Get latest build for current session
   * @returns Promise resolving to latest build response or null if none exists
   */
  async getLatestBuild(): Promise<GuestBuildResponse | null> {
    try {
      await this.ensureValidSession();
      
      const response = await getLatestBuild(this.getSessionId());
      return response.data;
    } catch (error) {
      console.error('Error getting latest build:', error);
      return null;
    }
  }

  /**
   * Convert guest builds to proper format for display
   * @returns Promise resolving to array of formatted guest builds
   */
  async getFormattedBuilds(): Promise<GuestBuild[]> {
    const builds = await this.getBuilds();
    
    return builds.map(build => ({
      id: build.id!.toString(),
      name: this.extractBuildName(build.buildData),
      components: this.parseBuildData(build.buildData),
      totalPrice: this.calculateTotalPrice(build.buildData),
      createdAt: new Date(build.createdAt),
      updatedAt: new Date(build.updatedAt)
    }));
  }

  /**
   * Parse build data JSON
   * @param buildDataJson JSON string containing build data
   * @returns Array of component objects or empty array if parsing fails
   */
  private parseBuildData(buildDataJson: string): any[] {
    try {
      const buildData = JSON.parse(buildDataJson);
      return buildData.components || [];
    } catch (error) {
      console.error('Error parsing build data:', error);
      return [];
    }
  }

  /**
   * Extract build name from build data
   * @param buildDataJson JSON string containing build data
   * @returns Build name or 'Untitled Build' if not found
   */
  private extractBuildName(buildDataJson: string): string {
    try {
      const buildData = JSON.parse(buildDataJson);
      return buildData.name || 'Untitled Build';
    } catch (error) {
      return 'Untitled Build';
    }
  }

  /**
   * Calculate total price from build data
   * @param buildDataJson JSON string containing build data
   * @returns Total price of all components or 0 if calculation fails
   */
  private calculateTotalPrice(buildDataJson: string): number {
    try {
      const buildData = JSON.parse(buildDataJson);
      const components = buildData.components || [];
      return components.reduce((total: number, component: any) => {
        return total + (component.price * (component.quantity || 1));
      }, 0);
    } catch (error) {
      return 0;
    }
  }

  /**
   * Clear guest session data
   */
  clearSession() {
    this.sessionId = null;
    this.session = null;
    localStorage.removeItem('rigarchitect_guest_session');
  }

  /**
   * Get session for migration to user account
   */
  getSessionForMigration(): string | null {
    return this.sessionId;
  }
}

// Export singleton instance
export const guestService = GuestService.getInstance();

// Export utility hooks
export const useGuestSession = () => {
  const ensureSession = () => guestService.ensureValidSession();
  const getSessionId = () => guestService.getSessionId();
  const validateSession = () => guestService.validateCurrentSession();
  const clearSession = () => guestService.clearSession();

  return {
    ensureSession,
    getSessionId,
    validateSession,
    clearSession
  };
};

export const useGuestBuilds = () => {
  const saveGuestBuild = (buildData: any) => guestService.saveBuild(buildData);
  const updateGuestBuild = (buildId: number, buildData: any) => guestService.updateBuild(buildId, buildData);
  const getGuestBuilds = () => guestService.getFormattedBuilds();
  const getLatestGuestBuild = () => guestService.getLatestBuild();

  return {
    saveGuestBuild,
    updateGuestBuild,
    getGuestBuilds,
    getLatestGuestBuild
  };
};