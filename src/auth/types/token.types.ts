export interface ITokenPayload {
  id: string;
  login: string;
  email: string;
}

export interface ICreateToken {
  token: string;
  userId: string;
  expiresAt: Date;
}

export interface ITokensResponse {
  accessToken: string;
  refreshToken: string;
}

export interface IAccessTokenResponse {
  accessToken: string;
}
