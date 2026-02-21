import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { decode } from 'base64-arraybuffer';

const BUCKET_NAME = 'meal-images';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const IMAGE_QUALITY = 0.8;
const MAX_WIDTH = 1200;
const MAX_HEIGHT = 1200;

export interface ImagePickerResult {
  uri: string;
  width: number;
  height: number;
  base64?: string;
}

export interface UploadResult {
  url: string;
  path: string;
}

class ImageService {
  /**
   * Request camera permissions
   */
  async requestCameraPermissions(): Promise<boolean> {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Request media library permissions
   */
  async requestMediaLibraryPermissions(): Promise<boolean> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Pick an image from the camera
   */
  async pickFromCamera(): Promise<ImagePickerResult | null> {
    const hasPermission = await this.requestCameraPermissions();
    if (!hasPermission) {
      throw new Error('Camera permission not granted');
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: IMAGE_QUALITY,
      base64: true,
    });

    if (result.canceled || !result.assets[0]) {
      return null;
    }

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      base64: asset.base64 ?? undefined,
    };
  }

  /**
   * Pick an image from the media library
   */
  async pickFromLibrary(): Promise<ImagePickerResult | null> {
    const hasPermission = await this.requestMediaLibraryPermissions();
    if (!hasPermission) {
      throw new Error('Media library permission not granted');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: IMAGE_QUALITY,
      base64: true,
    });

    if (result.canceled || !result.assets[0]) {
      return null;
    }

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      base64: asset.base64 ?? undefined,
    };
  }

  /**
   * Upload an image to Supabase Storage
   */
  async uploadImage(
    image: ImagePickerResult,
    userId: string,
    mealId?: string
  ): Promise<UploadResult> {
    if (!image.base64) {
      throw new Error('No base64 data available');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const uniqueId = mealId || Math.random().toString(36).substring(7);
    const filename = `${uniqueId}_${timestamp}.jpg`;
    const path = `${userId}/${filename}`;

    // Convert base64 to ArrayBuffer
    const arrayBuffer = decode(image.base64);

    // Check file size
    if (arrayBuffer.byteLength > MAX_FILE_SIZE) {
      throw new Error('Image file size exceeds 5MB limit');
    }

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(path);

    return {
      url: urlData.publicUrl,
      path: data.path,
    };
  }

  /**
   * Delete an image from Supabase Storage
   */
  async deleteImage(path: string): Promise<void> {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  /**
   * Get optimized image URL with Supabase transformations
   */
  getOptimizedUrl(
    url: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
    } = {}
  ): string {
    const { width = 400, height = 300, quality = 80 } = options;

    // Supabase Storage supports image transformations via URL params
    // Format: /storage/v1/render/image/public/{bucket}/{path}?width=X&height=Y&quality=Z
    if (url.includes('/storage/v1/object/public/')) {
      return url.replace(
        '/storage/v1/object/public/',
        `/storage/v1/render/image/public/`
      ) + `?width=${width}&height=${height}&quality=${quality}&resize=cover`;
    }

    return url;
  }

  /**
   * Get thumbnail URL (smaller size for lists)
   */
  getThumbnailUrl(url: string): string {
    return this.getOptimizedUrl(url, { width: 200, height: 150, quality: 70 });
  }

  /**
   * Get full size URL (for detail views)
   */
  getFullSizeUrl(url: string): string {
    return this.getOptimizedUrl(url, { width: 800, height: 600, quality: 85 });
  }
}

export const imageService = new ImageService();
export default imageService;
