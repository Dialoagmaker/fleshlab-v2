import { DefaultAzureCredential } from '@azure/identity';
import { BlobSASPermissions, BlobServiceClient, SASProtocol, generateBlobSASQueryParameters } from '@azure/storage-blob';

export function createAzureBlob(config) {
  if (!config.storageAccountUrl) return null;
  const credential = new DefaultAzureCredential();
  const service = new BlobServiceClient(config.storageAccountUrl, credential);
  const container = service.getContainerClient(config.uploadContainer);
  return {
    async health() {
      try { await container.exists(); return { healthy: true }; } catch { return { healthy: false }; }
    },
    async issueWriteUrl(objectKey, contentType) {
      const startsOn = new Date(Date.now() - 60_000);
      const expiresOn = new Date(Date.now() + 15 * 60_000);
      const delegation = await service.getUserDelegationKey(startsOn, expiresOn);
      const sas = generateBlobSASQueryParameters({ containerName: container.containerName, blobName: objectKey, permissions: BlobSASPermissions.parse('cw'), startsOn, expiresOn, protocol: SASProtocol.Https, contentType }, delegation, service.accountName).toString();
      return `${container.getBlockBlobClient(objectKey).url}?${sas}`;
    },
    async issueReadUrl(objectKey) {
      const startsOn = new Date(Date.now() - 60_000);
      const expiresOn = new Date(Date.now() + 5 * 60_000);
      const delegation = await service.getUserDelegationKey(startsOn, expiresOn);
      const sas = generateBlobSASQueryParameters({ containerName: container.containerName, blobName: objectKey, permissions: BlobSASPermissions.parse('r'), startsOn, expiresOn, protocol: SASProtocol.Https }, delegation, service.accountName).toString();
      return `${container.getBlobClient(objectKey).url}?${sas}`;
    },
    async verifyObject(objectKey) {
      try { const properties = await container.getBlobClient(objectKey).getProperties(); return { byteSize: Number(properties.contentLength), etag: properties.etag }; } catch { return null; }
    }
  };
}
