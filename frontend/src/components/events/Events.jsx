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

const Events = () => {
    const navigate = useNavigate();
    const [endDate, setEndDate] = useState('');
    const [selectedDate, setSelectedDate] = useState(formatLocalDate());
    const [selectedEvents, setSelectedEvents] = useState(new Set());
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
                className: 'col-3'
            },
            {
                label: 'Start Date',
                field: 'dtstart',
                className: 'col-1'
            },
            {
                label: 'End Date',
                field: 'dtend',
                className: 'col-1'
            },
            {
                label: 'Participants',
                field: 'participants',
                className: 'col-3'
            },
            {
                label: 'Actions',
                field: 'actions',
                className: 'col-1'
            }
        ],
        rows: []
    });

    const [loading, setLoading] = useState(false);

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

    const handleRowSelect = (selectionEvent) => {
        if (!Array.isArray(selectionEvent)) return;

        // Create Set from selected task IDs
        const newSelection = new Set(
            selectionEvent.map(event => event.id)
        );

        // Update selected tasks state
        setSelectedEvents(newSelection);

        console.log('Updated selection:', newSelection);
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

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        try {
            let response;
            if (!selectedDate) {
                response = await ApiService.listEvents();
            } else if (!endDate) {
            response = await ApiService.getEvents(selectedDate);
            } else {
                response = await ApiService.getEventsByRange(selectedDate, endDate);
            }
            const eventsArray = response?.data || [];

            const formattedEvents = eventsArray.map(event => ({
                id: event.id,
                name: event.name,
                description: event.description,
                date: event.date,
                priority: event.priority,
                completed: event.completed,
                actions: createActionButtons(event)
            }));

            setAsyncData(prev => ({
                ...prev,
                rows: formattedEvents
            }));
        } catch (error) {
            console.error('Failed to fetch events:', error);
            setToast({
                show: true,
                message: 'Failed to load events: ' + error.message
            });
        } finally {
            setLoading(false);
        }
    }, [selectedDate]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    return (
        <MDBContainer className="py-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>Events</h1>
                <MDBBtn onClick={handleNewEvent}>
                    <MDBIcon icon="plus" className="me-2" /> New Event
                </MDBBtn>
            </div>

            <div className="row mb-4">
            <div className="col-md-4">
                    <MDBInput
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        label="Start Date"
                    />
                </div>
                <div className="col-md-4">
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
                searchLabel="Search Events"
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