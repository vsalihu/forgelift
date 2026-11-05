import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Settings2 } from "lucide-react";
import { useState } from "react";
import Layout from "../components/Layout.jsx";
import AmountSheet from "../components/daily/AmountSheet.jsx";
import CustomTodosCard from "../components/daily/CustomTodosCard.jsx";
import TodoEditorSheet from "../components/daily/TodoEditorSheet.jsx";
import { countStep } from "../components/daily/customTodoMeta.js";
import DailyCheckInModal from "../components/daily/DailyCheckInModal.jsx";
import DailySetupFlow from "../components/daily/DailySetupFlow.jsx";
import ProgressRing from "../components/daily/ProgressRing.jsx";
import { Card, MacroCard, MealsCard, ReasonsCard, SleepCard, SupplementsCard, TipsList, WaterCard } from "../components/daily/TodayCards.jsx";
import { MacroIcon, SupplementIcon } from "../components/icons/featureIcons.jsx";
import { GymModeIcon } from "../components/icons/navIcons.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import LoadingSkeleton from "../components/ui/LoadingSkeleton.jsx";
import { useDaily } from "../context/DailyContext.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { formatDayLong, formatHours, fromDisplayWater, greeting, toDisplayWater, waterUnits } from "../utils/dailyUtils.js";

const EASE = [0.16, 1, 0.3, 1];
const ENERGY_LABEL = { 1: "Drained", 2: "Low", 3: "OK", 4: "Good", 5: "Great" };
const SOURCE_LABEL = { logged: "workout logged", planned: "from your calendar", checkin: "from your check-in", rest: "from your calendar" };

const WeekStrip = ({ week, today }) => (
  <ol aria-label="Last 7 days" className="grid grid-cols-7 gap-1.5">
    {week.map((entry) => {
      const ratio = entry.total ? entry.done / entry.total : 0;
      const isToday = entry.day === today;
      const letter = new Date(`${entry.day}T12:00:00`).toLocaleDateString("en-US", { weekday: "narrow" });
      return (
        <li className="flex flex-col items-center gap-1.5" key={entry.day}>
          <span aria-hidden="true" className="relative flex h-12 w-full max-w-9 items-end overflow-clip rounded-lg bg-white/[0.06]">
            <span className={`block w-full rounded-lg ${ratio >= 1 ? "bg-emerald-400" : "bg-gradient-to-t from-forge-ember to-orange-300"}`} style={{ height: `${Math.max(ratio ? 10 : 0, ratio * 100)}%` }} />
          </span>
          <span className={`text-xs font-bold ${isToday ? "text-orange-200" : "text-zinc-500"}`}>{letter}</span>
          <span className="sr-only">
            {entry.day}: {entry.total ? `${entry.done} of ${entry.total} done` : "no data"}
          </span>
        </li>
      );
    })}
  </ol>
);

