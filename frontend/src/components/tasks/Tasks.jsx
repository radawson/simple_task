// src/components/tasks/Tasks.jsx
import React, { useState, useEffect } from 'react';
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
    const [tasks, setTasks] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState(formatLocalDate());
    const [selectedTasks, setSelectedTasks] = useState(new Set());
    const [tableData, setTableData] = useState({
        columns: [
            {
                label: 'Name',
                field: 'name',
                className: 'col-3'
            },
            {
                label: 'Description',
                field: 'description',
                className: 'col-5'
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
                label: 'Actions',
                field: 'actions',
                className: 'col-1'
            }
        ],
        rows: []
    });
    const [toast, setToast] = useState({
        show: false,
        message: ''
    });

    const handleEdit = (taskId) => {
        navigate(`/tasks/edit/${taskId}`);
    };

    const handleDelete = async (taskId) => {
        try {
            await ApiService.deleteTask(taskId);
            fetchTasks();
            setToast({
                show: true,
                message: 'Task deleted successfully'
            });
        } catch (error) {
            setToast({
                show: true,
                message: 'Failed to delete task: ' + error.message
            });
        }
    };

    const handleNewTask = () => {
        navigate('/tasks/new');
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

    const fetchTasks = async () => {
        try {
            const response = await ApiService.listTasks();
            console.log('API Response:', response);
    
            // Extract tasks array from paginated response
            const tasksArray = response?.data?.tasks || [];
    
            const formattedTasks = tasksArray.map(task => ({
                id: task.id,
                name: task.name,
                description: task.description,
                date: task.date,
                priority: task.priority,
                completed: task.completed,
                actions: createActionButtons(task)
            }));
    
            setTasks(tasksArray); // Store raw tasks
            setTableData(prev => ({
                ...prev,
                rows: formattedTasks
            }));
        } catch (error) {
            console.error('Failed to fetch tasks:', error);
            setToast({
                show: true,
                message: 'Failed to load tasks: ' + error.message
            });
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    return (
        <MDBContainer className="py-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>Tasks</h1>
                <MDBBtn onClick={handleNewTask}>
                    <MDBIcon icon="plus" className="me-2" /> New Task
                </MDBBtn>
            </div>

            <div className="row mb-4">
                <div className="col-md-8">
                    <MDBInput
                        type="text"
                        value={searchTerm}
                        label="Search Tasks"
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="col-md-4">
                    <MDBInput
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        label="Filter by Date"
                    />
                </div>
            </div>

            <MDBDatatable
                striped
                hover
                className="table-responsive"
                data={tableData}
                searching={true}
                searchLabel="Search tasks"
                entriesOptions={[5, 10, 25]}
                entries={10}
            />

            <Toast
                show={toast.show}
                message={toast.message}
                onClose={() => setToast({ show: false, message: '' })}
            />
        </MDBContainer>
    );
};

export default Tasks;