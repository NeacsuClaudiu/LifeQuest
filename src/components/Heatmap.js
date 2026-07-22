import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CELL_SIZE = 12;
const CELL_GAP = 3;
const DAYS_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', ''];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getIntensity(count, maxCount) {
  if (count === 0) return 0;
  const ratio = count / Math.max(maxCount, 1);
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

const INTENSITY_COLORS = [
  '#1A1A2E',
  '#0D4F1A',
  '#1B7A2A',
  '#2EA043',
  '#3FB950',
];

export default function Heatmap({ completedTasks, style }) {
  const [selectedDay, setSelectedDay] = useState(null);

  const { cells, monthMarkers, maxCount } = useMemo(() => {
    const now = new Date();
    const endDate = new Date(now);
    const startDate = new Date(now);
    startDate.setFullYear(startDate.getFullYear() - 1);
    startDate.setDate(startDate.getDate() + 1);

    const dayMap = {};
    completedTasks.forEach(t => {
      if (!t.completedAt) return;
      const d = new Date(t.completedAt);
      if (d >= startDate && d <= endDate) {
        const key = d.toDateString();
        if (!dayMap[key]) dayMap[key] = { count: 0, xp: 0, tasks: [] };
        dayMap[key].count += 1;
        dayMap[key].xp += t.xp || 0;
        dayMap[key].tasks.push(t.title || 'Task');
      }
    });

    let maxC = 0;
    Object.values(dayMap).forEach(d => { maxC = Math.max(maxC, d.count); });

    const cells = [];
    const monthMarkers = [];
    const cursor = new Date(startDate);

    while (cursor <= endDate) {
      const dayOfWeek = cursor.getDay();
      const col = Math.floor((cursor - startDate) / (7 * 24 * 60 * 60 * 1000));
      const row = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

      if (cursor.getDate() === 1 && cursor.getMonth() !== startDate.getMonth()) {
        monthMarkers.push({ col, label: MONTH_LABELS[cursor.getMonth()] });
      }

      const key = cursor.toDateString();
      const data = dayMap[key];
      const count = data ? data.count : 0;
      const intensity = getIntensity(count, maxC);

      cells.push({
        key,
        date: new Date(cursor),
        count,
        xp: data ? data.xp : 0,
        tasks: data ? data.tasks : [],
        intensity,
        col,
        row,
      });

      cursor.setDate(cursor.getDate() + 1);
    }

    return { cells, monthMarkers, maxCount: maxC };
  }, [completedTasks]);

  const totalWeeks = Math.ceil(cells.length / 7);

  const getDaySummary = (day) => {
    if (!day) return null;
    return {
      date: day.date.toDateString(),
      count: day.count,
      xp: day.xp,
      tasks: day.tasks,
    };
  };

  const selectedSummary = selectedDay ? getDaySummary(selectedDay) : null;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.monthRow}>
        <View style={{ width: 30 }} />
        {monthMarkers.map((m, i) => (
          <Text key={i} style={[styles.monthLabel, { marginLeft: Math.max(0, m.col * (CELL_SIZE + CELL_GAP) - (i > 0 ? monthMarkers[i - 1].col * (CELL_SIZE + CELL_GAP) : 0) - 10) }]}>
            {m.label}
          </Text>
        ))}
      </View>

      <View style={styles.gridRow}>
        <View style={styles.dayLabels}>
          {DAYS_LABELS.map((label, i) => (
            <Text key={i} style={[styles.dayLabel, { height: CELL_SIZE + CELL_GAP }]}>{label}</Text>
          ))}
        </View>

        <View style={styles.cellsContainer}>
          {cells.map((cell) => {
            const left = cell.col * (CELL_SIZE + CELL_GAP);
            const top = cell.row * (CELL_SIZE + CELL_GAP);
            return (
              <TouchableOpacity
                key={cell.key}
                style={[
                  styles.cell,
                  {
                    left,
                    top,
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    backgroundColor: INTENSITY_COLORS[cell.intensity],
                  },
                  selectedDay?.key === cell.key && styles.cellSelected,
                ]}
                onPress={() => setSelectedDay(cell)}
                activeOpacity={0.6}
              />
            );
          })}
        </View>
      </View>

      <View style={styles.legendRow}>
        <Text style={styles.legendLabel}>Less</Text>
        {INTENSITY_COLORS.map((color, i) => (
          <View key={i} style={[styles.legendCell, { backgroundColor: color }]} />
        ))}
        <Text style={styles.legendLabel}>More</Text>
        <Text style={styles.legendTotal}>{completedTasks.length} tasks in 1 year</Text>
      </View>

      <Modal visible={!!selectedDay} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSelectedDay(null)}>
          <View style={styles.tooltip}>
            <View style={styles.tooltipHeader}>
              <Text style={styles.tooltipDate}>
                {selectedSummary?.date}
              </Text>
              <TouchableOpacity onPress={() => setSelectedDay(null)}>
                <Ionicons name="close" size={18} color="#666" />
              </TouchableOpacity>
            </View>
            {selectedSummary && selectedSummary.count > 0 ? (
              <>
                <View style={styles.tooltipStats}>
                  <View style={styles.tooltipStat}>
                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                    <Text style={styles.tooltipStatValue}>{selectedSummary.count}</Text>
                    <Text style={styles.tooltipStatLabel}>tasks</Text>
                  </View>
                  <View style={styles.tooltipStat}>
                    <Ionicons name="flash" size={16} color="#FFD700" />
                    <Text style={styles.tooltipStatValue}>+{selectedSummary.xp}</Text>
                    <Text style={styles.tooltipStatLabel}>XP</Text>
                  </View>
                </View>
                <View style={styles.tooltipTaskList}>
                  {selectedSummary.tasks.slice(0, 5).map((title, i) => (
                    <Text key={i} style={styles.tooltipTask} numberOfLines={1}>- {title}</Text>
                  ))}
                  {selectedSummary.tasks.length > 5 && (
                    <Text style={styles.tooltipMore}>+{selectedSummary.tasks.length - 5} more</Text>
                  )}
                </View>
              </>
            ) : (
              <View style={styles.tooltipEmpty}>
                <Ionicons name="moon" size={20} color="#444" />
                <Text style={styles.tooltipEmptyText}>No activity</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
  monthRow: { flexDirection: 'row', marginBottom: 4, marginLeft: 30 },
  monthLabel: { color: '#666', fontSize: 9, fontWeight: '600' },
  gridRow: { flexDirection: 'row' },
  dayLabels: { width: 30, paddingTop: 2 },
  dayLabel: { color: '#555', fontSize: 8, fontWeight: '600', textAlign: 'right', marginRight: 4 },
  cellsContainer: { position: 'relative', width: '100%', height: 7 * (CELL_SIZE + CELL_GAP) },
  cell: {
    position: 'absolute',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#2A2A3E22',
  },
  cellSelected: {
    borderColor: '#FFD700',
    borderWidth: 2,
  },
  legendRow: {
    flexDirection: 'row', alignItems: 'center', marginTop: 8,
    justifyContent: 'flex-end',
  },
  legendLabel: { color: '#555', fontSize: 9, marginHorizontal: 4 },
  legendCell: { width: 10, height: 10, borderRadius: 2, marginHorizontal: 1 },
  legendTotal: { color: '#666', fontSize: 9, marginLeft: 12 },
  modalOverlay: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  tooltip: {
    backgroundColor: '#1A1A2E', borderRadius: 16, padding: 16,
    width: 260, borderWidth: 1, borderColor: '#2A2A3E',
  },
  tooltipHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  tooltipDate: { color: '#FFD700', fontSize: 13, fontWeight: '700' },
  tooltipStats: { flexDirection: 'row', marginBottom: 10 },
  tooltipStat: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  tooltipStatValue: { color: '#fff', fontSize: 16, fontWeight: '900', marginLeft: 6 },
  tooltipStatLabel: { color: '#666', fontSize: 11, marginLeft: 4 },
  tooltipTaskList: { borderTopWidth: 1, borderTopColor: '#2A2A3E', paddingTop: 8 },
  tooltipTask: { color: '#aaa', fontSize: 12, marginBottom: 4 },
  tooltipMore: { color: '#666', fontSize: 11, fontStyle: 'italic' },
  tooltipEmpty: { alignItems: 'center', paddingVertical: 16 },
  tooltipEmptyText: { color: '#444', fontSize: 13, marginTop: 6 },
});
