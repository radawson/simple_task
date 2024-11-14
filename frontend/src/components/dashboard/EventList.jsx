// src/components/dashboard/EventList.jsx
import React from 'react';
import { MDBAccordion, MDBAccordionItem, MDBCheckbox } from 'mdb-react-ui-kit';

const EventList = ({ events }) => {
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
        {events.map((event) => (
          <MDBAccordionItem
            key={event.id}
            header={`${event.clock_time}: ${event.name} for ${event.person}`}
          >
            <div className="d-flex justify-content-between align-items-center">
              <div className="form-outline no-border">
                <textarea
                  className="form-control"
                  value={event.description}
                  readOnly={!event.isAdmin}
                />
              </div>
              {!event.no_check && (
                <MDBCheckbox
                  checked={event.completed}
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

export default EventList;