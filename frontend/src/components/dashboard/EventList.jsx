// src/components/dashboard/EventList.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { MDBAccordion, MDBAccordionItem, MDBCheckbox } from 'mdb-react-ui-kit';

const EventList = ({ events = [] }) => {
  const formatTime = (timeStart, timeEnd) => {
    if (!timeStart) return '';
    return timeEnd ? `${timeStart} - ${timeEnd}` : timeStart;
  };

  const formatParticipants = (participants, person) => {
    if (!participants) return '';
    if (!Array.isArray(participants)) return participants;
  
    // If we have a Person object, use it to map IDs to names
    if (person) {
      return participants.map(id => {
        if (id === person.id) {
          return `${person.firstName} ${person.lastName}`;
        }
        return id;
      }).join(', ');
    }
  
    return participants.join(', ');
  };

  const getHeader = (event) => {
    
    try {
      const time = formatTime(event?.time_start, event?.time_end) || '';
      const participants = formatParticipants(event?.participants, event?.Person) || '';
      const summary = event?.summary || '';
      
      // Build header string with explicit parts
      const header = [
        time && `${time}: `,
        summary,
        participants && ` for ${participants}`,
        event.location && ` @ ${event.location}`
      ].filter(Boolean).join('');
      
      return header || 'Untitled Event'; // Fallback value
    } catch (err) {
      console.error('Error generating header:', err);
      return 'Error: Could not generate header';
    }
  };

  const handleCompletedChange = async (eventId, completed) => {
    const formData = new FormData();
    formData.append('completed', completed.toString());

    try {
      await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        body: formData
      });
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  return (
    <div className="card">
      <h3 className="m-2">Events</h3>
      <MDBAccordion flush>
        {events.map((event, index) => (
          <MDBAccordionItem
            id={event?.id || index}
            key={event?.id || index}
            collapseId={`collapse-${index}`} 
            headerClassName="d-flex justify-content-between align-items-center"
            headerTitle={String(getHeader(event))}
          >
            <div className="d-flex justify-content-between align-items-center">
              <div className="form-outline no-border">
                <textarea
                  className="form-control"
                  value={event.description || ''}
                  readOnly={!event.isAdmin}
                />
                <div className="mt-2 text-muted">
                  <small>
                    {event.location && `Location: ${event.location}`}
                    {event.status && ` • Status: ${event.status}`}
                  </small>
                </div>
              </div>
              {!event.no_check && (
                <MDBCheckbox
                  checked={!!event.completed}
                  onChange={(e) => handleCompletedChange(event.id, e.target.checked)}
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

EventList.propTypes = {
  events: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    summary: PropTypes.string,
    description: PropTypes.string,
    time_start: PropTypes.string,
    time_end: PropTypes.string,
    location: PropTypes.string,
    status: PropTypes.string,
    completed: PropTypes.bool,
    isAdmin: PropTypes.bool,
    no_check: PropTypes.bool,
    participants: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.arrayOf(PropTypes.string)
    ])
  }))
};

export default EventList;