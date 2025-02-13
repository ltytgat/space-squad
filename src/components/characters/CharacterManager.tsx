import React, { useState } from 'react';
import CharacterList from './CharacterList';
import CharacterSheet from './CharacterSheet';

export default function CharacterManager() {
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateNew = () => {
    setIsCreating(true);
  };

  const handleBack = () => {
    setSelectedCharacter(null);
    setIsCreating(false);
  };

  if (selectedCharacter) {
    return (
      <CharacterSheet
        character={selectedCharacter}
        onBack={handleBack}
        readOnly={true}
      />
    );
  }

  return (
    <CharacterList
      onCreateNew={handleCreateNew}
      onSelect={setSelectedCharacter}
    />
  );
}