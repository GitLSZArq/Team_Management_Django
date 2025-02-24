import React, { useState } from 'react';
import moment from 'moment';
import axios from 'axios';
import Timeline from 'react-calendar-timeline';
import 'react-calendar-timeline/lib/Timeline.css';
import './Tasks.css';
import { TimelineHeaders, SidebarHeader, DateHeader, TimelineMarkers, TodayMarker } from 'react-calendar-timeline';

function Tasks({ tasks = [], projects = [] }) {
  const [expandedProjects, setExpandedProjects] = useState([]);
  const [expandedTasks, setExpandedTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [taskDetails, setTaskDetails] = useState({});
  const [visibleTimeStart, setVisibleTimeStart] = useState(moment().add(-1, 'month').valueOf());
  const [visibleTimeEnd, setVisibleTimeEnd] = useState(moment().add(1, 'month').valueOf());

  const zoomFactor = 0.1; // Controls the zoom speed

  // Handle the scroll zoom
  const handleWheelZoom = (event) => {
    event.preventDefault();
    const delta = event.deltaY; // Detect whether scrolling up (zoom in) or down (zoom out)
    const currentZoom = visibleTimeEnd - visibleTimeStart;

    if (delta > 0) {
      // Zooming out
      const newZoom = currentZoom * (1 + zoomFactor);
      setVisibleTimeStart(visibleTimeStart - newZoom * 0.1);
      setVisibleTimeEnd(visibleTimeEnd + newZoom * 0.1);
    } else {
      // Zooming in (progressive)
      const newZoom = currentZoom * (1 - zoomFactor);
      setVisibleTimeStart(visibleTimeStart + newZoom * 0.1);
      setVisibleTimeEnd(visibleTimeEnd - newZoom * 0.1);
    }
  };

  // Handle timeline time changes (from dragging or header clicks)
  const handleTimeChange = (newStart, newEnd) => {
    setVisibleTimeStart(newStart);
    setVisibleTimeEnd(newEnd);
  };

  const formatTasks = (tasksList) => {
    return tasksList.map((task) => ({
      id: task.id.toString(),
      group: task.parent ? `task-${task.parent.toString()}` : `task-${task.id.toString()}`,
      title: task.name,
      start_time: moment(task.start_date).valueOf(),
      end_time: moment(task.deadline).endOf('day').valueOf(),
      project: task.project.toString(),
      project_name: task.project_name,
      responsible: task.assigned_to_name,
      priority: task.priority,
      progress: task.progress,
      parent: task.parent
    }));
  };

  const formatProjects = (projectsList) => {
    return projectsList.map(project => ({
      id: `project-${project.id.toString()}`,
      group: `project-${project.id.toString()}`,
      title: project.name,
      start_time: moment(project.start_date).valueOf(),
      end_time: moment(project.end_date).valueOf(),
      project_name: project.name,
    }));
  };

  const handleToggleExpandProject = (projectId) => {
    setExpandedProjects(prev => {
      return prev.includes(projectId) ? prev.filter(id => id !== projectId) : [...prev, projectId];
    });
  };

  const handleToggleExpandTask = (taskId) => {
    setExpandedTasks(prev => {
      return prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId];
    });
  };

  const handleRightClick = (event, item) => {
    event.preventDefault();
    setSelectedTask(item);
    setTaskDetails(item);
    setEditMode(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTaskDetails(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSave = async () => {
    let taskId = taskDetails.id;
    const numericTaskId = taskId.match(/\d+/)[0];
    taskId = parseInt(numericTaskId, 10);
    if (isNaN(taskId)) {
      alert('Invalid task ID');
      return;
    }

    const url = `http://127.0.0.1:8000/api/tasks/${taskId}/`;
    try {
      const response = await axios.put(url, taskDetails);
      setSelectedTask(response.data);
      setEditMode(false);
      alert('Task updated successfully!');
    } catch (error) {
      alert(`Failed to update task: ${error.response ? JSON.stringify(error.response.data) : error.message}`);
    }
  };

  const renderTaskItem = ({ item, itemContext, getItemProps }) => {
    const isProject = item.id.startsWith('project-');
    const isTask = item.id.startsWith('task-') && !item.parent;
    const isSubtask = item.parent && item.parent.toString().startsWith('task-');

    return (
      <div
        {...getItemProps()}
        style={{
          ...itemContext.style,
          backgroundColor: isProject ? 'rgba(0, 102, 204, 0.7)' : isTask ? 'rgba(204, 102, 0, 0.7)' : 'rgba(102, 204, 0, 0.7)',
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
          cursor: isProject || isTask ? 'pointer' : 'default',
          zIndex: 10,
        }}
        onClick={() => {
          if (isProject) {
            handleToggleExpandProject(item.id);
          } else if (isTask) {
            handleToggleExpandTask(item.id);
          }
        }}
        onContextMenu={(event) => handleRightClick(event, item)}
      >
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            padding: '3px',
          }}
        >
          {item.title}
          {isProject && (expandedProjects.includes(item.id) ? '-' : '+')}
          {isTask && (expandedTasks.includes(item.id) ? '-' : '+')}
          {isSubtask && (expandedTasks.includes(item.parent.toString()) ? '-' : '+')}
        </span>
      </div>
    );
  };

  const getVisibleGroupsAndTasks = () => {
    const visibleGroups = [];
    const visibleTasks = [];

    const sortedTasks = [...tasks].sort((a, b) => moment(a.start_date).valueOf() - moment(b.start_date).valueOf());

    projects.forEach(project => {
      const projectId = `project-${project.id.toString()}`;
      visibleGroups.push({ id: projectId, title: project.name });
      visibleTasks.push({
        id: projectId,
        group: projectId,
        title: project.name,
        start_time: moment(project.start_date).valueOf(),
        end_time: moment(project.end_date).valueOf(),
        project_name: project.name,
      });

      if (expandedProjects.includes(projectId)) {
        sortedTasks
          .filter(task => task.project.toString() === project.id.toString() && !task.parent)
          .forEach(task => {
            const taskId = `task-${task.id.toString()}`;
            visibleGroups.push({ id: taskId, title: task.name });
            visibleTasks.push({
              id: taskId,
              group: taskId,
              title: task.name,
              start_time: moment(task.start_date).valueOf(),
              end_time: moment(task.deadline).endOf('day').valueOf(),
              project: task.project.toString(),
              project_name: task.project_name,
              responsible: task.assigned_to_name,
              priority: task.priority,
              progress: task.progress,
              parent: task.parent
            });

            if (expandedTasks.includes(taskId)) {
              sortedTasks
                .filter(subtask => subtask.parent && subtask.parent.toString() === task.id.toString())
                .forEach(subtask => {
                  const subtaskId = `subtask-${subtask.id.toString()}`;
                  visibleGroups.push({ id: subtaskId, title: subtask.name });
                  visibleTasks.push({
                    id: subtaskId,
                    group: subtaskId,
                    title: subtask.name,
                    start_time: moment(subtask.start_date).valueOf(),
                    end_time: moment(subtask.deadline).endOf('day').valueOf(),
                    project: subtask.project.toString(),
                    project_name: subtask.project_name,
                    responsible: subtask.assigned_to_name,
                    priority: subtask.priority,
                    progress: subtask.progress,
                    parent: subtask.parent
                  });
                });
            }
          });
      }
    });

    return { visibleGroups, visibleTasks };
  };

  const { visibleGroups, visibleTasks } = getVisibleGroupsAndTasks();

  const groupRenderer = ({ group }) => {
    const isProject = group.id.startsWith('project-');
    return (
      <div
        style={{
          padding: '8px',
          backgroundColor: isProject ? '#2c2c2c' : 'transparent', /* Dark background for project groups */
          color: '#e0e0e0', /* Light text */
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          borderRight: '1px solid #ddd', /* Keep grid lines in the group headers */
          borderBottom: '1px solid #ddd', /* Keep grid lines in the group headers */
        }}
        className="group-cell"
      >
        {group.title}
      </div>
    );
  };

  return (
    <div onWheel={handleWheelZoom} style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="timeline-container">
        <div className="timeline">
          <Timeline
            groups={visibleGroups}
            items={visibleTasks}
            visibleTimeStart={visibleTimeStart}  // Replacing defaultTimeStart
            visibleTimeEnd={visibleTimeEnd}      // Replacing defaultTimeEnd
            onTimeChange={handleTimeChange}      // Handling drag, zoom-out via timeline header
            lineHeight={50}
            stackItems={false}
            itemRenderer={renderTaskItem}
            groupRenderer={groupRenderer}
          >
            <TimelineHeaders className="sticky">
              <SidebarHeader>
                {({ getRootProps }) => {
                  return <div {...getRootProps()} className="sidebar-header">Projects</div>;
                }}
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
      <div className="task-details">
        {selectedTask && (
          <div>
            <h3>Task Details</h3>
            {editMode ? (
              <div>
                <label>Title:</label>
                <input type="text" name="title" value={taskDetails.title} onChange={handleInputChange} />
                <label>Start Time:</label>
                <input type="date" name="start_time" value={moment(taskDetails.start_time).format('YYYY-MM-DD')} onChange={handleInputChange} />
                <label>End Time:</label>
                <input type="date" name="end_time" value={moment(taskDetails.end_time).format('YYYY-MM-DD')} onChange={handleInputChange} />
                <label>Project:</label>
                <input type="text" name="project_name" value={taskDetails.project_name} onChange={handleInputChange} />
                <label>Responsible:</label>
                <input type="text" name="responsible" value={taskDetails.responsible} onChange={handleInputChange} />
                <label>Priority:</label>
                <input type="number" name="priority" value={taskDetails.priority} onChange={handleInputChange} />
                <label>Progress:</label>
                <input type="number" name="progress" value={taskDetails.progress} onChange={handleInputChange} />
                <button onClick={handleSave}>Save</button>
                <button onClick={() => setEditMode(false)}>Cancel</button>
              </div>
            ) : (
              <div>
                <p><strong>Title:</strong> {selectedTask.title}</p>
                <p><strong>Start Time:</strong> {moment(selectedTask.start_time).format('MMMM Do YYYY, h:mm:ss a')}</p>
                <p><strong>End Time:</strong> {moment(selectedTask.end_time).format('MMMM Do YYYY, h:mm:ss a')}</p>
                <p><strong>Project:</strong> {selectedTask.project_name}</p>
                <p><strong>Responsible:</strong> {selectedTask.responsible}</p>
                <p><strong>Priority:</strong> {selectedTask.priority}</p>
                <p><strong>Progress:</strong> {selectedTask.progress}%</p>
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
