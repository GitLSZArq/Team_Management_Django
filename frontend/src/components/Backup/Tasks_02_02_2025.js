import React, { useEffect, useState, useCallback } from 'react';
import moment from 'moment';
import axios from 'axios';
import Timeline from 'react-calendar-timeline';
import 'react-calendar-timeline/lib/Timeline.css';
import './Tasks.css';
import {
  TimelineHeaders,
  SidebarHeader,
  DateHeader,
  TimelineMarkers,
  TodayMarker
} from 'react-calendar-timeline';

function Tasks({ tasks = [], projects = [], setTasks }) {
  // 1) State variables
  const [expandedProjects, setExpandedProjects] = useState([]);
  const [expandedTasks, setExpandedTasks] = useState([]);

  const [selectedTask, setSelectedTask] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [taskDetails, setTaskDetails] = useState({});

  // Timeline range controls
  const [visibleTimeStart, setVisibleTimeStart] = useState(
    moment().add(-1, 'month').valueOf()
  );
  const [visibleTimeEnd, setVisibleTimeEnd] = useState(
    moment().add(1, 'month').valueOf()
  );

  // Zoom factor for mouse wheel
  const zoomFactor = 0.1;

  // 2) Zoom on wheel
  const handleWheelZoom = useCallback(
    (event) => {
      const calendarContainer = document.querySelector('.timeline-container');
      const isInsideCalendar =
        calendarContainer && calendarContainer.contains(event.target);

      if (isInsideCalendar) {
        event.preventDefault();
        const delta = event.deltaY;
        const currentZoom = visibleTimeEnd - visibleTimeStart;

        if (delta > 0) {
          // Zoom out
          const newZoom = currentZoom * (1 + zoomFactor);
          setVisibleTimeStart(visibleTimeStart - newZoom * 0.1);
          setVisibleTimeEnd(visibleTimeEnd + newZoom * 0.1);
        } else {
          // Zoom in
          const newZoom = currentZoom * (1 - zoomFactor);
          setVisibleTimeStart(visibleTimeStart + newZoom * 0.1);
          setVisibleTimeEnd(visibleTimeEnd - newZoom * 0.1);
        }
      }
    },
    [visibleTimeStart, visibleTimeEnd, zoomFactor]
  );

  useEffect(() => {
    window.addEventListener('wheel', handleWheelZoom, { passive: false });
    return () => {
      window.removeEventListener('wheel', handleWheelZoom);
    };
  }, [handleWheelZoom]);

  // 3) Handle timeline changes (drag/resize, etc.)
  const handleTimeChange = (newStart, newEnd) => {
    setVisibleTimeStart(newStart);
    setVisibleTimeEnd(newEnd);
  };

  // 4) Expand/collapse logic
  const handleToggleExpandProject = (projectId) => {
    setExpandedProjects((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleToggleExpandTask = (taskId) => {
    setExpandedTasks((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  // 5) Right-click to edit details
  const handleRightClick = (event, item) => {
    event.preventDefault();
  
    setSelectedTask(item);
  
    // Copy all relevant fields into taskDetails
    setTaskDetails({
      id: item.id,
      name: item.title || '',
      project: item.project || '',
      project_name: item.project_name || '',
  
      start_date: item.start_date || '',
      deadline: item.deadline || '',
  
      // The numeric ID of the assignee
      assigned_to: item.assigned_to || '',
      // The textual name of the assignee
      assigned_to_name: item.assigned_to_name || '',
  
      priority: item.priority || 0,
      progress: item.progress || 0,
      // So you can see them in the details panel if you want
      subtasks: item.subtasks || []
    });
  
    setEditMode(false);
  };
  

  // 6) Editing logic
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTaskDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (
      !taskDetails.name ||
      !taskDetails.start_date ||
      !taskDetails.deadline ||
      !taskDetails.project
    ) {
      alert('Error: Missing required fields');
      return;
    }

    if (!taskDetails.id) {
      alert('Error: Task ID is missing');
      return;
    }

    // Extract numeric ID from "task-12" or "subtask-21"
    const numericTaskId = taskDetails.id.replace(/\D/g, '');
    if (!numericTaskId) {
      alert('Error: Invalid Task ID');
      return;
    }

    // Example API endpoint => /api/tasks/12/
    const url = `http://127.0.0.1:8000/api/tasks/${numericTaskId}/`;

    try {
      const response = await axios.put(url, taskDetails);

      // Update local tasks array
      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.id === parseInt(numericTaskId, 10) ? response.data : t
        )
      );

      setSelectedTask(response.data);
      setEditMode(false);

      alert('Task updated successfully!');
    } catch (error) {
      console.error('Update Error:', error.response?.data || error.message);
      alert(
        `Failed to update task: ${
          error.response ? JSON.stringify(error.response.data) : error.message
        }`
      );
    }
  };

  // 7) Build the actual timeline items/groups
  const getVisibleGroupsAndTasks = () => {
    const visibleGroups = [];
    const visibleItems = [];

    // Sort tasks by date for consistent rendering
    const sortedTasks = [...tasks].sort(
      (a, b) => moment(a.start_date).valueOf() - moment(b.start_date).valueOf()
    );

    // Loop over each project
    projects.forEach((project) => {
      const projectId = `project-${project.id}`;

      // 1) Create group & item for the project
      visibleGroups.push({ id: projectId, title: project.name });
      visibleItems.push({
        id: projectId,
        group: projectId,
        title: project.name,
        start_time: moment(project.start_date).valueOf(),
        end_time: moment(project.end_date).valueOf(),
        project_name: project.name,
        parent: null
      });

      // Expand if user has toggled this project
      if (expandedProjects.includes(projectId)) {
        // Find top-level tasks (parent == null) for this project
        const topLevelTasks = sortedTasks.filter(
          (t) => t.project === project.id && !t.parent
        );

        topLevelTasks.forEach((task) => {
          const taskId = `task-${task.id}`;

          // Group & item for the top-level task
          visibleGroups.push({ id: taskId, title: task.name });
          visibleItems.push({
            id: taskId,
            group: taskId,
            title: task.name,
          
            // The timeline library uses these two for the bar positioning:
            start_time: moment(task.start_date).valueOf(),
            end_time: moment(task.deadline).endOf('day').valueOf(),
          
            // -- Add all the fields you need in the detail panel: --
            start_date: task.start_date,
            deadline: task.deadline,
            project: task.project, // numeric ID
            project_name: task.project_name,
            assigned_to: task.assigned_to, // numeric Person ID
            assigned_to_name: task.assigned_to_name, // string from the serializer
            priority: task.priority,
            progress: task.progress,
            subtasks: task.subtasks || [],  // so we can see them in the details
          
            parent: null // top-level => no parent
          });
          

          // If the user toggled this specific task => show its subtasks
          if (expandedTasks.includes(taskId)) {
            // subtask => same project, but parent = the numeric ID of 'task'
            const subtasks = sortedTasks.filter(
              (st) => st.parent === task.id
            );
            subtasks.forEach((subtask) => {
              const subtaskId = `subtask-${subtask.id}`;

              visibleGroups.push({ id: subtaskId, title: subtask.name });
              visibleItems.push({
                id: subtaskId,
                group: subtaskId,
                title: subtask.name,
              
                // timeline positioning
                start_time: moment(subtask.start_date).valueOf(),
                end_time: moment(subtask.deadline).endOf('day').valueOf(),
              
                // detail panel fields
                start_date: subtask.start_date,
                deadline: subtask.deadline,
                project: subtask.project,
                project_name: subtask.project_name,
                assigned_to: subtask.assigned_to,
                assigned_to_name: subtask.assigned_to_name,
                priority: subtask.priority,
                progress: subtask.progress,
                subtasks: subtask.subtasks || [], // if you allow subtasks-of-subtasks
              
                parent: taskId
              });
              
            });
          }
        });
      }
    });

    return { visibleGroups, visibleTasks: visibleItems };
  };

  // 8) Custom item renderer to show + / - only on tasks/projects
  const renderTaskItem = ({ item, itemContext, getItemProps }) => {
    const isProject = item.id.startsWith('project-');
    const isTask = item.id.startsWith('task-');
    // const isSubtask = item.id.startsWith('subtask-');

    let backgroundColor;
    if (isProject) {
      backgroundColor = 'rgba(0, 102, 204, 0.7)'; // blue
    } else if (isTask) {
      backgroundColor = 'rgba(204, 102, 0, 0.7)'; // orange
    } else {
      backgroundColor = 'rgba(102, 204, 0, 0.7)'; // green (subtask)
    }

    return (
      <div
        {...getItemProps()}
        style={{
          ...itemContext.style,
          backgroundColor,
          borderRadius: '4px',
          border: 'none',
          color: 'white',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'absolute',
          top: itemContext.dimensions.top,
          left: itemContext.dimensions.left,
          width: itemContext.dimensions.width,
          height: itemContext.dimensions.height,
          // only project/task can expand => cursor pointer
          cursor: isProject || isTask ? 'pointer' : 'default',
          zIndex: 10
        }}
        onClick={() => {
          if (isProject) {
            handleToggleExpandProject(item.id);
          } else if (isTask) {
            handleToggleExpandTask(item.id);
          }
        }}
        onContextMenu={(e) => handleRightClick(e, item)}
      >
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            padding: '3px'
          }}
        >
          {item.title}
          {/* Show + or - if it's a project */}
          {isProject && (expandedProjects.includes(item.id) ? ' -' : ' +')}
          {/* Show + or - if it's a top-level task */}
          {isTask && (expandedTasks.includes(item.id) ? ' -' : ' +')}
          {/* Subtasks get no toggle */}
        </span>
      </div>
    );
  };

  // 9) Generate the final data for Timeline
  const { visibleGroups, visibleTasks } = getVisibleGroupsAndTasks();

  // 10) Render
  return (
    <div
      onWheel={handleWheelZoom}
      style={{ width: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <div className="timeline-container">
        <div className="timeline">
          <Timeline
            groups={visibleGroups}
            items={visibleTasks}
            visibleTimeStart={visibleTimeStart}
            visibleTimeEnd={visibleTimeEnd}
            onTimeChange={handleTimeChange}
            lineHeight={50}
            stackItems={false}
            itemRenderer={renderTaskItem}
          >
            <TimelineHeaders className="sticky">
              <SidebarHeader>
                {({ getRootProps }) => (
                  <div {...getRootProps()} className="sidebar-header">
                    Projects
                  </div>
                )}
              </SidebarHeader>
              <DateHeader unit="primaryHeader" className="date-header-primary" />
              <DateHeader className="date-header-secondary" />
            </TimelineHeaders>
            <TimelineMarkers>
              <TodayMarker />
            </TimelineMarkers>
          </Timeline>
        </div>
      </div>

      {/* The task details panel, visible when `selectedTask` is not null */}
      <div className="task-details">
        {selectedTask && (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <h3>Task Details</h3>
              <button
                onClick={() => setSelectedTask(null)}
                style={{
                  backgroundColor: 'red',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '5px 10px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>

            {editMode ? (
              <div>
                <label>Title:</label>
                <input
                  type="text"
                  name="name"
                  value={taskDetails.name}
                  onChange={handleInputChange}
                />

                <label>Start Date:</label>
                <input
                  type="date"
                  name="start_date"
                  value={taskDetails.start_date}
                  onChange={handleInputChange}
                />

                <label>End Date:</label>
                <input
                  type="date"
                  name="deadline"
                  value={taskDetails.deadline}
                  onChange={handleInputChange}
                />

                <label>Project ID:</label>
                <input
                  type="number"
                  name="project"
                  value={taskDetails.project}
                  onChange={handleInputChange}
                />

                <label>Responsible:</label>
                <input
                  type="text"
                  name="assigned_to"
                  value={taskDetails.assigned_to}
                  onChange={handleInputChange}
                />

                <label>Priority:</label>
                <input
                  type="number"
                  name="priority"
                  value={taskDetails.priority}
                  onChange={handleInputChange}
                />

                <label>Progress (%):</label>
                <input
                  type="number"
                  name="progress"
                  value={taskDetails.progress}
                  onChange={handleInputChange}
                />

                <button onClick={handleSave}>Save</button>
                <button onClick={() => setEditMode(false)}>Cancel</button>
              </div>
            ) : (
              <div>
                <p>
                  <strong>Title:</strong> {selectedTask.title || 'N/A'}
                </p>
                <p>
                  <strong>Start Date:</strong> {selectedTask.start_date || 'N/A'}
                </p>
                <p>
                  <strong>End Date:</strong> {selectedTask.deadline || 'N/A'}
                </p>
                <p>
                  <strong>Project:</strong> {selectedTask.project_name || 'N/A'}
                </p>
                <p>
                  <strong>Responsible:</strong>{' '}
                  {selectedTask.assigned_to_name || 'N/A'}
                </p>
                <p>
                  <strong>Priority:</strong> {selectedTask.priority || 'N/A'}
                </p>
                <p>
                  <strong>Progress:</strong> {selectedTask.progress || 0}%
                </p>
                <p>
                  <strong>Subtasks:</strong>
                </p>
                <ul>
                  {selectedTask.subtasks && selectedTask.subtasks.length > 0 ? (
                    selectedTask.subtasks.map((subtask) => (
                      <li key={subtask.id}>{subtask.name}</li>
                    ))
                  ) : (
                    <li>No subtasks</li>
                  )}
                </ul>

                <button onClick={() => setEditMode(true)}>Edit</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Tasks;
