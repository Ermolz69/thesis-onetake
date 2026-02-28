export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  traceId?: string;
  errorCode?: string;
  requestPath?: string;
  method?: string;
  extensions?: Record<string, unknown>;
}

export interface ValidationProblemDetails extends ProblemDetails {
  errors?: Record<string, string[]>;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: ProblemDetails | ValidationProblemDetails;
}

export class HttpError extends Error implements ApiError {
  constructor(
    public message: string,
    public status: number,
    public code?: string,
    public details?: ProblemDetails | ValidationProblemDetails
  ) {
    super(message);
    this.name = 'HttpError';
  }
}
