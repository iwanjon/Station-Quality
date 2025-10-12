import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Camera, Trash2, X } from 'lucide-react';
import axiosServer from '../utilities/AxiosServer';

interface PhotoUploadProps {
  stationCode: string;
  currentPhoto?: string | null;
  onPhotoUpdate: (photoPaths: string | null) => void;
  isModal?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({
  stationCode,
  currentPhoto,
  onPhotoUpdate,
  isModal = false,
  isOpen = false,
  onClose
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);

      const response = await axiosServer.post(`/api/stasiun/${stationCode}/upload-photo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        onPhotoUpdate(response.data.data.allPhotos);
        setPreviewUrl(null);
        alert('Photo uploaded successfully!');
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: unknown) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert('Failed to upload photo: ' + errorMessage);
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const getPhotoUrl = (photoPath: string) => {
    if (photoPath.startsWith('http')) {
      return photoPath;
    }
    // Use environment variable for base URL
    const baseUrl = import.meta.env.VITE_SERVER_BASE_URL || 'http://localhost:5000';
    return `${baseUrl}${photoPath}`;
  };

  // Get array of photo paths from comma-separated string
  const getPhotoArray = (photoString: string | null): string[] => {
    if (!photoString) return [];
    return photoString.split(',').filter(p => p.trim());
  };

  const handleDeletePhoto = async (photoPath: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await axiosServer.delete(`/api/stasiun/${stationCode}/photo`, {
        data: { photoPath }
      });

      if (response.data.success) {
        onPhotoUpdate(response.data.data.remainingPhotos);
        alert('Photo deleted successfully!');
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: unknown) {
      console.error('Delete error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert('Failed to delete photo: ' + errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  // If modal mode and not open, don't render anything
  if (isModal && !isOpen) {
    return null;
  }

  const content = (
    <div className="space-y-4">
      {/* Current Photos Display */}
      {currentPhoto && getPhotoArray(currentPhoto).length > 0 && (
        <div className="relative">
          <div className="bg-gray-100 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Current Site Photos ({getPhotoArray(currentPhoto).length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {getPhotoArray(currentPhoto).map((photoPath, index) => (
                <div key={index} className="relative group">
                  <img
                    src={getPhotoUrl(photoPath)}
                    alt={`Site photo ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-gray-300"
                    onError={(e) => {
                      console.error('Failed to load image:', photoPath);
                      e.currentTarget.src = '/placeholder-image.png'; // Fallback image
                    }}
                  />
                  <button
                    onClick={() => handleDeletePhoto(photoPath)}
                    disabled={isDeleting}
                    className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition-colors disabled:opacity-50 opacity-0 group-hover:opacity-100"
                    title="Delete photo"
                  >
                    {isDeleting ? (
                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Trash2 size={12} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="text-sm font-medium text-gray-700 mb-4">
          {currentPhoto && getPhotoArray(currentPhoto).length > 0 ? 'Add More Photos' : 'Upload Site Photos'}
        </h4>

        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {previewUrl ? (
            <div className="space-y-4">
              <img
                src={previewUrl}
                alt="Preview"
                className="max-w-full h-32 object-cover rounded-lg mx-auto border border-gray-300"
              />
              <div className="flex items-center justify-center space-x-2">
                {isUploading ? (
                  <div className="flex items-center space-x-2 text-blue-600">
                    <div className="w-5 h-5 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Uploading...</span>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Choose Different File
                    </button>
                    <button
                      onClick={() => setPreviewUrl(null)}
                      className="px-4 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center">
                {currentPhoto ? (
                  <Camera className="w-12 h-12 text-gray-400" />
                ) : (
                  <ImageIcon className="w-12 h-12 text-gray-400" />
                )}
              </div>
              <div>
                <p className="text-gray-600 mb-2">
                  {currentPhoto && getPhotoArray(currentPhoto).length > 0
                    ? 'Drop additional photos here or click to add more'
                    : 'Drop photos here or click to upload'
                  }
                </p>
                <p className="text-sm text-gray-500">
                  PNG, JPG, JPEG up to 5MB each
                </p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Upload size={16} />
                {isUploading ? 'Uploading...' : 'Choose File'}
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleFileSelect(file);
              }
            }}
            className="hidden"
          />
        </div>

        {/* Upload Tips */}
        <div className="mt-4 text-xs text-gray-500">
          <p className="font-medium mb-1">Tips for better photos:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Take photos during daylight for better visibility</li>
            <li>Include the entire station structure in the frame</li>
            <li>Ensure the photo shows the shelter and equipment clearly</li>
            <li>Avoid blurry or low-resolution images</li>
          </ul>
        </div>
      </div>
    </div>
  );

  // If modal mode, wrap in modal structure
  if (isModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">Site Photos</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          <div className="p-6">
            {content}
          </div>
        </div>
      </div>
    );
  }

  // Default inline mode
  return content;
};

export default PhotoUpload;