// src/components/dashboard/NoteList.jsx
import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { MDBAccordion, MDBAccordionItem } from 'mdb-react-ui-kit';

const NoteList = ({ notes }) => {
  return (
    <div className="card">
      <h3 className="m-2">Notes</h3>
      <MDBAccordion flush>
        {notes.map((note) => (
          <MDBAccordionItem
            key={note.id}
            header={note.title}
          >
            {note.content}
          </MDBAccordionItem>
        ))}
      </MDBAccordion>
    </div>
  );
};

export default NoteList;