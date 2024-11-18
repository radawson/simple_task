// src/components/tasks/TaskEdit.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MDBInput,
  MDBTextArea,
  MDBBtn,
  MDBSwitch,
  MDBCard,
  MDBCardBody,
  MDBContainer
} from 'mdb-react-ui-kit';
import { ApiService } from '../../services/api';
import { formatLocalDate } from '../../utils/dateUtils';

const TaskEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState({
    name: '',
    description: '',
    date: formatLocalDate(),
    priority: 1,
    template: false
  });
  const [loading, setLoading] = useState(!!id);

  useEffect(() => {
    const loadTask = async () => {
      if (id) {
        try {
          const response = await ApiService.getTask(id);
          setTask(response.data);
        } catch (error) {
          console.error('Failed to load task:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    loadTask();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (id) {
        await ApiService.updateTask(id, task);
      } else {
        await ApiService.createTask(task);
      }
      navigate('/tasks');
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTask(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (loading) return <div>Loading...</div>;

  return (
    <MDBContainer className="py-5">
      <h1>{id ? 'Edit Task' : 'New Task'}</h1>
      <MDBCard>
        <MDBCardBody>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <MDBInput
                label="Title"
                name="name"
                value={task.name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="mb-3">
              <MDBTextArea
                label="Description"
                name="description"
                value={task.description}
                onChange={handleChange}
                rows={3}
              />
            </div>

            <div className="row mb-3">
              <div className="col-md-8">
                <MDBInput
                  type="date"
                  label="Date"
                  name="date"
                  value={task.date}
                  onChange={handleChange}
                  disabled={task.template}
                  required={!task.template}
                />
              </div>
              <div className="col-md-4">
                <MDBInput
                  type="number"
                  label="Priority"
                  name="priority"
                  value={task.priority}
                  onChange={handleChange}
                  min={1}
                  max={5}
                />
              </div>
            </div>

            <div className="mb-3">
              <MDBSwitch
                name="template"
                checked={task.template}
                onChange={handleChange}
                label="Template"
              />
            </div>

            <div className="d-flex gap-2">
              <MDBBtn type="submit" color="primary">
                {id ? 'Save' : 'Create'}
              </MDBBtn>
              <MDBBtn 
                type="button" 
                color="secondary"
                onClick={() => navigate(-1)}
              >
                Cancel
              </MDBBtn>
              {id && (
                <MDBBtn
                  type="button"
                  color="danger"
                  onClick={async () => {
                    await ApiService.deleteTask(id);
                    navigate('/tasks');
                  }}
                >
                  Delete
                </MDBBtn>
              )}
            </div>
          </form>
        </MDBCardBody>
      </MDBCard>
    </MDBContainer>
  );
};

export default TaskEdit;