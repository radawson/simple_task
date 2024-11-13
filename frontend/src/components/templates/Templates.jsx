// src/components/templates/Templates.jsx
import React, { useState, useEffect } from 'react';
import {
    MDBCarousel,
    MDBCarouselItem,
    MDBAccordion,
    MDBAccordionItem,
    MDBCheckbox,
    MDBBtn,
    MDBInput
} from 'mdb-react-ui-kit';
import { ApiService } from '../../services/api';
import { formatLocalDate } from '../../utils/dateUtils';

const Templates = () => {
    const [templates, setTemplates] = useState([]);
    const [selectedDate, setSelectedDate] = useState(formatLocalDate());
    const [selectedTasks, setSelectedTasks] = useState({});

    useEffect(() => {
        const fetchTemplates = async () => {
            const response = await ApiService.getTemplates();
            setTemplates(response.data);
            // Initialize selected tasks tracking
            const initialSelected = {};
            response.data.forEach(template => {
                initialSelected[template.id] = new Set();
            });
            setSelectedTasks(initialSelected);
        };
        fetchTemplates();
    }, []);

    const handleTaskToggle = (templateId, taskId) => {
        setSelectedTasks(prev => {
            const updated = { ...prev };
            if (updated[templateId].has(taskId)) {
                updated[templateId].delete(taskId);
            } else {
                updated[templateId].add(taskId);
            }
            return updated;
        });
    };

    const handleAddToTasks = async () => {
        // Collect all selected tasks
        const tasksToAdd = [];
        Object.entries(selectedTasks).forEach(([templateId, taskIds]) => {
            const template = templates.find(t => t.id === Number(templateId));
            if (template) {
                template.tasks.forEach(task => {
                    if (taskIds.has(task.id)) {
                        tasksToAdd.push({
                            name: task.name,
                            description: task.description,
                            date: selectedDate,
                            priority: task.priority || 0
                        });
                    }
                });
            }
        });

        // Bulk create tasks
        await Promise.all(tasksToAdd.map(task => ApiService.createTask(task)));
    };

    return (
        <div className="container py-5">
            <h1>Template Management</h1>

            <div className="row mb-4">
                <div className="col-md-6">
                    <MDBInput
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        label="Target Date"
                    />
                </div>
                <div className="col-md-6">
                    <MDBBtn onClick={handleAddToTasks}>Add to Tasks</MDBBtn>
                </div>
            </div>

            <MDBCarousel showControls showIndicators dark>
                {templates.map((template, index) => (
                    <MDBCarouselItem itemId={index + 1} key={template.id}>
                        <div className="card">
                            <div className="card-header">
                                <h4>{template.name}</h4>
                            </div>
                            <div className="card-body">
                                <MDBAccordion>
                                    {template.tasks?.map(task => (
                                        <MDBAccordionItem
                                            key={task.id}
                                            collapseId={`task-${task.id}`}  // Add required collapseId
                                            title={  
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <MDBCheckbox
                                                        name={`task-${task.id}`}
                                                        id={`checkbox-${task.id}`}
                                                        checked={selectedTasks[template.id]?.has(task.id) || false}
                                                        onChange={() => handleTaskToggle(template.id, task.id)}
                                                        onClick={e => e.stopPropagation()}
                                                        label={task.name || 'Untitled Task'}
                                                    />
                                                </div>
                                            }
                                        >
                                            {task.description || 'No description available'}
                                        </MDBAccordionItem>
                                    )) || <p>No tasks available</p>}
                                </MDBAccordion>
                            </div>
                        </div>
                    </MDBCarouselItem>
                ))}
            </MDBCarousel>
        </div>
    );
};

export default Templates;