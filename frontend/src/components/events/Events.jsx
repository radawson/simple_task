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

const Events = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState(formatLocalDate());
    const [selectedEvents, setSelectedEvents] = useState(new Set());
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

    const handleEdit = (eventId) => {
        navigate(`/events/edit/${eventId}`);
    };

    const handleDelete = async (eventId) => {
        try {
            await ApiService.deleteEvent(eventId);
            fetchEvents();
            setToast({
                show: true,
                message: 'Event deleted successfully'
            });
        } catch (error) {
            setToast({
                show: true,
                message: 'Failed to delete event: ' + error.message
            });
        }
    };

    const handleNewEvent = () => {
        navigate('/events/new');
    };

    const createActionButtons = (event) => (
        <div>
            <MDBBtn
                floating
                size="sm"
                color="primary"
                className="me-1"
                onClick={() => handleEdit(event.id)}
            >
                <MDBIcon icon="edit" />
            </MDBBtn>
            <MDBBtn
                floating
                size="sm"
                color="danger"
                onClick={() => handleDelete(event.id)}
            >
                <MDBIcon icon="trash" />
            </MDBBtn>
        </div>
    );

    const fetchEvents = async () => {
        try {
            const response = await ApiService.listEvents();
            console.log('API Response:', response);
    
            // Extract tasks array from paginated response
            const eventsArray = response?.data?.events || [];
    
            const formattedEvents = eventsArray.map(event => ({
                id: event.id,
                name: event.name,
                description: event.description,
                date: event.date,
                priority: task.priority,
                completed: task.completed,
                actions: createActionButtons(event)
            }));
    
            setTasks(eventsArray); 
            setTableData(prev => ({
                ...prev,
                rows: formattedEvents
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
        fetchEvents();
    }, []);

    return (
        <MDBContainer className="py-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>Events</h1>
                <MDBBtn onClick={handleNewEvent}>
                    <MDBIcon icon="plus" className="me-2" /> New Event
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

export default Events;