// src/components/dashboard/TaskList.jsx
import React from 'react';
import { MDBAccordion, MDBAccordionItem, MDBCheckbox } from 'mdb-react-ui-kit';

const TaskList = ({ tasks }) => {
  const handleCompletedChange = async (taskId, completed) => {
    const formData = new FormData();
    formData.append('completed', completed.toString());
    
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        body: formData
      });
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  return (
    <div className="card">
      <h3 className="m-2">Tasks</h3>
      <MDBAccordion flush>
        {tasks.map((task) => (
          <MDBAccordionItem
            key={task.id}
            header={task.name}
          >
            <div className="d-flex justify-content-between align-items-center">
              <div className="form-outline no-border">
                <textarea
                  className="form-control"
                  value={task.description}
                  readOnly={!task.isAdmin}
                />
              </div>
              {!task.no_check && (
                <MDBCheckbox
                  checked={task.completed}
                  onChange={(e) => handleCompletedChange(task.id, e.target.checked)}
                  label="Completed"
                />
              )}
            </div>
          </MDBAccordionItem>
        ))}
      </MDBAccordion>
    </div>
  );
};

export default TaskList;