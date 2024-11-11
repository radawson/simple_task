import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';
import { socketService } from '../../services/socket.service';
import TaskList from './TaskList';
import EventList from './EventList';
import NoteList from './NoteList';

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentDate = new Date().toISOString().split('T')[0];
    
    const fetchInitialData = async () => {
      try {
        const [tasksRes, eventsRes, notesRes] = await Promise.all([
          ApiService.getTasks(currentDate),
          ApiService.getEvents(currentDate),
          ApiService.getNotes(currentDate)
        ]);

        setTasks(tasksRes.data);
        setEvents(eventsRes.data);
        setNotes(notesRes.data);
      } finally {
        setLoading(false);
      }
    };

    // Set up WebSocket listeners
    socketService.connect();
    socketService.subscribeToDate(currentDate);

    socketService.onTaskUpdate((task) => {
      setTasks(current => {
        const updated = [...current];
        const index = updated.findIndex(t => t.id === task.id);
        if (index >= 0) {
          updated[index] = task;
        } else {
          updated.push(task);
        }
        return updated;
      });
    });

    socketService.onEventUpdate((event) => {
      setEvents(current => {
        const updated = [...current];
        const index = updated.findIndex(e => e.id === event.id);
        if (index >= 0) {
          updated[index] = event;
        } else {
          updated.push(event);
        }
        return updated;
      });
    });

    socketService.onNoteUpdate((note) => {
      setNotes(current => {
        const updated = [...current];
        const index = updated.findIndex(n => n.id === note.id);
        if (index >= 0) {
          updated[index] = note;
        } else {
          updated.push(note);
        }
        return updated;
      });
    });

    socketService.onDayUpdates((updates) => {
      if (updates.tasks) setTasks(updates.tasks);
      if (updates.events) setEvents(updates.events);
      if (updates.notes) setNotes(updates.notes);
    });

    fetchInitialData();

    // Cleanup
    return () => {
      socketService.unsubscribeFromDate(currentDate);
    };
  }, []);

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
};

export default Dashboard;