import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout.jsx";
import AdviceHero from "../components/advice/AdviceHero.jsx";
import EmptyPanel from "../components/advice/EmptyPanel.jsx";
import Explainer from "../components/advice/Explainer.jsx";
import LoadingBlocks from "../components/advice/LoadingBlocks.jsx";
import ScopeToggle from "../components/advice/ScopeToggle.jsx";
import StatusChip from "../components/advice/StatusChip.jsx";
import LoadMap from "../components/trainingLoad/LoadMap.jsx";
import TrainingLoadRow from "../components/trainingLoad/TrainingLoadRow.jsx";
import { QUADRANTS, quadrantFor } from "../components/trainingLoad/quadrants.js";
import { TrainingLoadIcon } from "../components/icons/navIcons.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import { trainingLoadService } from "../services/trainingLoadService.js";

const BROAD = ["Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Glutes", "Full Body"];

const SECTIONS = [
  { key: "attention", title: "Needs attention", quadrants: ["Fatigued Without Gains", "Overreaching"] },
  { key: "progress", title: "Progressing", quadrants: ["Real Progress"] },
  { key: "steady", title: "Holding or backing off", quadrants: ["Maintaining", "Detraining"] }
];

const headline = (counts) => {
  if (counts["Fatigued Without Gains"]) return { text: "Some muscles are working hard without getting stronger.", tone: "text-red-300" };
  if (counts.Overreaching) return { text: "You're progressing, but pushing some muscles past a safe load.", tone: "text-amber-200" };
  if (counts["Real Progress"]) return { text: "Your load is sustainable and strength is climbing.", tone: "text-emerald-300" };
  return { text: "Load and strength are holding steady.", tone: "text-zinc-200" };
};

const TrainingLoadPage = () => {
  const [trainingLoad, setTrainingLoad] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detailed, setDetailed] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await trainingLoadService.getTrainingLoad();
      setTrainingLoad(data.trainingLoad || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const { withData, noData, counts } = useMemo(() => {
    const inScope = detailed ? trainingLoad : trainingLoad.filter((item) => BROAD.includes(item.muscleGroup));
    const available = inScope.filter((item) => item.dataAvailable);
    const tally = {};
    trainingLoad.filter((item) => item.dataAvailable).forEach((item) => {
      tally[item.quadrant] = (tally[item.quadrant] || 0) + 1;
    });
    return { withData: available, noData: inScope.filter((item) => !item.dataAvailable), counts: tally };
  }, [trainingLoad, detailed]);

  const hasAny = trainingLoad.some((item) => item.dataAvailable);
  const lead = headline(counts);

  return (
    <Layout>
      <div className="mx-auto max-w-5xl">
        <PageHeader
          description="How hard each muscle is being pushed compared with its usual week, and whether that effort is making it stronger."
          eyebrow="Training load"
          title="Is the work paying off?"
        />

        {error ? <ErrorState message={error} onRetry={load} /> : null}
        {loading ? <LoadingBlocks label="Loading training load" /> : null}

        {!loading && !error && !hasAny ? (
          <EmptyPanel icon={TrainingLoadIcon} title="Not enough history yet.">
            Log a few weeks of workouts so ForgeLift can compare your recent load with your normal pattern.
          </EmptyPanel>
        ) : null}

        {!loading && hasAny ? (
          <>
            <AdviceHero>
              <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-center">
                <div>
                  <p className="text-sm font-semibold text-orange-300">This month</p>
                  <h2 className={`font-display mt-1 text-3xl leading-tight sm:text-4xl ${lead.tone}`}>{lead.text}</h2>
                  <ul className="mt-5 flex flex-wrap gap-2">
                    {Object.entries(QUADRANTS)
                      .filter(([name]) => counts[name])
                      .map(([name, meta]) => (
                        <li key={name}>
                          <StatusChip icon={meta.icon} tone={meta.tone}>
                            {counts[name]} {meta.label.toLowerCase()}
                          </StatusChip>
                        </li>
                      ))}
                  </ul>
                </div>
                <LoadMap items={withData} />
              </div>
            </AdviceHero>

            <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-2xl text-white">By muscle</h2>
              <ScopeToggle detailed={detailed} onChange={setDetailed} />
            </div>

            {SECTIONS.map((section) => {
              const items = withData
                .filter((item) => section.quadrants.includes(item.quadrant))
                .sort((a, b) => quadrantFor(a.quadrant).order - quadrantFor(b.quadrant).order);
              if (!items.length) return null;
              return (
                <section aria-labelledby={`load-${section.key}`} className="mt-6" key={section.key}>
                  <h3 className="mb-3 text-base font-bold text-white" id={`load-${section.key}`}>
                    {section.title} <span className="font-normal tabular-nums text-zinc-500">{items.length}</span>
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((item) => (
                      <TrainingLoadRow item={item} key={item.muscleGroup} />
                    ))}
                  </div>
                </section>
              );
            })}

            {noData.length ? (
              <div className="mt-6 rounded-3xl border border-dashed border-white/12 p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-zinc-200">Not enough data yet</h3>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {noData.map((item) => (
                    <li className="rounded-full border border-white/10 px-3 py-1 text-sm text-zinc-400" key={item.muscleGroup}>
                      {item.muscleGroup}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <Explainer
              className="mt-8"
              items={[
                ["Load ratio", "Your last 7 days of work divided by your usual week. 0.8 to 1.3 is the sweet spot; above 1.5 is a risky jump."],
                ["Strength trend", "How your estimated max on this muscle's lifts has moved over about two months."],
                ["Recovery vs load", "Recovery says whether a muscle is ready today. Load looks further back at whether the pattern is sustainable."],
                ["Fatigued, no gains", "High load but strength flat or falling. Usually a sign to back off for a week."]
              ]}
            />
          </>
        ) : null}
      </div>
    </Layout>
  );
};

export default TrainingLoadPage;
