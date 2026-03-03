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
  created_at: string;
  updated_at: string;
}

export interface GenerateResult {
  html: string;
  name: string;
  description: string;
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
    designPreferences?: string
  ): Promise<GenerateResult> {
    return this.request<GenerateResult>("/projects/generate", {
      method: "POST",
      body: JSON.stringify({
        prompt,
        project_id: projectId || null,
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

  async updateProject(id: number, prompt: string): Promise<{ id: number; version: number; html: string }> {
    return this.request(`/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify({ prompt }),
    });
  }

  async deleteProject(id: number): Promise<void> {
    await this.request(`/projects/${id}`, { method: "DELETE" });
  }
}

export const api = new ApiClient();
