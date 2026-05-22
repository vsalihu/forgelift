import { useEffect, useState } from "react";
import Button from "../components/Button.jsx";
import Layout from "../components/Layout.jsx";
import BalanceRatioCard from "../components/trainingBalance/BalanceRatioCard.jsx";
import BalanceWarningList from "../components/trainingBalance/BalanceWarningList.jsx";
import TrainingBalanceScoreCard from "../components/trainingBalance/TrainingBalanceScoreCard.jsx";
import HelpTooltip from "../components/ui/HelpTooltip.jsx";
import TutorialLauncher from "../components/tutorial/TutorialLauncher.jsx";
import { trainingBalanceService } from "../services/trainingBalanceService.js";
import { helpText } from "../utils/helpText.js";
import { getTutorialSteps } from "../tutorials/tutorialConfig.js";

const TrainingBalancePage = () => {
  const [trainingBalance, setTrainingBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState("");

  const loadTrainingBalance = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await trainingBalanceService.getTrainingBalance();
      setTrainingBalance(data.trainingBalance);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrainingBalance();
  }, []);

  const recalculate = async () => {
    setRecalculating(true);
    setError("");

    try {
      const data = await trainingBalanceService.recalculateTrainingBalance();
      setTrainingBalance(data.trainingBalance);
    } catch (err) {
      setError(err.message);
    } finally {
      setRecalculating(false);
    }
  };

  return (
    <Layout>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-forge-copper">Training Balance</p>
          <h1 className="mt-2 flex items-center gap-2 text-3xl font-black text-white">
            Balance score <HelpTooltip {...helpText.trainingBalance} />
          </h1>
        </div>
        <Button loading={recalculating} onClick={recalculate}>
          Recalculate balance
        </Button>
        <TutorialLauncher pageKey="training_balance" steps={getTutorialSteps("training_balance")} />
      </div>

      {loading ? <p className="text-forge-steel">Loading training balance...</p> : null}
      {error ? <div className="mb-6 rounded-md bg-red-500/10 p-3 text-sm text-red-200">{error}</div> : null}

      {trainingBalance ? (
        <>
          <div data-tour-id="training-balance-overview">
            <TrainingBalanceScoreCard trainingBalance={trainingBalance} />
          </div>
          <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <BalanceRatioCard title="Push/Pull" value={trainingBalance.pushPullRatio} description="Compares pressing muscles like chest and triceps against pulling muscles like back and biceps." />
            <BalanceRatioCard title="Upper/Lower" value={trainingBalance.upperLowerRatio} description="Compares upper-body work to lower-body work." />
            <BalanceRatioCard title="Front/Rear" value={trainingBalance.frontRearRatio} description="Compares front-chain work to rear-chain work." />
            <BalanceRatioCard title="Direct/Indirect" value={trainingBalance.directIndirectRatio} description="Compares direct muscle work to indirect carryover." />
          </section>
          <section className="mt-6 grid gap-4 lg:grid-cols-2">
            <BalanceWarningList title="Warnings" items={trainingBalance.warnings || []} />
            <BalanceWarningList title="Recommendations" tone="recommendation" items={trainingBalance.recommendations || []} />
          </section>
          <section className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="metal-panel rounded-lg p-5">
              <h2 className="text-xl font-bold text-white">Strongest areas</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {(trainingBalance.strongestAreas || []).map((area) => (
                  <span className="rounded-full bg-green-500/10 px-3 py-1 text-sm font-semibold text-green-200" key={area}>
                    {area}
                  </span>
                ))}
              </div>
            </div>
            <div className="metal-panel rounded-lg p-5">
              <h2 className="text-xl font-bold text-white">Weakest areas</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {(trainingBalance.weakestAreas || []).map((area) => (
                  <span className="rounded-full bg-orange-500/10 px-3 py-1 text-sm font-semibold text-orange-200" key={area}>
                    {area}
                  </span>
                ))}
              </div>
            </div>
          </section>
        </>
      ) : null}
    </Layout>
  );
};

export default TrainingBalancePage;
