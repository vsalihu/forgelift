import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import CalendarGrid from "../components/calendar/CalendarGrid.jsx";
import DayDetailSheet from "../components/calendar/DayDetailSheet.jsx";
import GeneratePlanModal from "../components/calendar/GeneratePlanModal.jsx";
import PlanPanel from "../components/calendar/PlanPanel.jsx";
import { calendarService } from "../services/calendarService.js";
import { trainingPlanService } from "../services/trainingPlanService.js";

const currentCursor = () => {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
};

const CalendarPage = () => {
  const [cursor, setCursor] = useState(currentCursor);
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [planStatus, setPlanStatus] = useState(null);
  const [planBusy, setPlanBusy] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const loadMonth = async (year, month) => {
    setLoading(true);
    try {
      const data = await calendarService.getMonth(year, month);
      setDays(data.days || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPlanStatus = async () => {
    try {
      const data = await trainingPlanService.getStatus();
      setPlanStatus(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadMonth(cursor.year, cursor.month);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor]);

  useEffect(() => {
    loadPlanStatus();
  }, []);

  const daysByDate = useMemo(() => new Map(days.map((day) => [day.date, day])), [days]);

  const goToMonth = (delta) => {
    setCursor((current) => {
      const next = new Date(Date.UTC(current.year, current.month - 1 + delta, 1));
      return { year: next.getUTCFullYear(), month: next.getUTCMonth() + 1 };
    });
  };

  const handleGenerate = async ({ durationWeeks }) => {
    setGenerating(true);
    setError("");
    try {
      await trainingPlanService.generate(durationWeeks);
      setGenerateOpen(false);
      await Promise.all([loadPlanStatus(), loadMonth(cursor.year, cursor.month)]);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerateRemainder = async () => {
    if (!planStatus?.activePlan) return;
    setPlanBusy(true);
    setError("");
    try {
      await trainingPlanService.regenerateRemainder(planStatus.activePlan._id);
      await Promise.all([loadPlanStatus(), loadMonth(cursor.year, cursor.month)]);
    } catch (err) {
      setError(err.message);
    } finally {
      setPlanBusy(false);
    }
  };

  const handleCancelPlan = async () => {
    if (!planStatus?.activePlan) return;
    setPlanBusy(true);
    setError("");
    try {
      await trainingPlanService.cancel(planStatus.activePlan._id);
      await Promise.all([loadPlanStatus(), loadMonth(cursor.year, cursor.month)]);
    } catch (err) {
      setError(err.message);
    } finally {
      setPlanBusy(false);
    }
  };

  const handleDaySaved = async () => {
    setSelectedDate(null);
    await Promise.all([loadMonth(cursor.year, cursor.month), loadPlanStatus()]);
  };

  return (
    <Layout>
      <PageHeader
        eyebrow="Training"
        title="Calendar"
        description="Plan your training, track rest and treatment days, and let ForgeLift build your next few weeks."
      />

      {error ? <div className="mb-5 rounded-md bg-red-500/10 p-3 text-sm text-red-200">{error}</div> : null}

      <PlanPanel
        planStatus={planStatus}
        busy={planBusy}
        onGenerateClick={() => setGenerateOpen(true)}
        onRegenerateRemainder={handleRegenerateRemainder}
        onCancelPlan={handleCancelPlan}
      />

      <CalendarGrid
        year={cursor.year}
        month={cursor.month}
        daysByDate={daysByDate}
        loading={loading}
        onPrevMonth={() => goToMonth(-1)}
        onNextMonth={() => goToMonth(1)}
        onToday={() => setCursor(currentCursor())}
        onSelectDate={setSelectedDate}
      />

      <DayDetailSheet
        date={selectedDate}
        dayData={selectedDate ? daysByDate.get(selectedDate) : null}
        onClose={() => setSelectedDate(null)}
        onSaved={handleDaySaved}
      />

      <GeneratePlanModal open={generateOpen} submitting={generating} onClose={() => setGenerateOpen(false)} onSubmit={handleGenerate} />
    </Layout>
  );
};

export default CalendarPage;
