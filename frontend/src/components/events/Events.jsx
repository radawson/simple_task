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
                field: 'summary',
                className: 'col-2'
            },
            {
                label: 'Description',
                field: 'description',
                className: 'col-2'
            },
            {
                label: 'Date',
                field: 'date_start',
                className: 'col-1'
            },
            {
                label: 'Time',
                field: 'time',
                className: 'col-1'
            },
            {
                label: 'Location',
                field: 'location',
                className: 'col-2'
            },
            {
                label: 'Participants',
                field: 'participants',
                className: 'col-2'
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
                summary: event.summary,
                description: event.description || '',
                date_start: event.date_start,
                time: `${event.time_start || ''} ${event.time_end ? `- ${event.time_end}` : ''}`.trim(),
                location: event.location || '',
                status: event.status,
                participants: formatParticipants(event), // Use the new format function
                organizer: event.Organizer
                    ? `${event.Organizer.firstName} ${event.Organizer.lastName}`
                    : '',
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
                message: 'Failed to load events: ' + error.message,
                type: 'danger'
            });
        } finally {
            setLoading(false);
        }
    }, [selectedDate, endDate]);

    const formatParticipants = (event) => {
        if (!event) return '';

        // Use participants from the join table
        if (event.participants?.length > 0) {
            return event.participants
                .map(p => `${p.firstName} ${p.lastName}`)
                .join(', ');
        }

        // Show organizer if available and no participants
        const organizer = event.Organizer
            ? `${event.Organizer.firstName} ${event.Organizer.lastName}`
            : '';

        return organizer;
    };

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

            <div className="row">
                <div className="col-md-4  mb-4">
                    <MDBInput
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        label="Start Date"
                    />
                </div>
                <div className="col-md-4  mb-4">
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
                noFoundMessage="No events found"
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