const envCache = new Map<string, string>();

export function getRequiredEnv(name: string) {
  if (envCache.has(name)) {
    return envCache.get(name)!;
  }

  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  envCache.set(name, value);
  return value;
}

export function getOptionalEnv(name: string) {
  return process.env[name];
}

export function getStorageBucket() {
  return getOptionalEnv("PRIVATE_STORAGE_BUCKET") ?? "private-record-files";
}
