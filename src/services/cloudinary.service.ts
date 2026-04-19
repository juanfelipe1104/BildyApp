import cloudinary from '../config/cloudinary.js';
import { Readable } from 'node:stream';

type CloudinaryResourceType = 'auto' | 'image' | 'video' | 'raw';

type UploadOptions = {
    folder?: string;
    resourceType?: CloudinaryResourceType;
    publicId?: string;
    transformation?: unknown[];
    overwrite?: boolean;
    eager?: unknown[];
    eager_async?: boolean;
    [key: string]: unknown;
};

type CloudinaryUploadResult = {
    public_id: string;
    secure_url: string;
    url?: string;
    format?: string;
    resource_type?: string;
    [key: string]: unknown;
};

class CloudinaryService {
    async uploadBuffer(buffer: Buffer, options: UploadOptions = {}): Promise<CloudinaryUploadResult> {
        return new Promise((resolve, reject) => {
            const {
                folder,
                resourceType,
                publicId,
                transformation,
                ...restOptions
            } = options;

            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: folder ?? 'uploads',
                    resource_type: resourceType ?? 'auto',
                    public_id: publicId,
                    transformation,
                    ...restOptions
                },
                (error, result) => {
                    if (error) {
                        reject(error);
                    } else if (result) {
                        resolve(result as CloudinaryUploadResult);
                    } else {
                        reject(new Error('Cloudinary no devolvió resultado'));
                    }
                }
            );

            const readableStream = Readable.from(buffer);
            readableStream.pipe(uploadStream);
        });
    }

    async uploadImage(buffer: Buffer, options: UploadOptions = {}): Promise<CloudinaryUploadResult> {
        return this.uploadBuffer(buffer, {
            folder: 'images',
            resourceType: 'image',
            transformation: [
                { quality: 'auto:good' },
                { fetch_format: 'auto' }
            ],
            ...options
        });
    }

    async uploadAvatar(buffer: Buffer, userId: string): Promise<CloudinaryUploadResult> {
        return this.uploadBuffer(buffer, {
            folder: 'avatars',
            publicId: `user_${userId}`,
            overwrite: true,
            resourceType: 'image',
            transformation: [
                { width: 300, height: 300, crop: 'fill', gravity: 'face' },
                { radius: 'max' },
                { quality: 'auto' }
            ]
        });
    }

    async uploadProductImage(buffer: Buffer, productId: string, index = 0): Promise<CloudinaryUploadResult> {
        return this.uploadBuffer(buffer, {
            folder: 'products',
            publicId: `product_${productId}_${index}`,
            resourceType: 'image',
            eager: [
                { width: 150, height: 150, crop: 'fill' },
                { width: 400, height: 400, crop: 'fill' },
                { width: 800, height: 800, crop: 'limit' }
            ],
            eager_async: true
        });
    }

    async delete(publicId: string, resourceType: CloudinaryResourceType = 'image'): Promise<unknown> {
        return cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType
        });
    }

    async deleteMany(publicIds: string[], resourceType: CloudinaryResourceType = 'image'): Promise<unknown> {
        return cloudinary.api.delete_resources(publicIds, {
            resource_type: resourceType
        });
    }

    getOptimizedUrl(publicId: string, options: UploadOptions = {}): string {
        const {
            resourceType,
            publicId: _publicId,
            folder: _folder,
            transformation: _transformation,
            ...restOptions
        } = options;

        return cloudinary.url(publicId, {
            fetch_format: 'auto',
            quality: 'auto',
            resource_type: resourceType,
            ...restOptions
        });
    }

    getTransformedUrl(publicId: string, transformations: unknown[]): string {
        return cloudinary.url(publicId, {
            transformation: transformations
        });
    }
}

export default new CloudinaryService();