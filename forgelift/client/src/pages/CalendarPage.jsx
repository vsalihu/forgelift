import { useCallback, useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout.jsx";
import DayDetailSheet from "../components/calendar/DayDetailSheet.jsx";
import GeneratePlanModal from "../components/calendar/GeneratePlanModal.jsx";
import MonthGrid from "../components/calendar/MonthGrid.jsx";
import PlanPanel from "../components/calendar/PlanPanel.jsx";
import UpNext from "../components/calendar/UpNext.jsx";
import { addDaysToKey, todayKey } from "../components/calendar/calendarUtils.js";
import ErrorState from "../components/ui/ErrorState.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import { calendarService } from "../services/calendarService.js";
import { trainingPlanService } from "../services/trainingPlanService.js";

const currentCursor = () => {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
};

const monthOf = (key) => ({ year: Number(key.slice(0, 4)), month: Number(key.slice(5, 7)) });

const CalendarPage = () => {
  const [cursor, setCursor] = useState(currentCursor);
  const [days, setDays] = useState([]);
  const [agendaDays, setAgendaDays] = useState([]);
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

  // The next 7 days can cross into next month, so they load on their own.
  const loadAgenda = useCallback(async () => {
    const today = todayKey();
    const months = [monthOf(today), monthOf(addDaysToKey(today, 6))].filter((value, index, list) => index === 0 || value.month !== list[0].month);
    try {
      const results = await Promise.all(months.map(({ year, month }) => calendarService.getMonth(year, month)));
      setAgendaDays(results.flatMap((data) => data.days || []));
    } catch (_error) {
      // The month grid shows the error; the strip just stays empty.
    }
  }, []);

  const loadPlanStatus = async () => {
    try {
      setPlanStatus(await trainingPlanService.getStatus());
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadMonth(cursor.year, cursor.month);
  }, [cursor]);

  useEffect(() => {
    loadPlanStatus();
    loadAgenda();
  }, [loadAgenda]);

  const daysByDate = useMemo(() => new Map(days.map((day) => [day.date, day])), [days]);
  const agendaByDate = useMemo(() => new Map(agendaDays.map((day) => [day.date, day])), [agendaDays]);
  const selectedData = selectedDate ? daysByDate.get(selectedDate) || agendaByDate.get(selectedDate) : null;

  const goToMonth = (delta) =>
    setCursor((current) => {
      const next = new Date(current.year, current.month - 1 + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() + 1 };
    });

  const refreshAll = () => Promise.all([loadPlanStatus(), loadMonth(cursor.year, cursor.month), loadAgenda()]);

  const runPlanAction = async (action) => {
    if (!planStatus?.activePlan) return;
    setPlanBusy(true);
    setError("");
    try {
      await action(planStatus.activePlan._id);
      await refreshAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setPlanBusy(false);
    }
  };

  const handleGenerate = async ({ durationWeeks }) => {
    setGenerating(true);
    setError("");
    try {
      await trainingPlanService.generate(durationWeeks);
      setGenerateOpen(false);
      await refreshAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleDaySaved = async () => {
    setSelectedDate(null);
    await refreshAll();
  };

  return (
    <Layout>
      <div className="mx-auto max-w-5xl">
        <PageHeader
          description="Plan training, rest and treatment days, or let ForgeLift build your next few weeks. Tap any day to change it."
          eyebrow="Calendar"
          title="Your training month"
        />

        {error ? <ErrorState message={error} /> : null}

        <UpNext daysByDate={agendaByDate} onSelectDate={setSelectedDate} />

        <PlanPanel
          busy={planBusy}
          planStatus={planStatus}
          onCancelPlan={() => runPlanAction(trainingPlanService.cancel)}
          onGenerateClick={() => setGenerateOpen(true)}
          onRegenerateRemainder={() => runPlanAction(trainingPlanService.regenerateRemainder)}
        />

        <MonthGrid
          daysByDate={daysByDate}
          loading={loading}
          month={cursor.month}
          year={cursor.year}
          onNextMonth={() => goToMonth(1)}
          onPrevMonth={() => goToMonth(-1)}
          onSelectDate={setSelectedDate}
          onToday={() => setCursor(currentCursor())}
        />
      </div>

      <DayDetailSheet date={selectedDate} dayData={selectedData} onClose={() => setSelectedDate(null)} onSaved={handleDaySaved} />
      <GeneratePlanModal open={generateOpen} submitting={generating} onClose={() => setGenerateOpen(false)} onSubmit={handleGenerate} />
    </Layout>
  );
};

export default CalendarPage;
