declare namespace Express {
  interface Request {
    auth?: {
      id: string;
      name: string;
      email: string;
      role: string;
      status: string;
    };
  }
}
