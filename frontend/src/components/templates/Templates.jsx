// src/components/templates/Templates.jsx
import React, { useState, useEffect } from 'react';
import {
    MDBContainer,
    MDBDatatable,
    MDBSelect,
    MDBInput,
    MDBBtn,
    MDBIcon
} from 'mdb-react-ui-kit';
import { ApiService } from '../../services/api';
import { formatLocalDate } from '../../utils/dateUtils';

const Templates = () => {
    const [templates, setTemplates] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState('0');
    const [selectedDate, setSelectedDate] = useState(formatLocalDate());
    const [selectedTasks, setSelectedTasks] = useState(new Set());
    const [tableData, setTableData] = useState({
        columns: [
            {
                label: '',
                field: 'select',
                sort: false,
                width: 30
            },
            { label: 'Name', field: 'name', width: 200 },
            { label: 'Description', field: 'description', width: 300 },
            { label: 'Priority', field: 'priority', width: 100 },
            { label: 'Actions', field: 'actions', width: 100 }
        ],
        rows: []
    });

    const formatTableRows = (tasks) => tasks.map(task => ({
        id: task.id,
        select: '', // Empty string for checkbox column
        name: task.name,
        description: task.description,
        priority: task.priority,
        actions: createActionButtons(task)
    }));

    // Event Handlers
    const handleDelete = async (taskId) => {
        console.log('Delete task:', taskId);
    };

    const handleEdit = (taskId) => {
        console.log('Edit task:', taskId);
    };

    // Update row selection handler
    const handleRowSelect = (row, selected) => {
        console.log('Row selection event:', { row, selected });
        
        setSelectedTasks(prev => {
            const newSelection = new Set(prev);
            if (selected) {
                newSelection.add(row.id);
            } else {
                newSelection.delete(row.id);
            }
            console.log('Updated selection:', newSelection);
            return newSelection;
        });
    };

    useEffect(() => {
        console.log('Selected tasks updated:', selectedTasks);
    }, [selectedTasks]);

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const response = await ApiService.getTemplates();
                setTemplates(response.data);

                // Initialize with all tasks after fetch
                const allTasks = response.data.flatMap(template =>
                    template.tasks.map(task => ({
                        ...task,
                        actions: createActionButtons(task)
                    }))
                );
                setTableData(prev => ({
                    ...prev,
                    rows: allTasks
                }));
            } catch (error) {
                console.error('Failed to fetch templates:', error);
            }
        };
        fetchTemplates();
    }, []);

    const handleTemplateChange = async (templateId) => {
        setSelectedTemplate(templateId);
        if (templateId === '0') {
            // Show all tasks from all templates
            const allTasks = templates.flatMap(template =>
                template.tasks.map(task => ({
                    ...task,
                    actions: createActionButtons(task)
                }))
            );
            setTableData(prev => ({ ...prev, rows: allTasks }));
        } else {
            const template = templates.find(t => t.id === Number(templateId));
            const templateTasks = template?.tasks.map(task => ({
                ...task,
                actions: createActionButtons(task)
            })) || [];
            setTableData(prev => ({ ...prev, rows: templateTasks }));
        }
    };

    const createActionButtons = (task) => (
        <div>
            <MDBBtn
                floating
                size="sm"
                color="primary"
                className="me-1"
                onClick={() => handleEdit(task.id)}
            >
                <MDBIcon icon="edit" />
            </MDBBtn>
            <MDBBtn
                floating
                size="sm"
                color="danger"
                onClick={() => handleDelete(task.id)}
            >
                <MDBIcon icon="trash" />
            </MDBBtn>
        </div>
    );

    const handleAddToTasks = async () => {
        const tasksToAdd = Array.from(selectedTasks).map(taskId => {
            const task = tableData.rows.find(t => t.id === taskId);
            return {
                name: task.name,
                description: task.description,
                date: selectedDate,
                priority: task.priority || 0
            };
        });

        await Promise.all(tasksToAdd.map(task => ApiService.createTask(task)));
        setSelectedTasks(new Set());
    };

    return (
        <MDBContainer className="py-5">
            <h1>Template Management</h1>

            <div className="row mb-4">
                <div className="col-md-4">
                    <select
                        className="form-select"
                        value={selectedTemplate}
                        onChange={(e) => handleTemplateChange(e.target.value)}
                    >
                        <option value="0">All Templates</option>
                        {templates.map(template => (
                            <option key={template.id} value={template.id}>
                                {template.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="col-md-4">
                    <MDBInput
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        label="Target Date"
                    />
                </div>
                <div className="col-md-4">
                    <MDBBtn
                        onClick={handleAddToTasks}
                        disabled={selectedTasks.size === 0}
                    >
                        Add Selected to Tasks
                    </MDBBtn>
                </div>
            </div>
            <div className="row mb-4 ">
                <MDBInput
                    type="text"
                    value={searchTerm}
                    label="Search Templates"
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>


            <MDBDatatable
                striped
                bordered
                hover
                data={{
                    ...tableData,
                    rows: formatTableRows(tableData.rows)
                }}
                selectable
                multi
                onSelectRow={handleRowSelect}
                selectedRows={Array.from(selectedTasks)}
                loading={!templates.length}
                searching={true}
                searchLabel="Search templates"
                entriesOptions={[5, 10, 25]}
                entries={10}
            />
        </MDBContainer>
    );
};

export default Templates;