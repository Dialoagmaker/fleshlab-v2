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
  console.log('[uploadAdminFile] Starting upload for file:', file.name, 'contextType:', contextType, 'performerId:', performerId);
  
  // Validate file
  if (!file) {
    console.error('[uploadAdminFile] No file provided');
    throw new Error('No file provided');
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    console.error('[uploadAdminFile] File size exceeds limit:', file.size);
    throw new Error(`File size exceeds maximum allowed (${MAX_FILE_SIZE / 1024 / 1024}MB)`);
  }

  // Validate context type
  if (!ALLOWED_MIME_TYPES[contextType]) {
    console.error('[uploadAdminFile] Invalid context type:', contextType);
    throw new Error(`Invalid context type: ${contextType}`);
  }

  // Validate MIME type
  const allowedTypes = ALLOWED_MIME_TYPES[contextType];
  if (!allowedTypes.includes(file.type)) {
    console.error('[uploadAdminFile] Invalid MIME type:', file.type, 'allowed:', allowedTypes);
    throw new Error(`File type ${file.type} not allowed for ${contextType}. Allowed: ${allowedTypes.join(', ')}`);
  }

  // Validate performer ID for performer contexts
  const performerContexts = ['compliance_record', 'contract', 'compliance_document', 'performer_profile_image'];
  if (performerContexts.includes(contextType) && !performerId) {
    console.error('[uploadAdminFile] performerId missing for context:', contextType);
    throw new Error(`performerId is required for context type: ${contextType}`);
  }

  // Get upload URL from backend
  console.log('[uploadAdminFile] Calling createAdminFileUploadUrl...');
  const response = await base44.functions.invoke('createAdminFileUploadUrl', {
    context_type: contextType,
    performer_id: performerId,
    file_name: file.name,
    mime_type: file.type,
    file_size: file.size,
  });

  console.log('[uploadAdminFile] Backend response keys:', Object.keys(response.data));
  console.log('[uploadAdminFile] upload_url exists:', !!response.data.upload_url);
  console.log('[uploadAdminFile] object_key exists:', !!response.data.object_key);
  
  const { upload_url, object_key } = response.data;

  if (!upload_url || !object_key) {
    console.error('[uploadAdminFile] Missing upload_url or object_key in response:', response.data);
    throw new Error('Failed to get upload URL from server');
  }

  // Upload file to R2 using PUT
  console.log('[uploadAdminFile] Starting R2 PUT upload to:', upload_url.substring(0, 50) + '...');
  await uploadFileToR2(upload_url, file, file.type, onProgress);
  console.log('[uploadAdminFile] R2 PUT completed successfully');

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
  console.log('[uploadFileToR2] Initializing XHR upload');
  console.log('[uploadFileToR2] URL length:', uploadUrl.length, 'Content-Type:', contentType, 'File size:', file.size);
  
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.addEventListener('readystatechange', () => {
      console.log('[uploadFileToR2] readyState:', xhr.readyState, 'status:', xhr.status);
    });
    
    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          console.log('[uploadFileToR2] Progress:', progress.toFixed(1) + '%', e.loaded, '/', e.total);
          onProgress(progress);
        }
      });
    }
    
    xhr.addEventListener('load', () => {
      console.log('[uploadFileToR2] Load event - status:', xhr.status, 'response:', xhr.responseText?.substring(0, 100));
      if (xhr.status >= 200 && xhr.status < 300) {
        console.log('[uploadFileToR2] Upload successful');
        resolve();
      } else {
        console.error('[uploadFileToR2] Upload failed with status:', xhr.status);
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });
    
    xhr.addEventListener('error', (e) => {
      console.error('[uploadFileToR2] XHR error event:', e);
      reject(new Error('Upload failed due to network error'));
    });
    
    xhr.addEventListener('abort', () => {
      console.warn('[uploadFileToR2] Upload aborted');
      reject(new Error('Upload was aborted'));
    });
    
    console.log('[uploadFileToR2] Opening PUT request...');
    xhr.open('PUT', uploadUrl, true);
    console.log('[uploadFileToR2] Setting Content-Type header...');
    xhr.setRequestHeader('Content-Type', contentType);
    console.log('[uploadFileToR2] Sending file...');
    xhr.send(file);
    console.log('[uploadFileToR2] XHR send completed');
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