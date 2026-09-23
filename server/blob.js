import { DefaultAzureCredential } from '@azure/identity';
import { BlobSASPermissions, BlobServiceClient, SASProtocol, generateBlobSASQueryParameters } from '@azure/storage-blob';

export function createAzureBlob(config) {
  if (!config.storageAccountUrl) return null;
  const credential = new DefaultAzureCredential();
  const service = new BlobServiceClient(config.storageAccountUrl, credential);
  const container = service.getContainerClient(config.uploadContainer);
  const clientFor = (containerName = config.uploadContainer) => service.getContainerClient(containerName);
  return {
    async health() {
      try { await container.exists(); return { healthy: true }; } catch { return { healthy: false }; }
    },
    async issueWriteUrl(objectKey, contentType, options = {}) {
      const target = clientFor(options.container);
      const startsOn = new Date(Date.now() - 60_000);
      const expiresOn = new Date(Date.now() + (options.expiresInSeconds || 900) * 1000);
      const delegation = await service.getUserDelegationKey(startsOn, expiresOn);
      const sas = generateBlobSASQueryParameters({ containerName: target.containerName, blobName: objectKey, permissions: BlobSASPermissions.parse('cw'), startsOn, expiresOn, protocol: SASProtocol.Https, contentType }, delegation, service.accountName).toString();
      return `${target.getBlockBlobClient(objectKey).url}?${sas}`;
    },
    async issueReadUrl(objectKey, options = {}) {
      const target = clientFor(options.container);
      const startsOn = new Date(Date.now() - 60_000);
      const expiresOn = new Date(Date.now() + (options.expiresInSeconds || 300) * 1000);
      const delegation = await service.getUserDelegationKey(startsOn, expiresOn);
      const sas = generateBlobSASQueryParameters({ containerName: target.containerName, blobName: objectKey, permissions: BlobSASPermissions.parse('r'), startsOn, expiresOn, protocol: SASProtocol.Https }, delegation, service.accountName).toString();
      return `${target.getBlobClient(objectKey).url}?${sas}`;
    },
    async verifyObject(objectKey, options = {}) {
      try { const properties = await clientFor(options.container).getBlobClient(objectKey).getProperties(); return { byteSize: Number(properties.contentLength), etag: properties.etag }; } catch { return null; }
    },
    async uploadStream(objectKey, stream, contentType, options = {}) {
      const block = clientFor(options.container).getBlockBlobClient(objectKey);
      return block.uploadStream(stream, 4 * 1024 * 1024, 5, { blobHTTPHeaders: { blobContentType: contentType } });
    },
    async downloadStream(objectKey, options = {}) {
      const result = await clientFor(options.container).getBlobClient(objectKey).download();
      return { stream: result.readableStreamBody, contentType: result.contentType, contentLength: Number(result.contentLength || 0) };
    }
  };
}
