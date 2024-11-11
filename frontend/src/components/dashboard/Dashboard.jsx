// src/components/dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';
import EditRoute from '../auth/EditRoute';
import TaskList from './TaskList';
import EventList from './EventList';
import NoteList from './NoteList';

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Auto-refresh every 30 seconds
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
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <EditRoute>
      {({ canEdit }) => (
        <div className="container py-5">
          <div className="row">
            <div className="col-md-4">
              <TaskList tasks={tasks} canEdit={canEdit} />
            </div>
            <div className="col-md-4">
              <EventList events={events} canEdit={canEdit} />
            </div>
            <div className="col-md-4">
              <NoteList notes={notes} canEdit={canEdit} />
            </div>
          </div>
        </div>
      )}
    </EditRoute>
  );
};

export default Dashboard;