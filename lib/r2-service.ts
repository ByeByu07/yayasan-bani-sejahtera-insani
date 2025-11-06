import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';

interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicDomain?: string; // Optional custom domain for public access
}

class R2Service {
  private s3Client: S3Client;
  private bucketName: string;
  private publicDomain?: string;

  constructor(config: R2Config) {
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
    
    this.bucketName = config.bucketName;
    this.publicDomain = config.publicDomain;
  }

  /**
   * Upload a file to R2
   */
  async uploadFile(
    key: string, 
    file: Buffer | Uint8Array | string, 
    contentType?: string,
    metadata?: Record<string, string>
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file,
        ContentType: contentType,
        Metadata: metadata,
      });

      await this.s3Client.send(command);
      
      // Return public URL if custom domain is configured
      if (this.publicDomain) {
        return `https://${this.publicDomain}/${key}`;
      }
      
      return `https://pub-${this.bucketName}.r2.dev/${key}`;
    } catch (error) {
      console.error('Error uploading file to R2:', error);
      throw new Error('Failed to upload file to R2');
    }
  }

  /**
   * Get a file from R2
   */
  async getFile(key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      
      if (!response.Body) {
        throw new Error('File not found');
      }

      const chunks: Uint8Array[] = [];
      for await (const chunk of response.Body as Readable) {
        chunks.push(chunk);
      }
      
      return Buffer.concat(chunks);
    } catch (error) {
      console.error('Error getting file from R2:', error);
      throw new Error('Failed to get file from R2');
    }
  }

  /**
   * Delete a file from R2
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
    } catch (error) {
      console.error('Error deleting file from R2:', error);
      throw new Error('Failed to delete file from R2');
    }
  }

  /**
   * List files in R2 bucket
   */
  async listFiles(prefix?: string, maxKeys?: number): Promise<string[]> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
        MaxKeys: maxKeys || 1000,
      });

      const response = await this.s3Client.send(command);
      
      return response.Contents?.map(object => object.Key || '') || [];
    } catch (error) {
      console.error('Error listing files from R2:', error);
      throw new Error('Failed to list files from R2');
    }
  }

  /**
   * Generate a presigned URL for temporary access
   */
  async getPresignedUrl(
    key: string, 
    expiresIn: number = 3600, 
    operation: 'get' | 'put' = 'get'
  ): Promise<string> {
    try {
      const command = operation === 'get' 
        ? new GetObjectCommand({ Bucket: this.bucketName, Key: key })
        : new PutObjectCommand({ Bucket: this.bucketName, Key: key });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      throw new Error('Failed to generate presigned URL');
    }
  }

  /**
   * Upload an image with automatic content type detection
   */
  async uploadImage(
    key: string, 
    imageBuffer: Buffer, 
    metadata?: Record<string, string>
  ): Promise<string> {
    // Auto-detect content type based on file extension
    let contentType = 'image/jpeg';
    const extension = key.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'png':
        contentType = 'image/png';
        break;
      case 'gif':
        contentType = 'image/gif';
        break;
      case 'webp':
        contentType = 'image/webp';
        break;
      case 'svg':
        contentType = 'image/svg+xml';
        break;
    }

    return this.uploadFile(key, imageBuffer, contentType, metadata);
  }

  /**
   * Generate a unique filename
   */
  generateUniqueKey(originalName: string, prefix?: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop();
    const baseName = originalName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, '-');
    
    const key = `${timestamp}-${randomString}-${baseName}.${extension}`;
    
    return prefix ? `${prefix}/${key}` : key;
  }
}

// Create and export configured R2 service instance
export const r2Service = new R2Service({
  accountId: process.env.R2_ACCOUNT_ID || '',
  accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  bucketName: process.env.R2_BUCKET_NAME || '',
  publicDomain: process.env.R2_PUBLIC_DOMAIN, // Optional custom domain
});

export { R2Service };