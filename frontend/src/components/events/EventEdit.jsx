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
    organizer: '',
    transp: 'OPAQUE',
    class: 'PUBLIC',
    participants: ''
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


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (id) {
        await ApiService.updateEvent(id, calEvent);
      } else {
        await ApiService.createEvent(calEvent);
      }
      navigate('/events');
    } catch (error) {
      console.error('Failed to save event:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load persons for participant selector
        const personsResponse = await ApiService.listPersons();
        setPersons(personsResponse.data);

        if (id) {
          const eventResponse = await ApiService.getEvent(id);
          setCalEvent(eventResponse.data);
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
                  onChange={value => handleChange({
                    name: 'participants',
                    value: typeof value === 'object' ? value.value : value
                  })}
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