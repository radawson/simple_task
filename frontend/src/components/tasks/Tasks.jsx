// src/components/tasks/Tasks.jsx
import React, { useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MDBContainer,
    MDBDatatable,
    MDBInput,
    MDBBtn,
    MDBIcon
} from 'mdb-react-ui-kit';
import Toast from '../common/Toast';
import { ApiService } from '../../services/api';
import { formatLocalDate } from '../../utils/dateUtils';

const Tasks = () => {
    const navigate = useNavigate();
    const [endDate, setEndDate] = useState('');
    const [selectedDate, setSelectedDate] = useState(formatLocalDate());
    const [selectedTasks, setSelectedTasks] = useState(new Set());
    const [loading, setLoading] = useState(false);
    const [asyncData, setAsyncData] = useState({
        columns: [
            {
                label: 'Name',
                field: 'name',
                className: 'col-3'
            },
            {
                label: 'Description',
                field: 'description',
                className: 'col-4'
            },
            {
                label: 'Date',
                field: 'date',
                className: 'col-2'
            },
            {
                label: 'Priority',
                field: 'priority',
                className: 'col-1'
            },
            {
                label: 'Status',
                field: 'status',
                className: 'col-1'
            },
            {
                label: 'Actions',
                field: 'actions',
                className: 'col-1'
            }
        ],
        rows: []
    });

    const [toast, setToast] = useState({
        show: false,
        message: '',
        type: 'info'
    });

    const fetchTasks = useCallback(async () => {
        setLoading(true);
        try {
            let response;
            if (!selectedDate) {
                response = await ApiService.listTasks();
            } else if (!endDate) {
                response = await ApiService.getTasks(selectedDate);
            } else {
                response = await ApiService.getTasksByRange(selectedDate, endDate);
            }
            
            // Debug log
            console.log('API Response:', response);
            
            // The response data is already the tasks array
            const tasksArray = Array.isArray(response.data) ? response.data : 
                              Array.isArray(response.data.tasks) ? response.data.tasks : 
                              [];
    
            const formattedTasks = tasksArray.map(task => ({
                id: task.id,
                name: task.name,
                description: task.description || '',
                date: task.date,
                priority: task.priority,
                status: task.completed ? 'Completed' : 'Pending',
                actions: createActionButtons(task)
            }));
    
            // Debug log
            console.log('Formatted Tasks:', formattedTasks);
    
            setAsyncData(prev => ({
                ...prev,
                rows: formattedTasks
            }));
        } catch (error) {
            console.error('Failed to fetch tasks:', error);
            setToast({
                show: true,
                message: 'Failed to load tasks: ' + error.message,
                type: 'danger'
            });
        } finally {
            setLoading(false);
        }
    }, [selectedDate, endDate]);

    const handleEdit = (taskId) => {
        navigate(`/tasks/edit/${taskId}`);
    };

    const handleDelete = async (taskId) => {
        try {
            await ApiService.deleteTask(taskId);
            fetchTasks();
            setToast({
                show: true,
                message: 'Task deleted successfully',
                type: 'success'
            });
        } catch (error) {
            setToast({
                show: true,
                message: 'Failed to delete task: ' + error.message,
                type: 'danger'
            });
        }
    };

    const handleNewTask = () => {
        navigate('/tasks/new');
    };

    const handleRowSelect = (selectionEvent) => {
        if (!Array.isArray(selectionEvent)) return;
        
        const newSelection = new Set(
            selectionEvent.map(task => task.id)
        );
        
        setSelectedTasks(newSelection);
    };

    const createActionButtons = (task) => (
        <div>
            <MDBBtn
                floating
                size="sm"
                color="primary"
                className="me-1"
                onClick={() => handleEdit(task.id)}
            >
                <MDBIcon icon="edit" />
            </MDBBtn>
            <MDBBtn
                floating
                size="sm"
                color="danger"
                onClick={() => handleDelete(task.id)}
            >
                <MDBIcon icon="trash" />
            </MDBBtn>
        </div>
    );

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    return (
        <MDBContainer className="py-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>Tasks</h1>
                <MDBBtn onClick={handleNewTask}>
                    <MDBIcon icon="plus" className="me-2" /> New Task
                </MDBBtn>
            </div>

            <div className="row">
                <div className="col-md-4 mb-4">
                    <MDBInput
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        label="Start Date"
                    />
                </div>
                <div className="col-md-4 mb-4">
                    <MDBInput
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        label="End Date"
                    />
                </div>
            </div>

            <MDBDatatable
                fixedHeader
                striped
                hover
                className="table-responsive"
                data={asyncData}
                selectable
                multi
                onSelectRow={handleRowSelect}
                isLoading={loading}
                search
                searchLabel="Search Tasks"
                entriesOptions={[5, 10, 25]}
                entries={10}
                noFoundMessage="No tasks found"
            />

            <Toast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ show: false, message: '', type: 'info' })}
            />
        </MDBContainer>
    );
};

export default Tasks;