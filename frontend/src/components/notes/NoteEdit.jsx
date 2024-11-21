// src/components/notes/NoteEdit.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MDBInput,
  MDBTextArea,
  MDBBtn,
  MDBCard,
  MDBCardBody,
  MDBContainer,
  MDBSpinner
} from 'mdb-react-ui-kit';
import { ApiService } from '../../services/api';
import { formatLocalDate } from '../../utils/dateUtils';
import Toast from '../common/Toast';

const NoteEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(!!id);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const [note, setNote] = useState({
    title: '',
    content: '',
    date: formatLocalDate(),
  });

  useEffect(() => {
    const loadNote = async () => {
      if (id) {
        try {
          const response = await ApiService.getNote(id);
          setNote(response.data);
        } catch (error) {
          console.error('Failed to load note:', error);
          setToast({
            show: true,
            message: 'Failed to load note: ' + error.message,
            type: 'danger'
          });
        } finally {
          setLoading(false);
        }
      }
    };
    loadNote();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (id) {
        await ApiService.updateNote(id, note);
      } else {
        await ApiService.createNote(note);
      }
      setToast({
        show: true,
        message: `Note successfully ${id ? 'updated' : 'created'}`,
        type: 'success'
      });
      setTimeout(() => navigate('/notes'), 1500);
    } catch (error) {
      console.error('Failed to save note:', error);
      setToast({
        show: true,
        message: 'Failed to save note: ' + error.message,
        type: 'danger'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNote(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this note?')) {
      return;
    }

    setLoading(true);
    try {
      await ApiService.deleteNote(id);
      setToast({
        show: true,
        message: 'Note successfully deleted',
        type: 'success'
      });
      setTimeout(() => navigate('/notes'), 1500);
    } catch (error) {
      console.error('Failed to delete note:', error);
      setToast({
        show: true,
        message: 'Failed to delete note: ' + error.message,
        type: 'danger'
      });
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MDBContainer className="py-5 d-flex justify-content-center">
        <MDBSpinner role="status">
          <span className="visually-hidden">Loading...</span>
        </MDBSpinner>
      </MDBContainer>
    );
  }

  return (
    <MDBContainer className="py-5">
      <h1>{id ? 'Edit Note' : 'New Note'}</h1>
      <MDBCard>
        <MDBCardBody>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <MDBInput
                label="Title"
                name="title"
                value={note.title}
                onChange={handleChange}
                required
                maxLength={200}
              />
            </div>
            
            <div className="mb-3">
              <MDBTextArea
                label="Content"
                name="content"
                value={note.content}
                onChange={handleChange}
                rows={5}
              />
            </div>

            <div className="mb-3">
              <MDBInput
                type="date"
                label="Date"
                name="date"
                value={note.date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="d-flex gap-2">
              <MDBBtn 
                type="submit" 
                color="primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <MDBSpinner size='sm' className='me-2' />
                    Saving...
                  </>
                ) : id ? 'Save' : 'Create'}
              </MDBBtn>
              
              <MDBBtn 
                type="button" 
                color="secondary"
                onClick={() => navigate('/notes')}
                disabled={loading}
              >
                Cancel
              </MDBBtn>
              
              {id && (
                <MDBBtn
                  type="button"
                  color="danger"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  Delete
                </MDBBtn>
              )}
            </div>
          </form>
        </MDBCardBody>
      </MDBCard>

      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ show: false, message: '', type: 'info' })}
      />
    </MDBContainer>
  );
};

export default NoteEdit;