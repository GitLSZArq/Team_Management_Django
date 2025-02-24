import React, { useState, useEffect } from 'react';
import moment from 'moment';
import Timeline from 'react-calendar-timeline';
import 'react-calendar-timeline/lib/Timeline.css';
import { TimelineHeaders, SidebarHeader, DateHeader, TimelineMarkers, TodayMarker } from 'react-calendar-timeline';

function Tasks({ tasks }) {
  const [formattedTasks, setFormattedTasks] = useState([]);
  const [expandedTasks, setExpandedTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    const formatted = tasks
      .sort((a, b) => moment(a.start_date).diff(moment(b.start_date))) // Sort tasks by start date
      .map(task => ({
        id: task.id,
        group: task.parent ? `sub-${task.id}` : `task-${task.id}`,
        title: task.name,
        start_time: moment(task.start_date).valueOf(),
        end_time: moment(task.deadline).endOf('day').valueOf(), // Adjust end time to end of day
        parent: task.parent,
        project: task.project,
        project_name: task.project_name,
        responsible: task.assigned_to_name,
        priority: task.priority, // Ensure priority is included
        progress: task.progress // Ensure progress is included
      }));
    setFormattedTasks(formatted);
  }, [tasks]);

  const handleToggleExpand = (taskId) => {
    setExpandedTasks(prev => {
      const newExpandedTasks = prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId];
      return newExpandedTasks;
    });
  };

  const handleRightClick = (event, item) => {
    event.preventDefault();
    setSelectedTask(item);
  };

  const renderTaskItem = ({ item, itemContext, getItemProps }) => {
    const isParent = !item.parent;
    return (
      <div
        {...getItemProps()}
        style={{
          ...itemContext.style,
          backgroundColor: isParent ? 'rgba(0, 102, 204, 0.7)' : 'rgba(204, 102, 0, 0.7)',
          borderRadius: '4px',
          border: '2px solid red',
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
          cursor: isParent ? 'pointer' : 'default',
        }}
        onClick={() => isParent && handleToggleExpand(item.id)}
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
          {item.title} {isParent && (expandedTasks.includes(item.id) ? '-' : '+')}
        </span>
      </div>
    );
  };

  const visibleTasks = formattedTasks.filter(task => {
    if (!task.parent) return true;
    return expandedTasks.includes(task.parent);
  });

  const groups = [];
  const addedGroups = new Set();
  const projectGroups = {};

  tasks.forEach(task => {
    if (!task.parent) {
      if (!projectGroups[task.project]) {
        projectGroups[task.project] = [];
      }
      projectGroups[task.project].push(task);
    }
  });

  Object.keys(projectGroups).forEach(projectId => {
    const projectTasks = projectGroups[projectId];
    const projectName = projectTasks[0].project_name;

    projectTasks.forEach((task, index) => {
      if (index === 0) {
        groups.push({ id: `task-${task.id}`, title: projectName, nested: true });
      } else {
        groups.push({ id: `task-${task.id}`, title: '', parent: `task-${projectTasks[0].id}` });
      }
      addedGroups.add(`task-${task.id}`);

      if (expandedTasks.includes(task.id)) {
        formattedTasks.forEach(subTask => {
          if (subTask.parent === task.id) {
            groups.push({ id: `sub-${subTask.id}`, title: '', parent: `task-${task.id}` });
            addedGroups.add(`sub-${subTask.id}`);
          }
        });
      }
    });
  });

  const groupRenderer = ({ group }) => {
    const projectId = group.id.replace('task-', '');
    const rowSpan = projectGroups[projectId]?.length || 1;

    return (
      <div
        style={{
          padding: '8px',
          backgroundColor: group.nested ? '#f0f0f0' : 'transparent',
          gridRowEnd: `span ${rowSpan}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }}
        className="group-cell"
      >
        {group.title}
      </div>
    );
  };

  return (
    <div className="timeline-container">
      <div className="timeline">
        <Timeline
          groups={groups}
          items={visibleTasks}
          defaultTimeStart={moment().add(-1, 'month')}
          defaultTimeEnd={moment().add(1, 'month')}
          lineHeight={50}
          stackItems
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
      <div className="task-details">
        {selectedTask && (
          <div>
            <h3>Task Details</h3>
            <p><strong>Title:</strong> {selectedTask.title}</p>
            <p><strong>Start Time:</strong> {moment(selectedTask.start_time).format('MMMM Do YYYY, h:mm:ss a')}</p>
            <p><strong>End Time:</strong> {moment(selectedTask.end_time).format('MMMM Do YYYY, h:mm:ss a')}</p>
            <p><strong>Project:</strong> {selectedTask.project_name}</p>
            {selectedTask.parent && <p><strong>Parent Task ID:</strong> {selectedTask.parent}</p>}
            <p><strong>Responsible:</strong> {selectedTask.responsible}</p>
            <p><strong>Priority:</strong> {selectedTask.priority}</p>
            <p><strong>Progress:</strong> {selectedTask.progress}%</p> {/* Add progress to task details */}
          </div>
        )}
      </div>
    </div>
  );
}

export default Tasks;
