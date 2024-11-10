import { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';
import TaskList from './TaskList';
import EventList from './EventList';
import NoteList from './NoteList';

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const date = new Date().toISOString().split('T')[0];
        const [tasksRes, eventsRes, notesRes] = await Promise.all([
          ApiService.getTasks(date),
          ApiService.getEvents(date),
          ApiService.getNotes(date)
        ]);

        setTasks(tasksRes.data);
        setEvents(eventsRes.data);
        setNotes(notesRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-md-4">
          <TaskList tasks={tasks} />
        </div>
        <div className="col-md-4">
          <EventList events={events} />
        </div>
        <div className="col-md-4">
          <NoteList notes={notes} />
        </div>
      </div>
    </div>
  );
}