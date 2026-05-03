export class ProgramError extends Error {
  constructor(message: string, public readonly exitCode: number = 1) {
    super(message);
    this.name = 'ProgramError';
  }
}

export function formatError(err: unknown): string {
  if (err instanceof ProgramError) return err.message;
  if (err instanceof Error) return err.message;
  return String(err);
}
