import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { randomUUID } from 'crypto';

/**
 * Azure Blob Storage service for file uploads (avatars, group photos).
 */
export class BlobStorageService {
  private blobServiceClient: BlobServiceClient;
  private containerClient: ContainerClient;
  private containerName: string;
  private publicUrl: string;

  constructor() {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    if (!connectionString) {
      throw new Error('AZURE_STORAGE_CONNECTION_STRING environment variable is required');
    }

    this.containerName = process.env.BLOB_CONTAINER_NAME || '$web';
    this.publicUrl = process.env.BLOB_PUBLIC_URL || '';

    this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    this.containerClient = this.blobServiceClient.getContainerClient(this.containerName);
  }

  /**
   * Upload a file to Azure Blob Storage
   * @param buffer - File buffer
   * @param fileName - Original file name
   * @param contentType - MIME type
   * @param folder - Optional folder path (e.g., 'avatars', 'groups')
   * @returns Public URL of the uploaded file
   */
  async uploadFile(
    buffer: Buffer,
    fileName: string,
    contentType: string,
    folder?: string
  ): Promise<string> {
    try {
      // Generate unique blob name
      const extension = fileName.split('.').pop();
      const uniqueName = `${randomUUID()}.${extension}`;
      const blobName = folder ? `${folder}/${uniqueName}` : uniqueName;

      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

      // Upload with content type
      await blockBlobClient.uploadData(buffer, {
        blobHTTPHeaders: {
          blobContentType: contentType,
        },
      });

      // Return public URL
      return this.getPublicUrl(blobName);
    } catch (error) {
      console.error('Failed to upload file to blob storage:', error);
      throw new Error('Failed to upload file');
    }
  }

  /**
   * Upload user avatar
   */
  async uploadAvatar(buffer: Buffer, fileName: string, contentType: string): Promise<string> {
    return this.uploadFile(buffer, fileName, contentType, 'avatars');
  }

  /**
   * Upload group photo
   */
  async uploadGroupPhoto(buffer: Buffer, fileName: string, contentType: string): Promise<string> {
    return this.uploadFile(buffer, fileName, contentType, 'groups');
  }

  /**
   * Delete a file from blob storage
   * @param blobUrl - Full URL or blob name
   */
  async deleteFile(blobUrl: string): Promise<void> {
    try {
      // Extract blob name from URL
      const blobName = this.extractBlobName(blobUrl);
      if (!blobName) {
        throw new Error('Invalid blob URL');
      }

      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.deleteIfExists();
    } catch (error) {
      console.error('Failed to delete file from blob storage:', error);
      throw new Error('Failed to delete file');
    }
  }

  /**
   * Get public URL for a blob
   */
  private getPublicUrl(blobName: string): string {
    if (this.publicUrl) {
      return `${this.publicUrl}/${blobName}`;
    }
    // Fallback to blob service URL
    return `${this.containerClient.url}/${blobName}`;
  }

  /**
   * Extract blob name from URL
   */
  private extractBlobName(url: string): string | null {
    try {
      // If it's a full URL, extract the path after the container name
      if (url.startsWith('http')) {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');
        // Remove empty first element and container name
        return pathParts.slice(2).join('/');
      }
      // If it's already just the blob name
      return url;
    } catch {
      return null;
    }
  }

  /**
   * Validate file type for uploads
   */
  static isValidImageType(contentType: string): boolean {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    return allowedTypes.includes(contentType.toLowerCase());
  }

  /**
   * Validate file size (max 5MB for images)
   */
  static isValidFileSize(sizeInBytes: number, maxSizeMB: number = 5): boolean {
    return sizeInBytes <= maxSizeMB * 1024 * 1024;
  }
}
