//src/components/dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';
import { socketService } from '../../services/socket.service';
import { formatLocalDate } from '../../utils/dateUtils';
import TaskList from './TaskList';
import EventList from './EventList';
import NoteList from './NoteList';

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(formatLocalDate());

  useEffect(() => {
    const currentDate = formatLocalDate(); // Use local timezone
    console.log('Fetching data for date:', currentDate); // Debug log
    
    const fetchInitialData = async () => {
      try {
        const [tasksRes, eventsRes, notesRes] = await Promise.all([
          ApiService.getTasks(currentDate),
          ApiService.getEvents(currentDate),
          ApiService.getNotes(currentDate)
        ]);

        // Debugging
        // console.log('Tasks:', tasksRes.data);
        // console.log('Events:', eventsRes.data);
        // console.log('Notes:', notesRes.data);

        setTasks(tasksRes.data);
        setEvents(eventsRes.data);
        setNotes(notesRes.data);
      } finally {
        setLoading(false);
      }
    };

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

    return () => {
      socketService.unsubscribeFromDate(currentDate);
    };
  }, [selectedDate]);

  const handleTaskUpdate = async (taskId) => {
    try {
      const response = await ApiService.getTasks(selectedDate);
      setTasks(response.data);
    } catch (error) {
      console.error('Failed to refresh tasks:', error);
    }
  };

  const handlePrint = () => {
    // Add print-specific class to body
    document.body.classList.add('printing');
    
    // Print
    window.print();
    
    // Remove print-specific class after printing
    document.body.classList.remove('printing');
  };

  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-12 mb-4">
        <TaskList 
            tasks={tasks} 
            onTaskUpdate={handleTaskUpdate}
            selectedDate={selectedDate} 
          />
        </div>
        <div className="col-12 mb-4">
          <EventList events={events}
          selectedDate={selectedDate} 
           />
        </div>
        <div className="col-12 mb-4">
          <NoteList notes={notes}
          selectedDate={selectedDate} 
           />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;