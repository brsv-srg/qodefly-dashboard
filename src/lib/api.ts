const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.qodefly.io";

export interface User {
  id: number;
  email: string;
  is_beta: boolean;
  created_at?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Project {
  id: number;
  name: string;
  slug: string;
  description: string;
  html_code?: string;
  status: string;
  version: number;
  design_preferences?: Record<string, unknown>;
  context_md?: string;
  decisions?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  actions?: Record<string, unknown> | null;
  created_at: string;
}

export interface ChatResponse {
  message: ChatMessage;
  project_updates: {
    html_code?: string;
    version?: number;
    design_preferences?: Record<string, unknown>;
    decisions?: Record<string, unknown>;
  };
}

export interface Resource {
  id: number;
  resource_type: string;
  name: string;
  description: string;
  content?: string;
  section?: string;
  mime_type?: string;
  file_size?: number;
  url?: string;
  created_at?: string;
}

export interface ContentBlock {
  id?: number;
  section: string;
  field: string;
  content: string;
  sort_order?: number;
}

class ApiClient {
  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("qodefly_token");
  }

  private setToken(token: string) {
    localStorage.setItem("qodefly_token", token);
  }

  clearToken() {
    localStorage.removeItem("qodefly_token");
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

    if (res.status === 401) {
      this.clearToken();
      if (typeof window !== "undefined") {
        window.location.href = "/app/login";
      }
      throw new Error("Unauthorized");
    }

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.detail || "Request failed");
    }

    return data as T;
  }

  // Auth
  async register(email: string, password: string): Promise<AuthResponse> {
    const data = await this.request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.access_token);
    return data;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const data = await this.request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.access_token);
    return data;
  }

  async getMe(): Promise<User> {
    return this.request<User>("/auth/me");
  }

  async submitWaitlist(email: string) {
    return this.request("/waitlist", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  // Projects
  async createProject(
    name?: string,
    designPreferences?: Record<string, unknown>
  ): Promise<Project> {
    return this.request<Project>("/projects", {
      method: "POST",
      body: JSON.stringify({
        name: name || "Untitled Project",
        design_preferences: designPreferences || null,
      }),
    });
  }

  async listProjects(): Promise<{ total: number; projects: Project[] }> {
    return this.request("/projects");
  }

  async getProject(id: number): Promise<Project> {
    return this.request<Project>(`/projects/${id}`);
  }

  async updateProject(
    id: number,
    body: {
      prompt?: string;
      name?: string;
      description?: string;
      design_preferences?: Record<string, unknown>;
      context_md?: string;
      html_code?: string;
    }
  ): Promise<{ id: number; version: number; html: string }> {
    return this.request(`/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  async deleteProject(id: number): Promise<void> {
    await this.request(`/projects/${id}`, { method: "DELETE" });
  }

  // Chat Messages
  async getMessages(projectId: number): Promise<{ messages: ChatMessage[] }> {
    return this.request(`/projects/${projectId}/messages`);
  }

  async sendMessage(projectId: number, content: string): Promise<ChatResponse> {
    return this.request(`/projects/${projectId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  }

  // Resources
  async listResources(projectId: number): Promise<{ resources: Resource[] }> {
    return this.request(`/projects/${projectId}/resources`);
  }

  async addTextResource(
    projectId: number,
    name: string,
    content: string,
    description?: string
  ): Promise<Resource> {
    return this.request(`/projects/${projectId}/resources`, {
      method: "POST",
      body: JSON.stringify({
        resource_type: "text",
        name,
        content,
        description: description || "",
      }),
    });
  }

  async uploadFileResource(
    projectId: number,
    file: File,
    resourceType: string = "image",
    description: string = ""
  ): Promise<Resource> {
    const token = this.getToken();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", file.name);
    formData.append("resource_type", resourceType);
    formData.append("description", description);

    const res = await fetch(`${API_BASE}/projects/${projectId}/resources`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (res.status === 401) {
      this.clearToken();
      if (typeof window !== "undefined") {
        window.location.href = "/app/login";
      }
      throw new Error("Unauthorized");
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Upload failed");
    return data as Resource;
  }

  async patchResource(
    projectId: number,
    resourceId: number,
    updates: { section?: string; description?: string }
  ): Promise<void> {
    await this.request(`/projects/${projectId}/resources/${resourceId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  }

  async deleteResource(projectId: number, resourceId: number): Promise<void> {
    await this.request(`/projects/${projectId}/resources/${resourceId}`, {
      method: "DELETE",
    });
  }

  // Content Blocks
  async getContentBlocks(projectId: number): Promise<{ blocks: ContentBlock[] }> {
    return this.request(`/projects/${projectId}/content`);
  }

  async upsertContentBlocks(projectId: number, blocks: ContentBlock[]): Promise<void> {
    await this.request(`/projects/${projectId}/content`, {
      method: "PUT",
      body: JSON.stringify({ blocks }),
    });
  }

  async deleteContentBlock(projectId: number, blockId: number): Promise<void> {
    await this.request(`/projects/${projectId}/content/${blockId}`, {
      method: "DELETE",
    });
  }

  // Decisions
  async updateDecisions(projectId: number, decisions: Record<string, unknown>): Promise<void> {
    await this.request(`/projects/${projectId}/decisions`, {
      method: "PUT",
      body: JSON.stringify({ decisions }),
    });
  }
}

export const api = new ApiClient();
