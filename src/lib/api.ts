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
  created_at: string;
  updated_at: string;
}

export interface GenerateResult {
  html: string;
  name: string;
  description: string;
}

export interface Resource {
  id: number;
  resource_type: string;
  name: string;
  description: string;
  content?: string;
  mime_type?: string;
  file_size?: number;
  url?: string;
  created_at?: string;
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
  async generateProject(
    prompt: string,
    projectId?: number,
    designPreferences?: string,
    existingCode?: string
  ): Promise<GenerateResult> {
    return this.request<GenerateResult>("/projects/generate", {
      method: "POST",
      body: JSON.stringify({
        prompt,
        project_id: projectId || null,
        design_preferences: designPreferences || null,
        existing_code: existingCode || null,
      }),
    });
  }

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

  async saveProject(name: string, description: string, htmlCode: string): Promise<Project> {
    return this.request<Project>("/projects", {
      method: "POST",
      body: JSON.stringify({ name, description, html_code: htmlCode }),
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

  async deleteResource(projectId: number, resourceId: number): Promise<void> {
    await this.request(`/projects/${projectId}/resources/${resourceId}`, {
      method: "DELETE",
    });
  }
}

export const api = new ApiClient();
