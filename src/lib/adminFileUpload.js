// adminFileUpload — Centralized frontend helper for admin file uploads
// 
// Usage:
//   const result = await uploadAdminFile({
//     file: File,
//     contextType: 'compliance_record' | 'contract' | 'compliance_document' | 'performer_profile_image' | 'studio_document',
//     performerId: string (optional, required for performer contexts),
//     onProgress: (progress: number) => void (optional)
//   });
//
// Returns:
//   {
//     object_key: string,
//     file_name: string,
//     mime_type: string,
//     file_size: number,
//     storage_provider: 'r2'
//   }

import { base44 } from '@/api/base44Client';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const ALLOWED_MIME_TYPES = {
  compliance_record: [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  contract: [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  compliance_document: [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  performer_profile_image: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ],
  studio_document: [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
};

export async function uploadAdminFile({
  file,
  contextType,
  performerId,
  onProgress
}) {
  // Validate file
  if (!file) {
    throw new Error('No file provided');
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds maximum allowed (${MAX_FILE_SIZE / 1024 / 1024}MB)`);
  }

  // Validate context type
  if (!ALLOWED_MIME_TYPES[contextType]) {
    throw new Error(`Invalid context type: ${contextType}`);
  }

  // Validate MIME type
  const allowedTypes = ALLOWED_MIME_TYPES[contextType];
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`File type ${file.type} not allowed for ${contextType}. Allowed: ${allowedTypes.join(', ')}`);
  }

  // Validate performer ID for performer contexts
  const performerContexts = ['compliance_record', 'contract', 'compliance_document', 'performer_profile_image'];
  if (performerContexts.includes(contextType) && !performerId) {
    throw new Error(`performerId is required for context type: ${contextType}`);
  }

  // Get upload URL from backend
  const response = await base44.functions.invoke('createAdminFileUploadUrl', {
    context_type: contextType,
    performer_id: performerId,
    file_name: file.name,
    mime_type: file.type,
    file_size: file.size,
  });

  const { upload_url, object_key } = response.data;

  if (!upload_url || !object_key) {
    throw new Error('Failed to get upload URL from server');
  }

  // Upload file to R2 using PUT
  await uploadFileToR2(upload_url, file, file.type, onProgress);

  // Return normalized metadata
  return {
    object_key,
    file_name: file.name,
    mime_type: file.type,
    file_size: file.size,
    storage_provider: 'r2',
  };
}

function uploadFileToR2(uploadUrl, file, contentType, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          onProgress(progress);
        }
      });
    }
    
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });
    
    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed due to network error'));
    });
    
    xhr.addEventListener('abort', () => {
      reject(new Error('Upload was aborted'));
    });
    
    xhr.open('PUT', uploadUrl, true);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.send(file);
  });
}

// Helper to get signed view URL
export async function getFileViewUrl({ objectKey, recordId, recordType }) {
  if (!objectKey && !recordId) {
    throw new Error('Either objectKey or recordId must be provided');
  }

  const response = await base44.functions.invoke('getAdminFileViewUrl', {
    object_key: objectKey,
    record_id: recordId,
    record_type: recordType,
  });

  return response.data;
}