import { HelpCircle } from "lucide-react";
import { useState } from "react";
import Button from "../Button.jsx";
import GuidedTutorial from "./GuidedTutorial.jsx";

const TutorialLauncher = ({ pageKey, steps = [], autoStart = false, label = "Quick Tour", variant = "secondary" }) => {
  const [launchToken, setLaunchToken] = useState(0);

  if (!steps.length) return null;

  return (
    <>
      <Button type="button" variant={variant} onClick={() => setLaunchToken((value) => value + 1)}>
        <HelpCircle className="h-4 w-4" />
        {label}
      </Button>
      <GuidedTutorial active={launchToken > 0} autoStart={autoStart} pageKey={pageKey} steps={steps} />
    </>
  );
};

export default TutorialLauncher;
