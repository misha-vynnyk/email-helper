/**
 * Workspace Manager
 * 
 * Cross-platform secure file system access management.
 * Manages allowed workspace directories with platform-specific security.
 */

import * as fs from "fs/promises";
import * as path from "path";
import { existsSync, statSync } from "fs";
import * as os from "os";

/**
 * Security Policy Levels
 */
export type SecurityLevel = "strict" | "balanced" | "permissive";

/**
 * Access Zones (security levels for workspaces)
 */
export enum AccessZone {
  PROJECT_ONLY = "project",      // Project folder only (highest security)
  USER_WORKSPACES = "workspaces", // User-approved folders
  RESTRICTED = "restricted"       // Needs additional checks
}

/**
 * Workspace entry
 */
export interface Workspace {
  id: string;
  path: string;
  zone: AccessZone;              // Security zone
  addedAt: number;
  accessCount: number;
  lastAccess: number;
  label?: string;
  readonly?: boolean;             // Read-only workspace
}

/**
 * Security Configuration
 */
interface SecurityConfig {
  maxWorkspaces: number;
  maxFileSize: number;
  allowedExtensions: string[];
  requireConfirmation: boolean;
}

/**
 * Platform-specific blocked paths
 */
const PLATFORM_BLOCKED_PATHS: Record<NodeJS.Platform, string[]> = {
  win32: [
    "C:\\Windows",
    "C:\\Program Files",
    "C:\\Program Files (x86)",
    "C:\\ProgramData",
    "C:\\System Volume Information",
  ],
  darwin: [
    "/System",
    "/Library",
    "/Applications",
    "/private/etc",
    "/private/var",
    "/usr",
    "/bin",
    "/sbin",
    "/cores",
    "/dev",
  ],
  linux: [
    "/etc",
    "/usr",
    "/bin",
    "/sbin",
    "/boot",
    "/root",
    "/sys",
    "/proc",
    "/dev",
  ],
  // Other platforms use linux defaults
  aix: [],
  android: [],
  freebsd: [],
  haiku: [],
  openbsd: [],
  sunos: [],
  cygwin: [],
  netbsd: [],
};

/**
 * Security Policy presets
 */
const SECURITY_POLICIES: Record<SecurityLevel, SecurityConfig> = {
  strict: {
    maxWorkspaces: 1,
    maxFileSize: 1 * 1024 * 1024, // 1MB
    allowedExtensions: [".html", ".htm", ".ts"],
    requireConfirmation: true,
  },
  balanced: {
    maxWorkspaces: 10,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedExtensions: [".html", ".htm", ".ts", ".tsx", ".js", ".jsx"],
    requireConfirmation: false,
  },
  permissive: {
    maxWorkspaces: 50,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedExtensions: [".html", ".htm", ".ts", ".tsx", ".js", ".jsx", ".json"],
    requireConfirmation: false,
  },
};

/**
 * Workspace Manager Class
 */
export class WorkspaceManager {
  private workspaces: Map<string, Workspace> = new Map();
  private blockedPaths: string[] = [];
  private config: SecurityConfig;
  private configFilePath: string;
  private projectRoot: string;

  constructor(
    securityLevel: SecurityLevel = "balanced",
    projectRoot?: string
  ) {
    this.config = { ...SECURITY_POLICIES[securityLevel] };
    this.projectRoot = projectRoot || path.resolve(__dirname, "../..");
    this.configFilePath = path.join(this.projectRoot, "server/data/.workspaces.json");
    
    // Load platform-specific blocked paths
    this.loadBlockedPaths();
    
    // Load persisted workspaces
    this.loadWorkspaces();
    
    // Always add project root as default workspace
    this.addProjectWorkspace();
  }

  /**
   * Load platform-specific blocked paths
   */
  private loadBlockedPaths(): void {
    const platform = process.platform;
    this.blockedPaths = PLATFORM_BLOCKED_PATHS[platform] || PLATFORM_BLOCKED_PATHS.linux;

    // Add user-specific paths to block list
    const homeDir = os.homedir();
    
    if (platform === "darwin") {
      this.blockedPaths.push(path.join(homeDir, "Library"));
      this.blockedPaths.push(path.join(homeDir, ".Trash"));
    } else if (platform === "win32") {
      if (process.env.APPDATA) {
        this.blockedPaths.push(process.env.APPDATA);
      }
      if (process.env.LOCALAPPDATA) {
        this.blockedPaths.push(process.env.LOCALAPPDATA);
      }
    }

    console.log(`🔒 Loaded ${this.blockedPaths.length} blocked paths for ${platform}`);
  }

  /**
   * Add project root as default workspace
   */
  private addProjectWorkspace(): void {
    const id = "project-root";
    if (!this.workspaces.has(id)) {
      this.workspaces.set(id, {
        id,
        path: this.projectRoot,
        zone: AccessZone.PROJECT_ONLY,
        addedAt: Date.now(),
        accessCount: 0,
        lastAccess: Date.now(),
        label: "Project Root",
        readonly: false,
      });
    }
  }

