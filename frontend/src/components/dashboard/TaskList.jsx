// src/components/dashboard/TaskList.jsx
import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { MDBCheckbox } from 'mdb-react-ui-kit';
import Toast from '../common/Toast.jsx';
import { ApiService } from '../../services/api';
import { socketService } from '../../services/socket.service';
import ErrorBoundary from '../ErrorBoundary';

const TaskList = ({ 
  tasks = [], 
  onTaskUpdate = () => {},
  selectedDate  
}) => {
  const [openItems, setOpenItems] = useState({})

  const toggleAccordion = (taskId) => {
    setOpenItems(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const handleCompletedChange = async (taskId) => {
    if (!taskId) return;

    try {
      await ApiService.toggleTaskCompletion(taskId);
      updateTasks();
    } catch (error) {
      console.error('Failed to toggle task completion:', error);
    }
  };

  const updateTasks = useCallback(async () => {
    if (!selectedDate) return;
    try {
      const updatedTasks = await ApiService.getTasks(selectedDate);
      onTaskUpdate(updatedTasks);
    } catch (error) {
      console.error('Failed to update tasks:', error);
    }
  }, [selectedDate, onTaskUpdate]);

  useEffect(() => {
    if (!selectedDate) return; // Add guard clause

    // Connect socket and subscribe
    socketService.connect();
    socketService.subscribeToDate(selectedDate);
    
    // Set up interval
    const intervalId = setInterval(updateTasks, 30000);

    // Set up socket listener
    socketService.onTaskUpdate(() => {
      updateTasks();
    });

    // Cleanup
    return () => {
      clearInterval(intervalId);
      socketService.unsubscribeFromDate(selectedDate);
    };
  }, [selectedDate, updateTasks]);

  return (
    <ErrorBoundary>
      <>
        <div className="card">
          <h3 className="m-2">Tasks</h3>
          <div className="accordion accordion-flush" id="task_accordion">
            {Array.isArray(tasks) && tasks.map((task) => (
              <div key={task?.id} className="accordion-item">
                <div
                  className="accordion-header d-flex justify-content-between align-items-center"
                  id={`heading-task-${task?.id}`}
                >
                  <button
                    className={`accordion-button ${!openItems[task?.id] ? 'collapsed' : ''}`}
                    type="button"
                    onClick={() => toggleAccordion(task?.id)}
                    aria-expanded={openItems[task?.id]}
                    aria-controls={`collapse-task-${task?.id}`}
                  >
                    {task?.name || 'Untitled Task'}
                  </button>
                  {!task?.no_check && (
                    <div className="form-check me-2" onClick={(e) => e.stopPropagation()}>
                      <MDBCheckbox
                        id={`taskCheck_${task?.id}`}
                        checked={!!task?.completed}
                        onChange={() => handleCompletedChange(task.id)}
                        label="Completed"
                      />
                    </div>
                  )}
                </div>
                <div
                  id={`collapse-task-${task?.id}`}
                  className={`accordion-collapse collapse ${openItems[task?.id] ? 'show' : ''}`}
                  aria-labelledby={`heading-task-${task?.id}`}
                >
                  <div className="accordion-body">
                    <div className="form-outline no-border">
                      <textarea
                        className="form-control"
                        id={`task_description_${task?.id}`}
                        value={task?.description || ''}
                        readOnly={!task?.isAdmin}
                        rows={task?.description?.split('\n').length || 1}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <Toast
          message="Task updated successfully"
          show={false}
          onClose={() => { }}
        />
      </>
    </ErrorBoundary>
  );
};

TaskList.propTypes = {
  tasks: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    completed: PropTypes.bool,
    isAdmin: PropTypes.bool,
    no_check: PropTypes.bool
  })),
  onTaskUpdate: PropTypes.func,
  selectedDate: PropTypes.string.isRequired
};

export default TaskList;