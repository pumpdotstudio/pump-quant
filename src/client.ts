/* ================================================================== */
/*  Pump Studio Agent — API client                                     */
/*                                                                     */
/*  Typed HTTP client using native fetch. All requests include proper   */
/*  error handling and typed responses.                                 */
/*                                                                     */
/*  Base URL: https://api.pump.studio                                  */
/*  Auth: Authorization: Bearer ps_xxx                                 */
/* ================================================================== */

import type {
  RegisterResponse,
  ProfileResponse,
  MarketResponse,
  MarketToken,
  DataPointResponse,
  DataPoint,
  ContextResponse,
  TokenContext,
  SubmissionPayload,
  SubmitResult,
} from "./types.js";

export class PumpStudioClient {
  private baseUrl: string;
  private apiKey: string | null;

  constructor(baseUrl: string, apiKey: string | null) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.apiKey = apiKey;
  }

  /* ---- Internal helpers ---- */

  private headers(json = false): Record<string, string> {
    const h: Record<string, string> = {};
    if (this.apiKey) {
      h["Authorization"] = `Bearer ${this.apiKey}`;
    }
    if (json) {
      h["Content-Type"] = "application/json";
    }
    return h;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const opts: RequestInit = {
      method,
      headers: this.headers(!!body),
    };
    if (body) {
      opts.body = JSON.stringify(body);
    }

    const res = await fetch(url, opts);
    const text = await res.text();

    let data: T;
    try {
      data = JSON.parse(text) as T;
    } catch {
      throw new Error(
        `${method} ${path} returned non-JSON (${res.status}): ${text.slice(0, 200)}`
      );
    }

    if (!res.ok) {
      const errMsg = (data as any)?.error ?? `HTTP ${res.status}`;
      throw new Error(`${method} ${path}: ${errMsg}`);
    }

    return data;
  }

  /* ---- API Key Registration ---- */

  async register(name: string, description?: string): Promise<RegisterResponse> {
    return this.request<RegisterResponse>("POST", "/api/v1/keys/register", {
      name,
      description,
    });
  }

  /* ---- Agent Profile ---- */

  async getProfile(): Promise<ProfileResponse> {
    return this.request<ProfileResponse>("GET", "/api/v1/agent/profile");
  }

  async setProfile(profile: {
    name: string;
    description: string;
    twitterHandle?: string;
    website?: string;
  }): Promise<{ ok: boolean }> {
    return this.request<{ ok: boolean }>("POST", "/api/v1/agent/profile", profile);
  }

  /* ---- Market Discovery ---- */

  async getMarket(
    tab: "all" | "live" | "new" | "graduated" = "new",
    limit = 5,
  ): Promise<MarketToken[]> {
    const res = await this.request<MarketResponse>(
      "GET",
      `/api/v1/market?tab=${tab}&limit=${limit}&format=json`,
    );
    return res.data ?? [];
  }

  /* ---- DataPoint Snapshot ---- */

  async getDataPoint(mint: string): Promise<DataPoint> {
    const res = await this.request<DataPointResponse>(
      "GET",
      `/api/v1/datapoint?mint=${mint}`,
    );
    if (!res.data) {
      throw new Error(`No DataPoint returned for ${mint}`);
    }
    return res.data;
  }

  /* ---- Token Context (BYOC) ---- */

  async getContext(mint: string): Promise<TokenContext> {
    const res = await this.request<ContextResponse>(
      "GET",
      `/api/v1/chat/context?mint=${mint}`,
    );
    if (!res.data) {
      throw new Error(`No context returned for ${mint}`);
    }
    return res.data;
  }

  /* ---- Analysis Submission ---- */

  async submitAnalysis(payload: SubmissionPayload): Promise<SubmitResult> {
    return this.request<SubmitResult>("POST", "/api/v1/analysis/submit", payload);
  }
}
