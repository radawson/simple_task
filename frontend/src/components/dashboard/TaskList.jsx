// src/components/dashboard/TaskList.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { MDBCheckbox } from 'mdb-react-ui-kit';
import Toast from '../common/Toast.jsx';
import { ApiService } from '../../services/api';
import ErrorBoundary from '../ErrorBoundary';

const TaskList = ({ tasks = [] }) => {
  const [openItems, setOpenItems] = useState({});

  const toggleAccordion = (taskId) => {
    setOpenItems(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const handleCompletedChange = async (taskId, completed) => {
    if (!taskId) return;

    // Optimistic update
    const updatedTasks = tasks.map(task =>
      task.id === taskId ? { ...task, completed } : task
    );
    onTaskUpdate?.(taskId, { completed });

    try {
      await ApiService.updateTask(taskId, { completed });
    } catch (error) {
      console.error('Failed to update task:', error);
      // Revert optimistic update
      const originalTasks = tasks.map(task =>
        task.id === taskId ? { ...task, completed: !completed } : task
      );
      onTaskUpdate?.(taskId, { completed: !completed });
    }
  };

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
                        onChange={(e) => handleCompletedChange(task.id, e.target.checked)}
                        disabled={loading}
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
    no_check: PropTypes.bool,
    onTaskUpdate: PropTypes.func
  }))
};

TaskList.defaultProps = {
  tasks: []
};

export default TaskList;