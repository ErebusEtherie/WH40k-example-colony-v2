import { Colony, CustomModifierItem } from '../types';
import { apiClient } from '../utils/apiClient';
import { UseMutateFunction } from '@tanstack/react-query';

interface UseColonyActionsParams {
  currentColony: Colony | undefined;
  colonies: Colony[];
  selectedColonyId: string | null;
  setSelectedColonyId: (id: string | null) => void;
  updateColonyMutate: UseMutateFunction<Colony, Error, { colonyId: number; data: Partial<Colony> }>;
  deleteColonyMutate: UseMutateFunction<void, Error, number>;
  assignRepresentativeMutate: UseMutateFunction<void, Error, { colonyId: number; representativeId: number | null }>;
}

export interface UseColonyActionsReturn {
  handleUpdateColony: (updatedFields: Partial<Colony>) => void;
  handleAdvanceDays: (days: number) => void;
  handleDeleteColony: (colonyId: string) => void;
  handleAssignRepresentative: (colonyId: string, repId: string | null) => void;
  handleAddCustomModifier: (newMod: CustomModifierItem) => void;
  handleResetToSeedData: () => void;
}

export const useColonyActions = ({
  currentColony,
  colonies,
  selectedColonyId,
  setSelectedColonyId,
  updateColonyMutate,
  deleteColonyMutate,
  assignRepresentativeMutate,
}: UseColonyActionsParams): UseColonyActionsReturn => {
  const handleUpdateColony = (updatedFields: Partial<Colony>) => {
    if (!currentColony) return;
    updateColonyMutate(
      { colonyId: Number(currentColony.id), data: updatedFields },
      {
        onError: (e: Error) => {
          console.warn('Backend update failed:', e);
        },
      }
    );
  };

  const handleAdvanceDays = (days: number) => {
    if (!currentColony) return;
    handleUpdateColony({ ageDays: currentColony.ageDays + days });
  };

  const handleDeleteColony = (colonyId: string) => {
    if (colonies.length <= 1) return;
    if (selectedColonyId === colonyId) {
      const remaining = colonies.find((c: Colony) => c.id !== colonyId);
      setSelectedColonyId(remaining?.id || null);
    }
    deleteColonyMutate(Number(colonyId));
  };

  const handleAssignRepresentative = (colonyId: string, repId: string | null) => {
    assignRepresentativeMutate(
      { colonyId: Number(colonyId), representativeId: repId ? Number(repId) : null },
      {
        onError: (e: Error) => {
          console.warn('Backend assign representative error:', e);
        },
      }
    );
  };

  const handleAddCustomModifier = (newMod: CustomModifierItem) => {
    if (!currentColony) return;
    apiClient.addModifier(currentColony.id, newMod).catch((e: Error) => {
      console.warn('Backend add modifier error:', e);
    });
  };

  const handleResetToSeedData = () => {
    if (window.confirm('Reset all colony data and representatives back to initial Imperial seed data?')) {
      console.warn('Reset to seed data not yet implemented on backend');
    }
  };

  return {
    handleUpdateColony,
    handleAdvanceDays,
    handleDeleteColony,
    handleAssignRepresentative,
    handleAddCustomModifier,
    handleResetToSeedData,
  };
};