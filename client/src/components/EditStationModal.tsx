import { useState, useEffect } from "react";
import axiosInstance from "../utilities/AxiosServer";
import { X } from "lucide-react";

interface StationData {
  [key: string]: string | number | null | undefined;
}

interface EditStationModalProps {
  isOpen: boolean;
  onClose: () => void;
  stationCode: string;
  stationData: StationData;
  onSuccess: (updatedData: StationData) => void;
  fieldsToEdit: string[];
  title: string;
}

interface FormData {
  [key: string]: string | number | null | undefined;
}

const EditStationModal = ({
  isOpen,
  onClose,
  stationCode,
  stationData,
  onSuccess,
  fieldsToEdit,
  title
}: EditStationModalProps) => {
  const [formData, setFormData] = useState<FormData>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [networks, setNetworks] = useState<string[]>([]);
  const [upts, setUpts] = useState<string[]>([]);
  const [provinces, setProvinces] = useState<string[]>([]);
  const [showNewNetworkInput, setShowNewNetworkInput] = useState(false);
  const [showNewUptInput, setShowNewUptInput] = useState(false);
  const [showNewProvinceInput, setShowNewProvinceInput] = useState(false);

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen && stationData) {
      const initialData: FormData = {};
      fieldsToEdit.forEach(field => {
        initialData[field] = stationData[field] || '';
      });
      setFormData(initialData);
      setError(null);
      setShowNewNetworkInput(false);
      setShowNewUptInput(false);
      
      // Fetch reference data if needed
      if (fieldsToEdit.includes('jaringan') || fieldsToEdit.includes('upt_penanggung_jawab') || fieldsToEdit.includes('provinsi')) {
        fetchReferenceData();
      }
    }
  }, [isOpen, stationData, fieldsToEdit]);

  const fetchReferenceData = async () => {
    try {
      const response = await axiosInstance.get('/api/stasiun/foreign-key-options');
      if (response.data.success) {
        setNetworks(response.data.data.networks);
        setUpts(response.data.data.upts);
        setProvinces(response.data.data.provinces);
      }
    } catch (error) {
      console.error('Error fetching reference data:', error);
    }
  };

  const handleInputChange = (field: string, value: string | number | null | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('🏷️ EditStationModal - Station code:', stationCode);
      console.log('🏷️ EditStationModal - Station data:', stationData);

      if (!stationCode) {
        setError('Station code is missing');
        return;
      }

      // Log data yang dikumpulkan dari form sebelum dikirim
      console.log('📝 Form data collected:', JSON.stringify(formData, null, 2));
      console.log('🎯 Fields being edited:', fieldsToEdit);
      console.log('🏷️ Station code:', stationCode);

      const response = await axiosInstance.put(`/api/stasiun/${stationCode}`, formData);

      if (response.data.success) {
        onSuccess(response.data.data);
        onClose();
      } else {
        setError(response.data.message || 'Failed to update station data');
      }
    } catch (err: unknown) {
      console.error('Error updating station:', err);
      let errorMessage = 'Failed to update station data';

      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string } } };
        errorMessage = axiosError.response?.data?.message || errorMessage;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field: string) => {
    const value = formData[field];
    
    // Mapping untuk label yang konsisten dengan station detail
    const labelMapping: { [key: string]: string } = {
      lintang: 'Latitude',
      bujur: 'Longitude',
      elevasi: 'Elevation',
      tahun_instalasi: 'Year of Installation',
      jaringan: 'Group',
      upt_penanggung_jawab: 'UPT',
      lokasi: 'Address',
      provinsi: 'Province',
      keterangan: 'Description',
      access_shelter: 'Access Shelter',
      tipe_shelter: 'Shelter Type',
      accelerometer: 'Installation Sensor Type',
      digitizer_komunikasi: 'Communication Equipment',
      lokasi_shelter: 'Shelter Location',
      penjaga_shelter: 'Shelter Guard',
      assets_shelter: 'Assets Shelter',
      kondisi_shelter: 'Kondisi Shelter',
      penggantian_terakhir_alat: 'Last Equipment Replacement'
    };

    const label = labelMapping[field] || field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    // Special handling for different field types
    switch (field) {
      case 'net':
        return (
          <div key={field} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label}
            </label>
            <select
              value={value || ''}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Network</option>
              <option value="IA">IA</option>
              <option value="II">II</option>
            </select>
          </div>
        );

      case 'jaringan':
        return (
          <div key={field} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label}
            </label>
            {!showNewNetworkInput ? (
              <select
                value={value || ''}
                onChange={(e) => {
                  if (e.target.value === '__add_new__') {
                    setShowNewNetworkInput(true);
                    handleInputChange(field, '');
                  } else {
                    handleInputChange(field, e.target.value);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Network</option>
                {networks.map(network => (
                  <option key={network} value={network}>{network}</option>
                ))}
                <option value="__add_new__">+ Add New Network</option>
              </select>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={value || ''}
                  onChange={(e) => handleInputChange(field, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter new network name"
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowNewNetworkInput(false);
                    handleInputChange(field, '');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  ← Back to selection
                </button>
              </div>
            )}
          </div>
        );

      case 'provinsi':
        return (
          <div key={field} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label}
            </label>
            {!showNewProvinceInput ? (
              <select
                value={value || ''}
                onChange={(e) => {
                  if (e.target.value === '__add_new__') {
                    setShowNewProvinceInput(true);
                    handleInputChange(field, '');
                  } else {
                    handleInputChange(field, e.target.value);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Province</option>
                {provinces.map(province => (
                  <option key={province} value={province}>{province}</option>
                ))}
                <option value="__add_new__">+ Add New Province</option>
              </select>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={value || ''}
                  onChange={(e) => handleInputChange(field, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter new province name"
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowNewProvinceInput(false);
                    handleInputChange(field, '');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  ← Back to selection
                </button>
              </div>
            )}
          </div>
        );

      case 'upt_penanggung_jawab':
        return (
          <div key={field} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label}
            </label>
            {!showNewUptInput ? (
              <select
                value={value || ''}
                onChange={(e) => {
                  if (e.target.value === '__add_new__') {
                    setShowNewUptInput(true);
                    handleInputChange(field, '');
                  } else {
                    handleInputChange(field, e.target.value);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select UPT</option>
                {upts.map(upt => (
                  <option key={upt} value={upt}>{upt}</option>
                ))}
                <option value="__add_new__">+ Add New UPT</option>
              </select>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={value || ''}
                  onChange={(e) => handleInputChange(field, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter new UPT name"
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowNewUptInput(false);
                    handleInputChange(field, '');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  ← Back to selection
                </button>
              </div>
            )}
          </div>
        );

      case 'status':
        return (
          <div key={field} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label}
            </label>
            <select
              value={value || ''}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Status</option>
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
          </div>
        );

      case 'prioritas':
        return (
          <div key={field} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label}
            </label>
            <select
              value={value || ''}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Priority</option>
              <option value="P1">P1</option>
              <option value="P2">P2</option>
              <option value="P3">P3</option>
            </select>
          </div>
        );

      case 'accelerometer':
        return (
          <div key={field} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label}
            </label>
            <select
              value={value || ''}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Accelerometer</option>
              <option value="installed">Installed</option>
              <option value="not_installed">Not Installed</option>
            </select>
          </div>
        );

      case 'tipe_shelter':
        return (
          <div key={field} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label}
            </label>
            <select
              value={value || ''}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Shelter Type</option>
              <option value="bunker">Bunker</option>
              <option value="posthole">Posthole</option>
              <option value="surface">Surface</option>
            </select>
          </div>
        );

      case 'lokasi_shelter':
        return (
          <div key={field} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label}
            </label>
            <select
              value={value || ''}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Shelter Location</option>
              <option value="outside_BMKG_office">Outside BMKG Office</option>
              <option value="inside_BMKG_office">Inside BMKG Office</option>
            </select>
          </div>
        );

      case 'penjaga_shelter':
        return (
          <div key={field} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label}
            </label>
            <select
              value={value || ''}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Shelter Guard</option>
              <option value="ada">Ada</option>
              <option value="tidak_ada">Tidak Ada</option>
            </select>
          </div>
        );

      case 'kondisi_shelter':
        return (
          <div key={field} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label}
            </label>
            <select
              value={value || ''}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Shelter Condition</option>
              <option value="baik">Baik</option>
              <option value="rusak_ringan">Rusak Ringan</option>
              <option value="rusak_berat">Rusak Berat</option>
            </select>
          </div>
        );

      case 'digitizer_komunikasi':
        return (
          <div key={field} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label}
            </label>
            <select
              value={value || ''}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Communication Equipment</option>
              <option value="installed">Installed</option>
              <option value="not_installed">Not Installed</option>
            </select>
          </div>
        );

      case 'keterangan':
        return (
          <div key={field} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label}
            </label>
            <textarea
              value={value || ''}
              onChange={(e) => handleInputChange(field, e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter description..."
            />
          </div>
        );

      case 'penggantian_terakhir_alat':
        return (
          <div key={field} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label}
            </label>
            <input
              type="datetime-local"
              value={value ? new Date(value).toISOString().slice(0, 16) : ''}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        );

      case 'access_shelter':
        return (
          <div key={field} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label}
            </label>
            <textarea
              value={value || ''}
              onChange={(e) => handleInputChange(field, e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter shelter access information..."
            />
          </div>
        );

      case 'assets_shelter':
        return (
          <div key={field} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label}
            </label>
            <textarea
              value={value || ''}
              onChange={(e) => handleInputChange(field, e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter shelter assets information..."
            />
          </div>
        );

      default:
        // Handle numeric fields
        if (['lintang', 'bujur', 'elevasi', 'tahun_instalasi', 'provinsi_id', 'upt', 'jaringan_id'].includes(field)) {
          return (
            <div key={field} className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}
              </label>
              <input
                type="number"
                value={value || ''}
                onChange={(e) => handleInputChange(field, parseFloat(e.target.value) || e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`Enter ${label.toLowerCase()}`}
              />
            </div>
          );
        }

        // Default text input
        return (
          <div key={field} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label}
            </label>
            <input
              type="text"
              value={value || ''}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={`Enter ${label.toLowerCase()}`}
            />
          </div>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fieldsToEdit.map(field => renderField(field))}
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditStationModal;