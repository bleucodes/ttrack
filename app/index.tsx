import { useEffect, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";

import { getDb } from "../db";
import { listInjections, logInjection } from "../db/injection";
import { createSchedule, listSchedules } from "../db/schedule";

// util: compute next due by anchor (no schema change)
function nextDueAnchor(anchorStartMs: number, intervalDays: number, nowMs = Date.now()) {
  const dayMs = 24 * 60 * 60 * 1000;
  const intervalMs = intervalDays * dayMs;
  if (nowMs < anchorStartMs) return anchorStartMs;
  const elapsed = nowMs - anchorStartMs;
  const k = Math.floor(elapsed / intervalMs) + 1;
  return anchorStartMs + k * intervalMs;
}

type ScheduleRow = { id: number; date: number; interval: number; siteRotation?: string | null };
type InjectionRow = { id: number; scheduleId: number; date: number; site?: string | null; dose?: number | null; metric?: string | null; notes?: string | null };

export default function Index() {
  const [ready, setReady] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleRow | null>(null);
  const [injections, setInjections] = useState<InjectionRow[]>([]);

  useEffect(() => {
    (async () => {
      // 1) open DB + create tables
      await getDb();

      // 2) ensure we have at least one schedule
      const rows = (await listSchedules()) as ScheduleRow[];
      let sched = rows[0];
      if (!sched) {
        // anchor = now; interval = weekly
        const anchor = Date.now();
        const newId = await createSchedule(anchor, 7, "L-quad,R-quad");
        sched = { id: newId, date: anchor, interval: 7, siteRotation: "L-quad,R-quad" };
      }

      setSchedule(sched);

      // 3) load latest injections for this schedule
      const inj = (await listInjections(sched.id)) as InjectionRow[];
      setInjections(inj);

      setReady(true);
    })();
  }, []);

  const handleAddInjection = async () => {
    if (!schedule) return;
    await logInjection(schedule.id, Date.now(), "R-quad", 0.4, "ml", "test entry");
    const inj = (await listInjections(schedule.id)) as InjectionRow[];
    setInjections(inj);
  };

  if (!ready || !schedule) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading DB…</Text>
      </View>
    );
  }

  const nextDue = nextDueAnchor(schedule.date, schedule.interval);
  return (
    <View style={{ flex: 1, padding: 20, gap: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: "600" }}>TTrack</Text>

      <View style={{ gap: 6 }}>
        <Text>Schedule ID: {schedule.id}</Text>
        <Text>Anchor: {new Date(schedule.date).toLocaleString()}</Text>
        <Text>Interval: every {schedule.interval} days</Text>
        <Text>Next Due (anchor mode): {new Date(nextDue).toLocaleString()}</Text>
      </View>

      <Pressable
        onPress={handleAddInjection}
        style={{ backgroundColor: "#eee", padding: 12, borderRadius: 8, alignSelf: "flex-start" }}
      >
        <Text>+ Log Injection (now)</Text>
      </Pressable>

      <Text style={{ marginTop: 8, fontWeight: "600" }}>Recent Injections</Text>
      <FlatList
        data={injections}
        keyExtractor={(item) => String(item.id)}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item }) => (
          <View style={{ padding: 12, borderWidth: 1, borderColor: "#ddd", borderRadius: 8 }}>
            <Text>{new Date(item.date).toLocaleString()}</Text>
            <Text>{item.site ?? "—"} · {item.dose ?? "—"} {item.metric ?? ""}</Text>
            {item.notes ? <Text style={{ color: "#666" }}>{item.notes}</Text> : null}
          </View>
        )}
        ListEmptyComponent={<Text>No injections yet.</Text>}
      />
    </View>
  );
}