  /**
   * Load persisted workspaces from disk
   */
  private async loadWorkspaces(): Promise<void> {
    try {
      if (existsSync(this.configFilePath)) {
        const data = await fs.readFile(this.configFilePath, "utf8");
        const parsed = JSON.parse(data);
        
        if (parsed.workspaces && Array.isArray(parsed.workspaces)) {
          parsed.workspaces.forEach((ws: Workspace) => {
            // Verify workspace still exists
            if (existsSync(ws.path)) {
              this.workspaces.set(ws.id, ws);
            }
          });
          console.log(`📂 Loaded ${this.workspaces.size} workspaces`);
        }
      }
    } catch (error) {
      console.warn("Failed to load workspaces:", error);
    }
  }

  /**
   * Save workspaces to disk
   */
  private async saveWorkspaces(): Promise<void> {
    try {
      const configDir = path.dirname(this.configFilePath);
      if (!existsSync(configDir)) {
        await fs.mkdir(configDir, { recursive: true });
      }

      const data = {
        version: 1,
        workspaces: Array.from(this.workspaces.values()),
        updatedAt: Date.now(),
      };

      await fs.writeFile(this.configFilePath, JSON.stringify(data, null, 2), "utf8");
    } catch (error) {
      console.error("Failed to save workspaces:", error);
    }
  }

  /**
   * Normalize path (cross-platform)
   */
  private normalizePath(filePath: string): string {
    // Remove null bytes and control characters
    filePath = filePath.replace(/\0/g, "");
    filePath = filePath.replace(/[\x00-\x1F\x7F]/g, "");

    // Handle home directory expansion
    if (filePath.startsWith("~")) {
      filePath = path.join(os.homedir(), filePath.slice(1));
    }

    // Resolve to absolute normalized path
    return path.normalize(path.resolve(filePath));
  }

  /**
   * Check if path is blocked (system directory)
   */
  private isBlocked(filePath: string): boolean {
    const normalized = this.normalizePath(filePath);
    
    return this.blockedPaths.some((blocked) => {
      const normalizedBlocked = this.normalizePath(blocked);
      return normalized.startsWith(normalizedBlocked);
    });
  }

  /**
   * Check if path contains traversal attempts
   */
  private hasTraversal(filePath: string): boolean {
    // Check for ../ or ..\\ patterns
    return /\.\.[/\\]/.test(filePath);
  }

  /**
   * Validate directory path
   */
  private async validateDirectory(dirPath: string): Promise<{ valid: boolean; reason?: string }> {
    try {
      const normalized = this.normalizePath(dirPath);

      // Check for traversal
      if (this.hasTraversal(dirPath)) {
        return { valid: false, reason: "Path traversal detected" };
      }

      // Check if blocked
      if (this.isBlocked(normalized)) {
        return { valid: false, reason: "System directory is blocked for security" };
      }

      // Check if exists
      if (!existsSync(normalized)) {
        return { valid: false, reason: "Directory does not exist" };
      }

      // Check if it's actually a directory
      const stats = statSync(normalized);
      if (!stats.isDirectory()) {
        return { valid: false, reason: "Path is not a directory" };
      }

      return { valid: true };
    } catch (error) {
      return { 
        valid: false, 
        reason: `Validation error: ${error instanceof Error ? error.message : "Unknown"}` 
      };
    }
  }

  /**
   * Determine access zone for a path
   */
  private determineAccessZone(dirPath: string): AccessZone {
    const normalized = this.normalizePath(dirPath);

    // Project folder = highest security
    if (normalized === this.projectRoot || normalized.startsWith(this.projectRoot + path.sep)) {
      return AccessZone.PROJECT_ONLY;
    }

    // Check if in common safe locations
    const homeDir = os.homedir();
    const safePaths = [
      path.join(homeDir, "Documents"),
      path.join(homeDir, "Desktop"),
      path.join(homeDir, "Projects"),
      path.join(homeDir, "Workspace"),
    ];

    const isSafe = safePaths.some((safe) => normalized.startsWith(safe));
    
    if (isSafe) {
      return AccessZone.USER_WORKSPACES;
    }

    // Everything else needs extra scrutiny
    return AccessZone.RESTRICTED;
  }

