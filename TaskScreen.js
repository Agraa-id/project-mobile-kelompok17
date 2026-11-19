import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { createTask, deleteTask, fetchTasks, updateTask } from './tasksApi';

const colors = {
  green: '#14564A',
  deep: '#123B35',
  lime: '#D7F36A',
  coral: '#F27456',
  paper: '#F8F7F0',
  ink: '#18231F',
  muted: '#7C8981',
  line: '#DDE3D9',
  white: '#FFFFFF',
};

export default function TaskScreen({ accessToken }) {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    fetchTasks(accessToken, controller.signal)
      .then((data) => {
        if (active) setTasks(data || []);
      })
      .catch((requestError) => {
        if (active && requestError.name !== 'AbortError') {
          setError(requestError.message || 'Data jadwal tidak dapat dimuat.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [accessToken, reloadKey]);

  function refreshTasks() {
    setLoading(true);
    setError('');
    setReloadKey((current) => current + 1);
  }

  async function handleCreate() {
    if (!title.trim()) {
      setError('Tuliskan rencana main terlebih dahulu.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const created = await createTask(accessToken, title);
      setTasks((current) => [...current, created]);
      setTitle('');
    } catch (requestError) {
      setError(requestError.message || 'Rencana main tidak dapat ditambahkan.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(task) {
    setError('');
    try {
      const updated = await updateTask(accessToken, task.id, !task.completed);
      setTasks((current) => current.map((item) => item.id === task.id ? updated : item));
    } catch (requestError) {
      setError(requestError.message || 'Status rencana tidak dapat diperbarui.');
    }
  }

  async function handleDelete(id) {
    setError('');
    try {
      await deleteTask(accessToken, id);
      setTasks((current) => current.filter((item) => item.id !== id));
    } catch (requestError) {
      setError(requestError.message || 'Rencana main tidak dapat dihapus.');
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>RENCANA MAIN</Text>
          <Text style={styles.title}>Jadwal lapangan</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={refreshTasks}
          disabled={loading}
          style={styles.refreshButton}
        >
          <Text style={styles.refreshText}>↻ Muat ulang</Text>
        </Pressable>
      </View>

      <View style={styles.inputPanel}>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Contoh: Futsal bersama tim"
          placeholderTextColor={colors.muted}
          style={styles.input}
          onSubmitEditing={handleCreate}
          returnKeyType="done"
        />
        <Pressable
          accessibilityRole="button"
          disabled={submitting}
          onPress={handleCreate}
          style={styles.addButton}
        >
          {submitting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.addText}>Tambah</Text>}
        </Pressable>
      </View>

      {!!error && <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text>}

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.green} />
          <Text style={styles.caption}>Memuat rencana dari API...</Text>
        </View>
      ) : tasks.length ? (
        tasks.map((task) => (
          <View key={task.id} style={styles.taskCard}>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: task.completed }}
              onPress={() => handleToggle(task)}
              style={[styles.checkbox, task.completed && styles.checkboxComplete]}
            >
              {task.completed && <Text style={styles.checkmark}>✓</Text>}
            </Pressable>
            <Text style={[styles.taskTitle, task.completed && styles.taskTitleComplete]}>
              {task.title}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Hapus ${task.title}`}
              onPress={() => handleDelete(task.id)}
              style={styles.deleteButton}
            >
              <Text style={styles.deleteText}>Hapus</Text>
            </Pressable>
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Belum ada rencana main</Text>
          <Text style={styles.caption}>Tambahkan jadwal pertamamu di atas.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 24 },
  header: { minHeight: 116, paddingHorizontal: 22, paddingTop: 24, paddingBottom: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.line },
  eyebrow: { color: colors.coral, fontSize: 9, fontWeight: '900', letterSpacing: 1.4 },
  title: { marginTop: 7, color: colors.ink, fontSize: 25, fontWeight: '900' },
  refreshButton: { minHeight: 36, paddingHorizontal: 10, borderWidth: 1, borderColor: colors.line, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  refreshText: { color: colors.green, fontSize: 10, fontWeight: '900' },
  inputPanel: { marginHorizontal: 22, marginTop: 18, flexDirection: 'row', gap: 8 },
  input: { flex: 1, height: 48, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.line, borderRadius: 5, backgroundColor: colors.white, color: colors.ink, fontSize: 12 },
  addButton: { width: 76, height: 48, borderRadius: 5, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  addText: { color: colors.white, fontSize: 11, fontWeight: '900' },
  errorText: { marginHorizontal: 22, marginTop: 12, color: '#A9452D', fontSize: 11 },
  loadingState: { height: 180, alignItems: 'center', justifyContent: 'center' },
  caption: { marginTop: 7, color: colors.muted, fontSize: 11 },
  taskCard: { minHeight: 60, marginHorizontal: 22, marginTop: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.line, borderRadius: 5, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center' },
  checkbox: { width: 22, height: 22, borderWidth: 1, borderColor: colors.muted, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  checkboxComplete: { borderColor: colors.green, backgroundColor: colors.green },
  checkmark: { color: colors.white, fontSize: 13, fontWeight: '900' },
  taskTitle: { flex: 1, marginHorizontal: 10, color: colors.ink, fontSize: 12, fontWeight: '700' },
  taskTitleComplete: { color: colors.muted, textDecorationLine: 'line-through' },
  deleteButton: { minHeight: 34, paddingHorizontal: 8, justifyContent: 'center' },
  deleteText: { color: '#A9452D', fontSize: 10, fontWeight: '900' },
  emptyState: { marginHorizontal: 22, marginTop: 18, paddingVertical: 35, borderWidth: 1, borderColor: colors.line, borderRadius: 5, backgroundColor: colors.white, alignItems: 'center' },
  emptyTitle: { color: colors.ink, fontSize: 14, fontWeight: '900' },
});
