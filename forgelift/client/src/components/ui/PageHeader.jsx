import TutorialLauncher from "../tutorial/TutorialLauncher.jsx";
import { getTutorialSteps } from "../../tutorials/tutorialConfig.js";

const PageHeader = ({ eyebrow, title, description, actions, tutorialPageKey, tutorialAutoStart = false }) => (
  <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
    <div className="min-w-0">
      {eyebrow ? <p className="text-sm font-semibold text-orange-300">{eyebrow}</p> : null}
      <h1 className="font-display mt-1 text-3xl leading-tight text-white [text-wrap:balance] sm:text-4xl">{title}</h1>
      {description ? <p className="mt-3 max-w-3xl text-base leading-7 text-zinc-400">{description}</p> : null}
    </div>
    {actions || tutorialPageKey ? (
      <div className="flex flex-wrap gap-2">
        {tutorialPageKey ? (
          <TutorialLauncher autoStart={tutorialAutoStart} pageKey={tutorialPageKey} steps={getTutorialSteps(tutorialPageKey)} />
        ) : null}
        {actions}
      </div>
    ) : null}
  </div>
);

export default PageHeader;