  /**
   * Request access to a new workspace
   */
  async requestWorkspaceAccess(
    dirPath: string, 
    label?: string,
    readonly: boolean = false
  ): Promise<{ success: boolean; workspaceId?: string; error?: string; zone?: AccessZone }> {
    try {
      // Check workspace limit
      if (this.workspaces.size >= this.config.maxWorkspaces) {
        return { 
          success: false, 
          error: `Maximum ${this.config.maxWorkspaces} workspaces allowed` 
        };
      }

      // Validate directory
      const validation = await this.validateDirectory(dirPath);
      if (!validation.valid) {
        return { success: false, error: validation.reason };
      }

      const normalized = this.normalizePath(dirPath);
      
      // Check if already added
      const existing = Array.from(this.workspaces.values()).find(
        (ws) => ws.path === normalized
      );
      if (existing) {
        return { success: true, workspaceId: existing.id, zone: existing.zone };
      }

      // Determine security zone
      const zone = this.determineAccessZone(normalized);

      // For RESTRICTED zone, add extra warning in logs
      if (zone === AccessZone.RESTRICTED) {
        console.warn(`⚠️  Adding RESTRICTED zone workspace: ${normalized}`);
      }

      // Create new workspace
      const id = `ws-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const workspace: Workspace = {
        id,
        path: normalized,
        zone,
        addedAt: Date.now(),
        accessCount: 0,
        lastAccess: Date.now(),
        label: label || path.basename(normalized),
        readonly,
      };

      this.workspaces.set(id, workspace);
      await this.saveWorkspaces();

      console.log(`✅ Added workspace [${zone}]: ${normalized}`);
      return { success: true, workspaceId: id, zone };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  }

  /**
   * Remove workspace
   */
  async removeWorkspace(workspaceId: string): Promise<boolean> {
    // Don't allow removing project root
    if (workspaceId === "project-root") {
      return false;
    }

    const removed = this.workspaces.delete(workspaceId);
    if (removed) {
      await this.saveWorkspaces();
      console.log(`🗑️  Removed workspace: ${workspaceId}`);
    }
    return removed;
  }

  /**
   * Check if file path can be accessed
   */
  canAccess(filePath: string, requireWrite: boolean = false): { 
    allowed: boolean; 
    reason?: string; 
    workspace?: string;
    zone?: AccessZone;
  } {
    try {
      const normalized = this.normalizePath(filePath);

      // Check for traversal
      if (this.hasTraversal(filePath)) {
        return { allowed: false, reason: "Path traversal detected" };
      }

      // Blocked paths have priority
      if (this.isBlocked(normalized)) {
        return { allowed: false, reason: "System directory blocked" };
      }

      // Check if within any workspace
      for (const workspace of this.workspaces.values()) {
        if (normalized.startsWith(workspace.path)) {
          // Check readonly restriction
          if (requireWrite && workspace.readonly) {
            return { 
              allowed: false, 
              reason: "Workspace is read-only",
              workspace: workspace.id,
              zone: workspace.zone
            };
          }

          return { 
            allowed: true, 
            workspace: workspace.id,
            zone: workspace.zone
          };
        }
      }

      return { allowed: false, reason: "Path not in any allowed workspace" };
    } catch (error) {
      return { 
        allowed: false, 
        reason: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  }

  /**
   * Track file access
   */
  async trackAccess(filePath: string): Promise<void> {
    const access = this.canAccess(filePath);
    if (access.allowed && access.workspace) {
      const workspace = this.workspaces.get(access.workspace);
      if (workspace) {
        workspace.accessCount++;
        workspace.lastAccess = Date.now();
        await this.saveWorkspaces();
      }
    }
  }

  /**
   * Get all workspaces
   */
  getWorkspaces(): Workspace[] {
    return Array.from(this.workspaces.values());
  }

  /**
   * Get workspaces by zone
   */
  getWorkspacesByZone(zone: AccessZone): Workspace[] {
    return Array.from(this.workspaces.values()).filter((ws) => ws.zone === zone);
  }

  /**
   * Set workspace readonly status
   */
  async setWorkspaceReadonly(workspaceId: string, readonly: boolean): Promise<boolean> {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) return false;

    workspace.readonly = readonly;
    await this.saveWorkspaces();
    return true;
  }

  /**
   * Get workspace by ID
   */
  getWorkspace(id: string): Workspace | undefined {
    return this.workspaces.get(id);
  }

  /**
   * Get blocked paths
   */
  getBlockedPaths(): string[] {
    return [...this.blockedPaths];
  }

  /**
   * Get security config
   */
  getConfig(): SecurityConfig {
    return { ...this.config };
  }

  /**
   * Validate file extension
   */
  isAllowedExtension(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return this.config.allowedExtensions.includes(ext);
  }

  /**
   * Check file size
   */
  async validateFileSize(filePath: string): Promise<{ valid: boolean; size?: number; reason?: string }> {
    try {
      if (!existsSync(filePath)) {
        return { valid: false, reason: "File does not exist" };
      }

      const stats = statSync(filePath);
      if (stats.size > this.config.maxFileSize) {
        const maxMB = (this.config.maxFileSize / 1024 / 1024).toFixed(1);
        return { 
          valid: false, 
          size: stats.size,
          reason: `File too large (max ${maxMB}MB)` 
        };
      }

      return { valid: true, size: stats.size };
    } catch (error) {
      return { 
        valid: false, 
        reason: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  }
}

/**
 * Singleton instance
 */
let workspaceManagerInstance: WorkspaceManager | null = null;

/**
 * Get WorkspaceManager singleton
 */
export function getWorkspaceManager(): WorkspaceManager {
  if (!workspaceManagerInstance) {
    workspaceManagerInstance = new WorkspaceManager("balanced");
  }
  return workspaceManagerInstance;
}

