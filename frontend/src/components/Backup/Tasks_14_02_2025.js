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
  const [projectList, setProjectList] = useState(projects);
  const [highlightedItemId, setHighlightedItemId] = useState(null);
  // Store a mapping of item id => true/false indicating if it is in drag-enabled mode.
  const [dragEnabledItems, setDragEnabledItems] = useState({});

  const toggleDragEnabled = (itemId) => {
    setDragEnabledItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));

    
  };
  

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
      assigned_to: item.assigned_to || '',
      assigned_to_name: item.assigned_to_name || '',
      priority: item.priority || 0,
      progress: item.progress || 0,
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
      alert('Error: Task/Project ID is missing');
      return;
    }

    const numericId = taskDetails.id.replace(/\D/g, '');
    if (!numericId) {
      alert('Error: Invalid ID');
      return;
    }

    let url = '';
    let payload = {};

    if (taskDetails.id.startsWith("project-")) {
      url = `http://127.0.0.1:8000/api/projects/${numericId}/`;
      payload = {
        name: taskDetails.name,
        start_date: taskDetails.start_date,
        end_date: taskDetails.deadline, // mapping deadline to end_date
        code: taskDetails.code // ensure code is included
      };
    } else {
      url = `http://127.0.0.1:8000/api/tasks/${numericId}/`;
      payload = taskDetails;
    }

    try {
      const response = await axios.put(url, payload);

      if (taskDetails.id.startsWith("project-")) {
        setProjectList(prevProjects =>
          prevProjects.map((proj) =>
            proj.id === parseInt(numericId, 10) ? response.data : proj
          )
        );
      } else {
        setTasks(prevTasks =>
          prevTasks.map((t) =>
            t.id === parseInt(numericId, 10) ? response.data : t
          )
        );
      }

      setSelectedTask(response.data);
      setEditMode(false);
      alert("Updated successfully!");
    } catch (error) {
      console.error("Update Error:", error.response?.data || error.message);
      alert(
        `Failed to update: ${
          error.response ? JSON.stringify(error.response.data) : error.message
        }`
      );
    }
  };

  // 7) Build the actual timeline items/groups
  const getVisibleGroupsAndTasks = () => {
    const visibleGroups = [];
    const visibleItems = [];
  
    // Sort tasks chronologically by start date.
    const sortedTasks = [...tasks].sort(
      (a, b) => moment(a.start_date).valueOf() - moment(b.start_date).valueOf()
    );
  
    // Recursive helper: adds a task and its children.
    const addTaskRecursively = (task, level = 1, parentId = null) => {
      const groupId = `task-${task.id}`;
      const indent = '  '.repeat(level); // two non-breaking spaces per level
  
      // Add this task group with level info.
      visibleGroups.push({
        id: groupId,
        title: `${indent}${task.name}`,
        level: level
      });
  
      // Add its item with level info.
      visibleItems.push({
        id: groupId,
        group: groupId,
        title: task.name,
        start_time: moment(task.start_date).valueOf(),
        end_time: moment(task.deadline).endOf('day').valueOf(),
        start_date: task.start_date,
        deadline: task.deadline,
        project: task.project,
        project_name: task.project_name,
        assigned_to: task.assigned_to,
        assigned_to_name: task.assigned_to_name,
        priority: task.priority,
        progress: task.progress,
        subtasks: task.subtasks || [],
        parent: parentId,
        level: level,
        canMove: dragEnabledItems[groupId] ? true : false,
        canResize: dragEnabledItems[groupId] ? 'both' : false
      });
  
      // If this task is expanded, add its children recursively.
      if (expandedTasks.includes(groupId)) {
        // Find tasks whose parent equals this task's id.
        const children = sortedTasks.filter((t) => t.parent === task.id);
        children.forEach((child) => {
          addTaskRecursively(child, level + 1, groupId);
        });
      }
    };
  
    // Process each project.
    projectList.forEach((project) => {
      const projectId = `project-${project.id}`;
  
      // Add the project as a group (level 0) and as an item.
      visibleGroups.push({ id: projectId, title: project.name, level: 0 });
      visibleItems.push({
        id: projectId,
        group: projectId,
        title: project.name,
        start_time: moment(project.start_date).valueOf(),
        end_time: moment(project.end_date).valueOf(),
        start_date: project.start_date,
        deadline: project.end_date,
        project: project.id,
        project_name: project.name,
        assigned_to: project.responsible || '',
        assigned_to_name: project.responsible || '',
        priority: project.priority || 0,
        progress: project.progress || 0,
        parent: null,
        level: 0,
        canMove: dragEnabledItems[projectId] ? true : false,
        canResize: dragEnabledItems[projectId] ? 'both' : false
      });
  
      // If the project is expanded, add its top-level tasks.
      if (expandedProjects.includes(projectId)) {
        const topLevelTasks = sortedTasks.filter(
          (t) => t.project === project.id && !t.parent
        );
        topLevelTasks.forEach((task) => {
          addTaskRecursively(task, 1, projectId);
        });
      }
    });
  
    return { visibleGroups, visibleTasks: visibleItems };
  };
  
  

  // 8) Custom item renderer
  // IMPORTANT: We add getResizeProps to the parameter list.
  // We also record mouse coordinates so that only a “click” (with very little movement)
  // toggles expand/collapse. (If the user drags, then no toggle happens.)
  const RenderTaskItem = ({
      item,
      itemContext,
      getItemProps,
      getResizeProps,
      handleToggleExpandProject,
      handleToggleExpandTask,
      handleRightClick,
      expandedProjects,
      expandedTasks,
      dragEnabled,
      toggleDragEnabled
    }) => {
    const isProject = item.id.startsWith('project-');
    const isTask = item.id.startsWith('task-');
      
    const level = item.level !== undefined ? item.level : (item.id.startsWith('project-') ? 0 : 1);

    // Define a palette for each level.
    const levelColors = [
      'rgba(0, 102, 204, 0.7)',  // level 0 (projects): blue
      'rgba(204, 102, 0, 0.7)',   // level 1: orange
      'rgba(0, 153, 0, 0.7)',     // level 2: green
      'rgba(153, 0, 153, 0.7)',   // level 3: purple
      'rgba(255, 165, 0, 0.7)'    // level 4: (or any additional color)
    ];

    // Default background based on type.
    const backgroundColor = levelColors[level] || levelColors[levelColors.length - 1];

    // Use background color unless drag-enabled (which highlights in yellow).
    const mainStyle = {
      ...itemContext.style,
      backgroundColor: dragEnabled ? 'yellow' : backgroundColor,
      borderRadius: '4px',
      border: 'none',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      position: 'absolute',
      cursor: dragEnabled ? 'default' : 'move'
    };

    // Local state to control the "drag-enabled" (highlight) mode.
    // When true, the item remains highlighted in yellow and left clicks will be used for dragging/resizing.
    // const [dragEnabled, setDragEnabled] = React.useState(false);
    // Record the starting coordinates of a left click (to distinguish a click from a drag)
    const [clickStart, setClickStart] = React.useState(null);
  
    // onMouseDown handler:
    // • If middle-click (button === 1), toggle drag-enabled mode.
    // • Otherwise, if left-click and not in drag mode, record the click start position.
    const onMouseDown = (e) => {
      if (e.button === 1) {
        // Middle-click: toggle dragEnabled mode using the parent's function.
        e.preventDefault(); // Prevent default scroll behavior.
        toggleDragEnabled(item.id);
      } else if (e.button === 0 && !dragEnabled) {
        // In normal mode, record the click start to detect a simple click.
        setClickStart({ x: e.clientX, y: e.clientY });
      }
      // (Right-click is handled separately.)
    };
    
  
    // onMouseUp handler:
    // • For left clicks (when not in drag mode), if movement was minimal, toggle expand/collapse.
    const onMouseUp = (e) => {
      if (e.button === 0) { // Left-click release
        if (!dragEnabled && clickStart) {
          // Only treat it as a click (expand/collapse) if not in drag mode.
          const dx = e.clientX - clickStart.x;
          const dy = e.clientY - clickStart.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 5) {
            if (isProject) {
              handleToggleExpandProject(item.id);
            } else if (isTask) {
              handleToggleExpandTask(item.id);
            }
          }
        }
        // Clear the temporary click state.
        setClickStart(null);
        // IMPORTANT: Do NOT reset dragEnabled here.
      } else if (e.button === 1) {
        // For middle-clicks, clear the click start.
        setClickStart(null);
      }
    };
    
    
  

    
  
    return (
      <div
        {...getItemProps({
          onMouseDown: (e) => {
            if (e.button === 1) {
              e.preventDefault();
              toggleDragEnabled(item.id);
            } else if (e.button === 0 && !dragEnabled) {
              setClickStart({ x: e.clientX, y: e.clientY });
            }
          },
          onMouseUp: (e) => {
            if (e.button === 0) {
              if (!dragEnabled && clickStart) {
                const dx = e.clientX - clickStart.x;
                const dy = e.clientY - clickStart.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < 5) {
                  if (item.id.startsWith('project-')) {
                    handleToggleExpandProject(item.id);
                  } else if (item.id.startsWith('task-')) {
                    handleToggleExpandTask(item.id);
                  }
                }
              }
              setClickStart(null);
            } else if (e.button === 1) {
              setClickStart(null);
            }
          },
          onContextMenu: (e) => {
            e.preventDefault();
            handleRightClick(e, item);
          },
          style: mainStyle
        })}
      >
        <div style={{ flex: 1, textAlign: 'center', padding: '3px' }}>
          {item.title}{' '}
          {item.id.startsWith('project-')
            ? expandedProjects.includes(item.id)
              ? ' -'
              : ' +'
            : item.id.startsWith('task-')
            ? expandedTasks.includes(item.id)
              ? ' -'
              : ' +'
            : ''}
        </div>
        {getResizeProps && (
          <>
            <div
              {...getResizeProps('left')}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                width: 10,
                cursor: 'ew-resize',
                zIndex: 20
              }}
            />
            <div
              {...getResizeProps('right')}
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                height: '100%',
                width: 10,
                cursor: 'ew-resize',
                zIndex: 20
              }}
            />
          </>
        )}
      </div>
    );
  };
  
  

  // 9) Define move and resize handlers (unchanged)
  const handleItemMove = async (itemId, dragTime, newGroupOrder) => {
    if (itemId.startsWith("project-")) {
      const numericId = parseInt(itemId.replace("project-", ""), 10);
      const project = projectList.find(p => p.id === numericId);
      if (project) {
        const duration = moment(project.end_date).diff(moment(project.start_date));
        const newStart = moment(dragTime);
        const newEnd = newStart.clone().add(duration, 'milliseconds');
        const updatedProject = {
          ...project,
          start_date: newStart.format("YYYY-MM-DD"),
          end_date: newEnd.format("YYYY-MM-DD")
        };
        setProjectList(prev =>
          prev.map(p => p.id === numericId ? updatedProject : p)
        );
        try {
          await axios.put(`http://127.0.0.1:8000/api/projects/${numericId}/`, {
            name: updatedProject.name,
            start_date: updatedProject.start_date,
            end_date: updatedProject.end_date,
            code: updatedProject.code
          });
        } catch (err) {
          console.error("Error saving project:", err);
        }
      }
    } else {
      const numericId = parseInt(itemId.replace(/\D/g, ''), 10);
      const task = tasks.find(t => t.id === numericId);
      if (task) {
        const duration = moment(task.deadline).diff(moment(task.start_date));
        const newStart = moment(dragTime);
        const newEnd = newStart.clone().add(duration, 'milliseconds');
        const updatedTask = {
          ...task,
          start_date: newStart.format("YYYY-MM-DD"),
          deadline: newEnd.format("YYYY-MM-DD")
        };
        setTasks(prev =>
          prev.map(t => t.id === numericId ? updatedTask : t)
        );
        try {
          await axios.put(`http://127.0.0.1:8000/api/tasks/${numericId}/`, updatedTask);
        } catch (err) {
          console.error("Error saving task:", err);
        }
      }
    }

    // Reset drag-enabled state after moving:
    setDragEnabledItems(prev => ({
      ...prev,
      [itemId]: false
    }));
  };

  const handleItemResize = async (itemId, time, edge) => {
    if (itemId.startsWith("project-")) {
      const numericId = parseInt(itemId.replace("project-", ""), 10);
      const project = projectList.find(p => p.id === numericId);
      if (project) {
        let updatedProject = { ...project };
        if (edge === "left") {
          const newStart = moment(time);
          updatedProject.start_date = newStart.format("YYYY-MM-DD");
        } else if (edge === "right") {
          const newEnd = moment(time);
          updatedProject.end_date = newEnd.format("YYYY-MM-DD");
        }
        setProjectList(prev =>
          prev.map(p => p.id === numericId ? updatedProject : p)
        );
        try {
          await axios.put(`http://127.0.0.1:8000/api/projects/${numericId}/`, {
            name: updatedProject.name,
            start_date: updatedProject.start_date,
            end_date: updatedProject.end_date,
            code: updatedProject.code
          });
        } catch (err) {
          console.error("Error saving project:", err);
        }
      }
    } else {
      const numericId = parseInt(itemId.replace(/\D/g, ''), 10);
      const task = tasks.find(t => t.id === numericId);
      if (task) {
        let updatedTask = { ...task };
        if (edge === "left") {
          const newStart = moment(time);
          updatedTask.start_date = newStart.format("YYYY-MM-DD");
        } else if (edge === "right") {
          const newEnd = moment(time);
          updatedTask.deadline = newEnd.format("YYYY-MM-DD");
        }
        setTasks(prev =>
          prev.map(t => t.id === numericId ? updatedTask : t)
        );
        try {
          await axios.put(`http://127.0.0.1:8000/api/tasks/${numericId}/`, updatedTask);
        } catch (err) {
          console.error("Error saving task:", err);
        }
      }
    }

    // Reset drag-enabled state after resizing:
    setDragEnabledItems(prev => ({
      ...prev,
      [itemId]: false
    }));
  };

  // 10) Generate the final data for Timeline
  const { visibleGroups, visibleTasks } = getVisibleGroupsAndTasks();

  // 11) Render
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
            itemRenderer={(props) => (
              <RenderTaskItem
                {...props}
                dragEnabled={!!dragEnabledItems[props.item.id]}  // ensure a Boolean value
                toggleDragEnabled={toggleDragEnabled}
                handleToggleExpandProject={handleToggleExpandProject}
                handleToggleExpandTask={handleToggleExpandTask}
                handleRightClick={handleRightClick}
                expandedProjects={expandedProjects}
                expandedTasks={expandedTasks}
              />
            )}
            
            onItemMove={handleItemMove}
            onItemResize={handleItemResize}
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
