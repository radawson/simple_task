// src/components/notes/Notes.jsx
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

const Notes = () => {
    const navigate = useNavigate();
    const [notes, setNotes] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState(formatLocalDate());
    const [tableData, setTableData] = useState({
        columns: [
            {
                label: 'Title',
                field: 'title',
                className: 'col-3'
            },
            {
                label: 'Content',
                field: 'content',
                className: 'col-5'
            },
            {
                label: 'Date',
                field: 'date',
                className: 'col-2'
            },
            {
                label: 'Added By',
                field: 'added_by',
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

    const handleEdit = (noteId) => {
        navigate(`/notes/edit/${noteId}`);
    };

    const handleDelete = async (noteId) => {
        try {
            await ApiService.deleteNote(noteId);
            fetchNotes();
            setToast({
                show: true,
                message: 'Note deleted successfully'
            });
        } catch (error) {
            setToast({
                show: true,
                message: 'Failed to delete note: ' + error.message
            });
        }
    };

    const handleNewNote = () => {
        navigate('/notes/new');
    };

    const createActionButtons = (note) => (
        <div>
            <MDBBtn
                floating
                size="sm"
                color="primary"
                className="me-1"
                onClick={() => handleEdit(note.id)}
            >
                <MDBIcon icon="edit" />
            </MDBBtn>
            <MDBBtn
                floating
                size="sm"
                color="danger"
                onClick={() => handleDelete(note.id)}
            >
                <MDBIcon icon="trash" />
            </MDBBtn>
        </div>
    );

    const fetchNotes = async () => {
        try {
            const response = await ApiService.listNotes({
                date: selectedDate,
                search: searchTerm
            });
            
            const notesArray = response?.data?.notes || [];
            
            const formattedNotes = notesArray.map(note => ({
                id: note.id,
                title: note.title,
                content: note.content?.substring(0, 100) + (note.content?.length > 100 ? '...' : ''),
                date: note.date,
                added_by: note.added_by,
                actions: createActionButtons(note)
            }));
    
            setNotes(notesArray); // Store raw notes
            setTableData(prev => ({
                ...prev,
                rows: formattedNotes
            }));
        } catch (error) {
            console.error('Failed to fetch notes:', error);
            setToast({
                show: true,
                message: 'Failed to load notes: ' + error.message
            });
        }
    };

    // Fetch notes when date or search term changes
    useEffect(() => {
        fetchNotes();
    }, [selectedDate, searchTerm]);

    return (
        <MDBContainer className="py-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>Notes</h1>
                <MDBBtn onClick={handleNewNote}>
                    <MDBIcon icon="plus" className="me-2" /> New Note
                </MDBBtn>
            </div>

            <div className="row mb-4">
                <div className="col-md-8">
                    <MDBInput
                        type="text"
                        value={searchTerm}
                        label="Search Notes"
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
                searching={false} // We're handling search ourselves
                searchLabel="Search notes"
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

export default Notes;