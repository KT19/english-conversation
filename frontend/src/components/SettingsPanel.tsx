import { ProficiencyLevel } from "../types";

interface SettingsPanelProps {
  proficiencyLevel: ProficiencyLevel;
  onLevelChange: (level: ProficiencyLevel) => void;
  onClearConversation: () => void;
}

const SettingsPanel = ({
  proficiencyLevel,
  onLevelChange,
  onClearConversation,
}: SettingsPanelProps) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <h2 className="text-lg font-semibold mb-3">Settings</h2>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Proficiency Level
        </label>
        <div className="flex space-x-2">
          {["Beginner", "Intermediate", "Advanced"].map((level) => (
            <button
              key={level}
              onClick={() => onLevelChange(level as ProficiencyLevel)}
              className={`px-4 py-2 rounded-md ${
                proficiencyLevel === level
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              } transition-colors duration-200`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onClearConversation}
        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
      >
        Clear Conversation
      </button>
    </div>
  );
};

export default SettingsPanel;
