import { useCallback } from "react";
import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import type {
  PortfolioFormState,
  PortfolioKey,
  SimplePortfolioKey,
} from "../types";

export const usePortfolioFormHandlers = (
  setFormState: Dispatch<SetStateAction<PortfolioFormState>>,
  resetPortfolio: () => void,
) => {
  const handleSimpleChange = useCallback(
    (key: SimplePortfolioKey) =>
      (event: ChangeEvent<HTMLInputElement>) => {
        const raw = event.target.value;
        const value =
          raw === "" ? 0 : Number.parseFloat(raw.replace(/,/g, ""));

        if (Number.isNaN(value)) {
          return;
        }

        setFormState((prev) => ({
          ...prev,
          simple: {
            ...prev.simple,
            [key]: value,
          },
        }));
      },
    [setFormState],
  );

  const handleAdvancedChange = useCallback(
    (key: PortfolioKey) =>
      (event: ChangeEvent<HTMLInputElement>) => {
        const raw = event.target.value;
        const value =
          raw === ""
            ? undefined
            : Number.parseFloat(raw.replace(/,/g, ""));

        if (value !== undefined && Number.isNaN(value)) {
          return;
        }

        setFormState((prev) => {
          const nextAdvanced = { ...prev.advanced };
          if (value === undefined) {
            delete nextAdvanced[key];
          } else {
            nextAdvanced[key] = value;
          }

          return {
            ...prev,
            advanced: nextAdvanced,
          };
        });
      },
    [setFormState],
  );

  const handleResetPortfolio = useCallback(() => {
    resetPortfolio();
  }, [resetPortfolio]);

  return {
    handleSimpleChange,
    handleAdvancedChange,
    handleResetPortfolio,
  };
};
