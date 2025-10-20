import "./App.css";
import { AppStateProvider, useAppState } from "./state/AppStateContext";
import Dashboard from "./components/dashboard/Dashboard";
import OnboardingFlow from "./components/onboarding/OnboardingFlow";

const AppContent = () => {
  const { isHydrated, onboardingComplete } = useAppState();

  if (!isHydrated) {
    return null;
  }

  return onboardingComplete ? <Dashboard /> : <OnboardingFlow />;
};

function App() {
  return (
    <AppStateProvider>
      <AppContent />
    </AppStateProvider>
  );
}

export default App;
