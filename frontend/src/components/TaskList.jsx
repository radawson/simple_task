import React, { useEffect, useState } from 'react';
import { getTasks } from '../services/api';

export default function TaskList() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const fetchTasks = async () => {
      const { data } = await getTasks();
      setTasks(data);
    };
    fetchTasks();
  }, []);

  return (
    <div>
      <h1>Tasks</h1>
      {tasks.map(task => (
        <div key={task.id}>
          <h3>{task.name}</h3>
          <p>{task.description}</p>
        </div>
      ))}
    </div>
  );
}