declare global {
  interface FetchErrorResponse {
    statusCode: number;
    message: string;
    error: string;
  }
}

export {};
