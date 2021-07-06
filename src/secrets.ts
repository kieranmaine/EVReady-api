import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

const secretsClient = new SecretManagerServiceClient();

export const SecretKeys = {
  POSTGRES_PASSWORD:
    "projects/1011591639987/secrets/POSTGRES_PASSWORD/versions/latest",
};

export const getSecret = async (name: string): Promise<string> => {
  const [version] = await secretsClient.accessSecretVersion({ name });

  return version.payload?.data?.toString() || "";
};