const TodayPage = () => {
  const reduce = useReducedMotion();
  const { user } = useAuth();
  const { data, loading, error, load, update, saveProfile, createTodo, updateTodo, deleteTodo } = useDaily() || {};
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [todoEditor, setTodoEditor] = useState(null);
  const [customAmount, setCustomAmount] = useState(null);
  const [actionError, setActionError] = useState("");
  const imperial = user?.preferredUnits === "imperial";

  const run = (body) => {
    setActionError("");
    return update(body).catch((err) => setActionError(err.message));
  };

  if (!data) {
    return (
      <Layout>
        <div className="mx-auto max-w-3xl">
          {error && !loading ? <ErrorState message={error} onRetry={load} /> : <LoadingSkeleton rows={4} />}
        </div>
      </Layout>
    );
  }

  const { plan, todos, totals, completion, log, week, day } = data;
  const todo = (key) => todos.find((item) => item.key === key);
  const ratio = completion.total ? completion.done / completion.total : 0;
  const allDone = completion.total > 0 && completion.done === completion.total;
  const checkIn = log?.checkIn;
  const units = waterUnits(imperial);
  const editingTodo = editing ? todo(editing) : null;
  const setupUnfinished = !data.profile?.completedAt;

  const toggleMeal = (index) => {
    const meals = Array.from({ length: plan.meals.count }, (_, i) => Boolean(log?.meals?.[i]?.done));
    meals[index] = !meals[index];
    run({ meals });
  };

  const rise = (delay = 0) => (reduce ? {} : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay, ease: EASE } });

  return (
    <Layout>
      <div className="mx-auto max-w-5xl">
        {/* Hero */}
        <motion.section {...rise()} className="relative mb-5 overflow-clip rounded-[2rem] border border-white/[0.08] bg-[#0d0e12] p-5 sm:p-7">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: allDone ? "radial-gradient(80% 120% at 0% 0%, rgba(16,185,129,0.18), transparent 60%)" : "radial-gradient(80% 120% at 0% 0%, rgba(249,115,22,0.2), transparent 60%)" }} />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
            <ProgressRing done={allDone} size={132} stroke={11} value={ratio}>
              <span className="font-display text-3xl tabular-nums text-white">
                {completion.done}
                <span className="text-lg text-zinc-500">/{completion.total}</span>
              </span>
              <span className={`text-xs font-bold ${allDone ? "text-emerald-300" : "text-zinc-400"}`}>{allDone ? "Day complete" : "done"}</span>
            </ProgressRing>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-orange-300">{formatDayLong(day)}</p>
              <h1 className="font-display mt-1 text-3xl leading-tight text-white sm:text-4xl">
                {greeting()}
                {user?.name ? `, ${user.name.split(" ")[0]}` : ""}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-bold ${plan.isTrainingDay ? "bg-orange-500/15 text-orange-100" : "bg-white/[0.06] text-zinc-300"}`}>
                  {plan.isTrainingDay ? <GymModeIcon aria-hidden="true" className="h-4 w-4" /> : null}
                  {plan.isTrainingDay ? "Training day" : "Rest day"}
                </span>
                {SOURCE_LABEL[plan.trainingSource] ? <span className="text-xs text-zinc-500">{SOURCE_LABEL[plan.trainingSource]}</span> : null}
              </div>
              {checkIn?.at ? (
                <p className="mt-3 text-sm text-zinc-400">
                  {[
                    checkIn.sleepHours !== null && checkIn.sleepHours !== undefined ? `Slept ${formatHours(checkIn.sleepHours)}` : null,
                    checkIn.energy ? `Energy ${ENERGY_LABEL[checkIn.energy].toLowerCase()}` : null,
                    checkIn.morningWeight ? `${checkIn.morningWeight} ${imperial ? "lb" : "kg"}` : null
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  className={`min-h-11 rounded-full px-5 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
                    checkIn?.at ? "border border-white/12 bg-white/[0.05] text-white hover:bg-white/[0.09]" : "bg-gradient-to-b from-orange-400 to-forge-ember text-[#160a02] shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]"
                  }`}
                  type="button"
                  onClick={() => setModal(setupUnfinished ? "setup" : "checkin")}
                >
                  {setupUnfinished ? "Set up my plan" : checkIn?.at ? "Update check-in" : "Check in"}
                </button>
                {setupUnfinished ? null : (
                  <button className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-4 text-sm font-bold text-white transition-colors hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200" type="button" onClick={() => setModal("settings")}>
                    <Settings2 aria-hidden="true" className="h-4 w-4" />
                    Plan settings
                  </button>
                )}
              </div>
            </div>
            <div className="sm:w-56">
              <WeekStrip today={day} week={week} />
            </div>
          </div>
        </motion.section>

        {actionError ? (
          <p className="mb-4 rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-100" role="alert">
            {actionError}
          </p>
        ) : null}

        {setupUnfinished ? (
          <motion.div {...rise(0.05)} className="mb-5 rounded-3xl border border-orange-400/25 bg-orange-500/[0.07] p-4 sm:flex sm:items-center sm:justify-between sm:gap-4 sm:p-5">
            <div>
              <p className="font-bold text-white">These targets are a starting guess</p>
              <p className="mt-1 text-sm text-zinc-300">Four quick questions about your goal, body and week make them yours. About a minute.</p>
            </div>
            <button className="mt-3 min-h-11 shrink-0 rounded-full bg-gradient-to-b from-orange-400 to-forge-ember px-5 text-sm font-bold text-[#160a02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 sm:mt-0" type="button" onClick={() => setModal("setup")}>
              Personalise
            </button>
          </motion.div>
        ) : null}

        {plan.tips.length ? (
          <motion.div {...rise(0.08)} className="mb-5">
            <TipsList tips={plan.tips} />
          </motion.div>
        ) : null}

        <motion.div {...rise(0.09)} className="mb-5">
          <CustomTodosCard
            definitions={data.profile?.customTodos || []}
            limit={data.customTodoLimit}
            todos={todos}
            onAdd={() => setTodoEditor({ existing: null })}
            onEdit={(definition) => definition && setTodoEditor({ existing: definition })}
            onEditAmount={setCustomAmount}
            onQuickAdd={(suggestion) => {
              setActionError("");
              createTodo(suggestion).catch((err) => setActionError(err.message));
            }}
            onSetValue={(id, value) => run({ custom: { [id]: value } })}
          />
        </motion.div>

        <div className="grid gap-5 lg:grid-cols-2">
          <motion.div {...rise(0.1)} className="min-w-0">
            {plan.macros ? (
              <MacroCard plan={plan} todos={todos} totals={totals} onEdit={setEditing} onSet={(key, value) => run({ intake: { [key]: Math.max(0, Math.round(value)) } })} />
            ) : (
              <Card icon={MacroIcon} title="Macros">
                <p className="text-sm text-zinc-400">Add your weight and ForgeLift works out your protein, carbs, fat and calories.</p>
                <button className="mt-3 min-h-11 rounded-full bg-gradient-to-b from-orange-400 to-forge-ember px-5 text-sm font-bold text-[#160a02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200" type="button" onClick={() => setModal(setupUnfinished ? "setup" : "settings")}>
                  Add my weight
                </button>
              </Card>
            )}
          </motion.div>
          <div className="grid min-w-0 content-start gap-5">
            <motion.div {...rise(0.14)}>
              <WaterCard imperial={imperial} todo={todo("water")} onEdit={() => setEditing("water")} onSet={(ml) => run({ intake: { waterMl: Math.max(0, Math.round(ml)) } })} />
            </motion.div>
            <motion.div {...rise(0.18)}>
              <SleepCard plan={plan} onCheckIn={() => setModal(setupUnfinished ? "setup" : "checkin")} />
            </motion.div>
          </div>
          <motion.div {...rise(0.22)} className="min-w-0">
            <MealsCard log={log} plan={plan} onToggle={toggleMeal} />
          </motion.div>
          <motion.div {...rise(0.26)} className="min-w-0">
            {plan.supplements.length ? (
              <SupplementsCard log={log} plan={plan} onSetDoses={(key, doses) => run({ supplements: { [key]: doses } })} />
            ) : (
              <Card icon={SupplementIcon} title="Supplements">
                <p className="text-sm text-zinc-400">Take creatine, vitamin D or anything else? Add them and each becomes a daily to-do, with loading and timing worked out for you.</p>
                <button className="mt-3 min-h-11 rounded-full border border-white/12 bg-white/[0.05] px-5 text-sm font-bold text-white hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200" type="button" onClick={() => setModal(setupUnfinished ? "setup" : "settings")}>
                  Add supplements
                </button>
              </Card>
            )}
          </motion.div>
        </div>

        <motion.div {...rise(0.3)} className="mt-5">
          <ReasonsCard reasons={plan.reasons} waterLabel={units.format(plan.waterMl)} />
        </motion.div>
      </div>

      <AmountSheet
        open={Boolean(editingTodo)}
        steps={editing === "water" ? (imperial ? [-8, 8, 16] : [-250, 250, 500]) : editing === "fat" ? [-5, 5, 10] : [-10, 10, 25]}
        target={editing === "water" ? toDisplayWater(editingTodo?.target || 0, imperial) : editingTodo?.target || 0}
        title={editing === "water" ? "Water" : editingTodo?.label || ""}
        unit={editing === "water" ? (imperial ? "oz" : "ml") : "g"}
        value={editing === "water" ? toDisplayWater(editingTodo?.value || 0, imperial) : editingTodo?.value || 0}
        onClose={() => setEditing(null)}
        onSave={(value) => {
          const key = editing;
          setEditing(null);
          run({ intake: { [key === "water" ? "waterMl" : key]: key === "water" ? fromDisplayWater(value, imperial) : value } });
        }}
      />

      <AmountSheet
        open={Boolean(customAmount)}
        steps={customAmount ? [-countStep(customAmount.target), countStep(customAmount.target)] : []}
        target={customAmount?.target || 0}
        title={customAmount?.label || ""}
        unit={customAmount?.unit || ""}
        value={customAmount?.value || 0}
        onClose={() => setCustomAmount(null)}
        onSave={(value) => {
          const id = customAmount.id;
          setCustomAmount(null);
          run({ custom: { [id]: value } });
        }}
      />

      <TodoEditorSheet
        existing={todoEditor?.existing || null}
        open={Boolean(todoEditor)}
        onClose={() => setTodoEditor(null)}
        onDelete={async () => {
          await deleteTodo(String(todoEditor.existing._id));
          setTodoEditor(null);
        }}
        onSave={async (body) => {
          if (todoEditor.existing) await updateTodo(String(todoEditor.existing._id), body);
          else await createTodo(body);
          setTodoEditor(null);
        }}
      />

      <AnimatePresence>
        {modal === "checkin" ? (
          <DailyCheckInModal
            data={data}
            editing={Boolean(checkIn?.at)}
            imperial={imperial}
            key="checkin"
            name={user?.name?.split(" ")[0]}
            onSave={async (body) => {
              await update(body);
              setModal(null);
            }}
            onSkip={() => setModal(null)}
          />
        ) : null}
        {modal === "setup" || modal === "settings" ? (
          <DailySetupFlow
            data={data}
            editing={modal === "settings"}
            key={modal}
            user={user}
            onClose={() => setModal(null)}
            onSaveCheckIn={update}
            onSaveProfile={saveProfile}
            onSkip={() => setModal(null)}
          />
        ) : null}
      </AnimatePresence>
    </Layout>
  );
};

export default TodayPage;
