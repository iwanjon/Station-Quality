import React, { useState } from 'react';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { DROPDOWN_OPTIONS, getDropdownOptions } from '../config/dropdownOptions';

interface FieldGuidelinesProps {
  showInstructions?: boolean;
}

const FieldGuidelines: React.FC<FieldGuidelinesProps> = ({
  showInstructions = true
}) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!showInstructions) return null;

  // Generate field value guidelines from dropdownOptions config
  const generateFieldGuidelines = () => {
    const categories = {
      'Network & Status': ['net', 'status', 'prioritas'],
      'Equipment': ['accelerometer', 'digitizer_komunikasi'],
      'Shelter Type': ['tipe_shelter'],
      'Shelter Details': ['lokasi_shelter', 'penjaga_shelter', 'kondisi_shelter']
    };

    return Object.entries(categories).map(([categoryName, fields]) => (
      <div key={categoryName}>
        <p className="font-medium text-green-700 mb-1">{categoryName}:</p>
        <ul className="text-green-600 space-y-0.5">
          {fields.map(field => {
            const options = getDropdownOptions(field as keyof typeof DROPDOWN_OPTIONS);
            const optionLabels = options.map(opt => `"${opt.label}"`).join(', ');
            return (
              <li key={field}>
                <strong>{field.replace(/_/g, ' ')}:</strong> {optionLabels}
              </li>
            );
          })}
        </ul>
      </div>
    ));
  };

  return (
    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-start gap-2">
        <FileText size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1 text-sm text-blue-700">
          <div className="flex items-center justify-between">
            <p className="font-medium">How to create stations</p>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors text-xs"
            >
              {showDetails ? (
                <>
                  <span>Hide details</span>
                  <ChevronUp size={14} />
                </>
              ) : (
                <>
                  <span>Show details</span>
                  <ChevronDown size={14} />
                </>
              )}
            </button>
          </div>

          {showDetails && (
            <div className="mt-2">
              <ol className="list-decimal list-inside space-y-1 mb-3">
                <li>Download the CSV template</li>
                <li>Fill in the station data following the format</li>
                <li>Remove or modify the sample row (marked with is_sample=true)</li>
                <li>Save the file and import it back</li>
                <li>The system will validate and create the stations (sample rows are automatically skipped)</li>
              </ol>

              {/* Foreign Key Guidelines */}
              <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                <p className="font-medium text-yellow-800 mb-1">⚠️ Important: Foreign Key Guidelines</p>
                <ul className="text-xs text-yellow-700 space-y-1">
                  <li><strong>provinsi:</strong> Must match exactly with province names in database (e.g., "DKI Jakarta", "Jawa Barat", "Sumatera Utara")</li>
                  <li><strong>upt_penanggung_jawab:</strong> Must match exactly with UPT names (e.g., "UPT Jakarta", "UPT Bandung", "UPT Medan")</li>
                  <li><strong>jaringan:</strong> Must match network names (e.g., "BMKG", "IA", "GE")</li>
                  <li>❌ If names don't match exactly, the station creation will fail</li>
                  <li>💡 Check existing data in the system for correct naming</li>
                </ul>
              </div>

              {/* Field Value Guidelines - Generated from dropdownOptions */}
              <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
                <p className="font-medium text-green-800 mb-2">📋 Field Value Guidelines</p>
                <div className="grid md:grid-cols-2 gap-4 text-xs">
                  {generateFieldGuidelines()}
                </div>
                <p className="text-xs text-green-600 mt-2 italic">
                  💡 Use these exact values (case-sensitive) to ensure data consistency
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FieldGuidelines;