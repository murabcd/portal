export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export const fetcher = async <T>(input: string): Promise<T> => {
  const response = await fetch(input, {
    credentials: "same-origin",
  });

  if (!response.ok) {
    const message = await response.text();

    throw new ApiError(message || "Request failed", response.status);
  }

  return (await response.json()) as T;
};

export const withSearchParameters = (
  pathname: string,
  searchParameters: URLSearchParams
) => {
  const query = searchParameters.toString();

  return query ? `${pathname}?${query}` : pathname;
};
