// components/dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import TaskList from './TaskList';
import EventList from './EventList';
import NoteList from './NoteList';

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [notes, setNotes] = useState([]);
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    // Fetch data from your API
    const fetchData = async () => {
      const dateStr = date.toISOString().split('T')[0];
      const response = await fetch(`/api/date/${dateStr}`);
      const data = await response.json();
      setTasks(data.tasks);
      setEvents(data.events);
      setNotes(data.notes);
    };

    fetchData();
  }, [date]);

  return (
    <div id="main_container" className="container py-5">
      <div className="card">
        <TaskList tasks={tasks} />
        <EventList events={events} />
        <NoteList notes={notes} />
      </div>
    </div>
  );
};

export default Dashboard;