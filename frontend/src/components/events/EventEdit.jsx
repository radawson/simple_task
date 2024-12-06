// src/components/events/EventEdit.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MDBInput,
  MDBTextArea,
  MDBBtn,
  MDBSelect,
  MDBCard,
  MDBCardBody,
  MDBContainer,
  MDBTimepicker
} from 'mdb-react-ui-kit';
import { ApiService } from '../../services/api';
import { formatLocalDate } from '../../utils/dateUtils';

const EventEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [persons, setPersons] = useState([]);
  const [calEvent, setCalEvent] = useState({
    summary: '',
    description: '',
    dtstart: formatLocalDate(),
    dtend: formatLocalDate(),
    timeStart: '',
    timeEnd: '',
    location: '',
    status: 'CONFIRMED',
    categories: [],
    priority: 0,
    url: '',
    organizer: null,
    transp: 'OPAQUE',
    class: 'PUBLIC',
    participants: []
  });
  const [loading, setLoading] = useState(!!id);

  const handleChange = (e) => {
    // For MDBSelect components that pass value directly
    if (typeof e === 'object' && !e.target && 'name' in e) {
      setCalEvent(prev => ({
        ...prev,
        [e.name]: e.value
      }));
      return;
    }

    // For regular input elements
    if (e?.target) {
      const { name, value, type, checked } = e.target;
      setCalEvent(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
      return;
    }
  };

  // Handle change for participants
const handleParticipantsChange = (value) => {
  setCalEvent((prev) => ({
    ...prev,
    participants: Array.isArray(value) ? value : [value],
  }));
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Map frontend fields to backend expected fields
      const eventData = {
        summary: calEvent.summary,
        description: calEvent.description || null,
        date_start: calEvent.dtstart,
        date_end: calEvent.dtend || null,
        time_start: calEvent.timeStart || null,
        time_end: calEvent.timeEnd || null,
        location: calEvent.location || null,
        status: calEvent.status,
        classification: calEvent.class || 'PUBLIC',
        priority: calEvent.priority || 0,
        url: calEvent.url || null,
        organizer: calEvent.organizer || null,
        transp: calEvent.transp || 'OPAQUE',
        participants: Array.isArray(calEvent.participants) ? calEvent.participants : []
      };

      console.log('Submitting event data:', eventData);

      if (id) {
        await ApiService.updateEvent(id, eventData);
      } else {
        await ApiService.createEvent(eventData);
      }
      navigate('/events');
    } catch (error) {
      console.error('Failed to save event:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const personsResponse = await ApiService.listPersons();
        setPersons(personsResponse.data);

        if (id) {
          const eventResponse = await ApiService.getEvent(id);
          const eventData = eventResponse.data;

          // Map backend fields to frontend state
          setCalEvent({
            summary: eventData.summary || '',
            description: eventData.description || '',
            dtstart: eventData.date_start || formatLocalDate(),
            dtend: eventData.date_end || '',
            timeStart: eventData.time_start || '',
            timeEnd: eventData.time_end || '',
            location: eventData.location || '',
            status: eventData.status || 'CONFIRMED',
            categories: eventData.categories || [],
            priority: eventData.priority || 0,
            url: eventData.url || '',
            organizer: eventData.organizer || null,
            transp: eventData.transp || 'OPAQUE',
            class: eventData.classification || 'PUBLIC',
            participants: eventData.participants || []
          });
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  if (loading) return <div>Loading...</div>;

  return (
    <MDBContainer className="py-5">
      <h1>{id ? 'Edit Event' : 'New Event'}</h1>
      <MDBCard>
        <MDBCardBody>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <MDBInput
                label="Title"
                name="summary"
                value={calEvent.summary}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3">
              <MDBTextArea
                label="Description"
                name="description"
                value={calEvent.description || ''}
                onChange={handleChange}
                rows={3}
              />
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <MDBInput
                  type="date"
                  label="Start Date"
                  name="dtstart"
                  value={calEvent.dtstart}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-6">
                <MDBInput
                  type="time"
                  label="Start Time"
                  name="timeStart"
                  value={calEvent.timeStart || ''}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <MDBInput
                  type="date"
                  label="End Date"
                  name="dtend"
                  value={calEvent.dtend || ''}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-6">
                <MDBInput
                  type="time"
                  label="End Time"
                  name="timeEnd"
                  value={calEvent.timeEnd || ''}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="mb-3">
              <MDBInput
                label="Location"
                name="location"
                value={calEvent.location || ''}
                onChange={handleChange}
              />
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <MDBSelect
                  name="status"
                  data={[
                    { value: "CONFIRMED", text: "Confirmed" },
                    { value: "TENTATIVE", text: "Tentative" },
                    { value: "CANCELLED", text: "Cancelled" },
                  ]}
                  onChange={value => handleChange({
                    name: 'status',
                    value: typeof value === 'object' ? value.value : value
                  })}
                />
              </div>
              <div className="col-md-6">
                <MDBSelect
                  name="class"
                  data={[
                    { value: "PUBLIC", text: "Public" },
                    { value: "PRIVATE", text: "Private" },
                    { value: "CONFIDENTIAL", text: "Confidential" }
                  ]}
                  onChange={value => handleChange({
                    name: 'class',
                    value: typeof value === 'object' ? value.value : value
                  })}
                />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <MDBSelect
                  label="Organizer"
                  name="organizer"
                  value={calEvent.organizer}
                  onChange={value => handleChange({
                    name: 'organizer',
                    value: typeof value === 'object' ? value.value : value
                  })}
                  data={[
                    { text: 'Select Organizer', value: '' },
                    ...persons.map(person => ({
                      text: `${person.firstName} ${person.lastName}`,
                      value: person.id
                    }))
                  ]}
                />
              </div>
              <div className="col-md-6">
                <MDBSelect
                  label="Participants"
                  name="participants"
                  value={calEvent.participants}
                  onChange={(value) => handleParticipantsChange(value)}
                  data={[
                    { text: 'Select Participant', value: '' },
                    ...persons.map(person => ({
                      text: `${person.firstName} ${person.lastName}`,
                      value: person.id
                    }))
                  ]}
                />
              </div>
            </div>

            <div className="mb-3">
              <MDBInput
                type="url"
                label="URL"
                name="url"
                value={calEvent.url || ''}
                onChange={handleChange}
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
                    await ApiService.deleteEvent(id);
                    navigate('/events');
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

export default EventEdit;