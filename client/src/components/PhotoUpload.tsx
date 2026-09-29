import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Camera, Trash2, X, Check } from 'lucide-react';
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
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getPhotoArray = (photoString: string | null): string[] => {
    if (!photoString) return [];
    return photoString.split(',').filter((p) => p.trim());
  };

  const getPhotoUrl = (photoPath: string) => {
    if (photoPath.startsWith('http')) {
      return photoPath;
    }

    const baseUrl = import.meta.env.VITE_SERVER_BASE_URL || 'http://localhost:5000';
    return `${baseUrl}${photoPath}`;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('photo', file);

    const response = await axiosServer.post(
      `/api/stasiun/${stationCode}/upload-photo`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    return response.data.data.allPhotos;
  };

  const handleFileSelect = async (files: File[]) => {
    if (files.length === 0) {
      return;
    }

    const validFiles: File[] = [];

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        alert(`"${file.name}" is not an image file.`);
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert(`"${file.name}" exceeds the 5MB size limit.`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      return;
    }

    setIsUploading(true);
    setPreviewUrl(null);

    let latestPhotoPaths = currentPhoto;
    let successfulUploads = 0;
    let failedUploads = 0;
    const failedFileNames: string[] = [];

    try {
      for (const file of validFiles) {
        try {
          const reader = new FileReader();

          const previewData = await new Promise<string>((resolve, reject) => {
            reader.onload = (event) => {
              const result = event.target?.result;

              if (typeof result === 'string') {
                resolve(result);
              } else {
                reject(new Error('Unable to generate photo preview.'));
              }
            };

            reader.onerror = () => {
              reject(new Error('Unable to read selected photo.'));
            };

            reader.readAsDataURL(file);
          });

          setPreviewUrl(previewData);

          const updatedPhotos = await uploadFile(file);
          latestPhotoPaths = updatedPhotos;
          successfulUploads++;

          onPhotoUpdate(latestPhotoPaths);
        } catch (error: unknown) {
          failedUploads++;
          failedFileNames.push(file.name);

          console.error(`Upload error for "${file.name}":`, error);
        }
      }

      setPreviewUrl(null);

      if (successfulUploads > 0) {
        onPhotoUpdate(latestPhotoPaths);

        if (failedUploads === 0) {
          alert(
            successfulUploads === 1
              ? 'Photo uploaded successfully!'
              : `${successfulUploads} photos uploaded successfully!`
          );
        } else {
          alert(
            `${successfulUploads} photo${
              successfulUploads > 1 ? 's' : ''
            } uploaded successfully, but ${failedUploads} failed.\n\nFailed files:\n${failedFileNames.join(
              '\n'
            )}`
          );
        }
      } else {
        alert(
          `Failed to upload selected photo${
            validFiles.length > 1 ? 's' : ''
          }.`
        );
      }
    } finally {
      setIsUploading(false);
      setPreviewUrl(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files || []);

    if (files.length > 0) {
      void handleFileSelect(files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length > 0) {
      void handleFileSelect(files);
    }
  };

  const togglePhotoSelection = (photoPath: string) => {
    setSelectedPhotos((currentSelected) => {
      if (currentSelected.includes(photoPath)) {
        return currentSelected.filter((path) => path !== photoPath);
      }

      return [...currentSelected, photoPath];
    });
  };

  const selectAllPhotos = () => {
    setSelectedPhotos(photos);
  };

  const clearSelection = () => {
    setSelectedPhotos([]);
  };

  const handleDeletePhoto = async (
    photoPath: string,
    showConfirmation = true
  ): Promise<string | null> => {
    if (
      showConfirmation &&
      !confirm('Are you sure you want to delete this photo?')
    ) {
      return null;
    }

    const response = await axiosServer.delete(
      `/api/stasiun/${stationCode}/photo`,
      {
        data: { photoPath }
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    return response.data.data.remainingPhotos;
  };

  const handleBulkDelete = async () => {
    if (selectedPhotos.length === 0 || isDeleting) {
      return;
    }

    const selectedCount = selectedPhotos.length;

    if (
      !confirm(
        `Are you sure you want to delete ${selectedCount} selected photo${
          selectedCount > 1 ? 's' : ''
        }?`
      )
    ) {
      return;
    }

    setIsDeleting(true);

    let latestPhotoPaths = currentPhoto;
    let successfulDeletes = 0;
    let failedDeletes = 0;
    const failedPhotoPaths: string[] = [];

    try {
      for (const photoPath of selectedPhotos) {
        try {
          const remainingPhotos = await handleDeletePhoto(photoPath, false);

          latestPhotoPaths = remainingPhotos;
          successfulDeletes++;

          onPhotoUpdate(latestPhotoPaths);
        } catch (error: unknown) {
          failedDeletes++;
          failedPhotoPaths.push(photoPath);

          console.error(`Delete error for "${photoPath}":`, error);
        }
      }

      onPhotoUpdate(latestPhotoPaths);

      if (failedDeletes === 0) {
        clearSelection();

        alert(
          `${successfulDeletes} photo${
            successfulDeletes > 1 ? 's' : ''
          } deleted successfully!`
        );
      } else if (successfulDeletes > 0) {
        clearSelection();

        alert(
          `${successfulDeletes} photo${
            successfulDeletes > 1 ? 's' : ''
          } deleted successfully, but ${failedDeletes} failed.\n\nFailed photo paths:\n${failedPhotoPaths.join(
            '\n'
          )}`
        );
      } else {
        alert(
          `Failed to delete the selected photo${
            selectedCount > 1 ? 's' : ''
          }.`
        );
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const photos = getPhotoArray(currentPhoto);
  const selectedCount = selectedPhotos.length;
  const allPhotosSelected = photos.length > 0 && selectedCount === photos.length;

  // If modal mode and not open, don't render anything
  if (isModal && !isOpen) {
    return null;
  }

  const content = (
    <div className="space-y-4">
      {/* Current Photos Display */}
      {photos.length > 0 && (
        <div className="relative">
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-3">
              <h4 className="text-sm font-medium text-gray-700">
                Current Site Photos ({photos.length})
              </h4>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-600">
                  {selectedCount} selected
                </span>

                <button
                  type="button"
                  onClick={allPhotosSelected ? clearSelection : selectAllPhotos}
                  disabled={isDeleting}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {allPhotosSelected ? 'Batal Pilih Semua' : 'Pilih Semua'}
                </button>

                {selectedCount > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={clearSelection}
                      disabled={isDeleting}
                      className="px-3 py-1.5 bg-gray-500 text-white text-sm font-medium rounded-md hover:bg-gray-600 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={handleBulkDelete}
                      disabled={isDeleting}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {isDeleting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Trash2 size={14} />
                      )}
                      Delete Selected
                    </button>
                  </>
                )}
              </div>
            </div>

            <p className="text-xs text-gray-500 mb-3">
              Pilih foto yang ingin dihapus. Gunakan pilihan individual atau
              Pilih Semua untuk memilih seluruh foto.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {photos.map((photoPath, index) => {
                const isSelected = selectedPhotos.includes(photoPath);

                return (
                  <div
                    key={photoPath}
                    className={`relative group rounded-lg ${
                      isSelected
                        ? 'ring-2 ring-blue-600 ring-offset-2'
                        : ''
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => togglePhotoSelection(photoPath)}
                      className={`relative block w-full overflow-hidden rounded-lg border bg-gray-100 transition-all ${
                        isSelected
                          ? 'border-blue-600'
                          : 'border-gray-300 hover:border-blue-400'
                      }`}
                      title={
                        isSelected
                          ? 'Deselect photo'
                          : 'Select photo for bulk delete'
                      }
                    >
                      <img
                        src={getPhotoUrl(photoPath)}
                        alt={`Site photo ${index + 1}`}
                        className="w-full h-32 object-contain rounded-lg"
                        onError={(e) => {
                          console.error('Failed to load image:', photoPath);
                          e.currentTarget.src = '/placeholder-image.png';
                        }}
                      />

                      {isSelected && (
                        <div className="absolute inset-0 bg-blue-600/20 flex items-start justify-end p-2">
                          <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shadow">
                            <Check size={16} />
                          </div>
                        </div>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 text-xs text-gray-500">
              {allPhotosSelected
                ? 'Semua foto dipilih.'
                : selectedCount > 0
                ? 'Foto terpilih ditandai. Klik foto terpilih lagi untuk membatalkan pilihan.'
                : 'Pilih satu atau beberapa foto untuk mengaktifkan hapus massal.'}
            </div>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="text-sm font-medium text-gray-700 mb-4">
          {photos.length > 0 ? 'Add More Photos' : 'Upload Site Photos'}
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
                {photos.length > 0 ? (
                  <Camera className="w-12 h-12 text-gray-400" />
                ) : (
                  <ImageIcon className="w-12 h-12 text-gray-400" />
                )}
              </div>

              <div>
                <p className="text-gray-600 mb-2">
                  {photos.length > 0
                    ? 'Drop additional photos here or click to add more'
                    : 'Drop photos here or click to upload'}
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
                {isUploading ? 'Uploading...' : 'Choose Files'}
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileInputChange}
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