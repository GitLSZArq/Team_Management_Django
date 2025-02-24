import React, { useState, useEffect } from 'react';
import moment from 'moment';
import Timeline from 'react-calendar-timeline';
import 'react-calendar-timeline/lib/Timeline.css';
import { TimelineHeaders, SidebarHeader, DateHeader, TimelineMarkers, TodayMarker } from 'react-calendar-timeline';

function Tasks({ tasks }) {
  const [formattedTasks, setFormattedTasks] = useState([]);
  const [expandedTasks, setExpandedTasks] = useState([]);


  useEffect(() => {
      const formatted = tasks.map(task => {
        console.log(`Task: ${task.name}, Parent: ${task.parent}`); // Debugging line
        return {
          id: task.id,
          group: task.parent ? `sub-${task.id}` : `task-${task.id}`,
          title: task.name,
          start_time: moment(task.start_date).valueOf(),
          end_time: moment(task.deadline).valueOf(),
          parent: task.parent,
          project: task.project,
          project_name: task.project_name,
        };
      });
      setFormattedTasks(formatted);
  }, [tasks]);


  const handleToggleExpand = (taskId) => {
    setExpandedTasks(prev => {
      const newExpandedTasks = prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId];
      return newExpandedTasks;
    });
  };

  const renderTaskItem = ({ item, itemContext, getItemProps }) => {
    const isParent = !item.parent;
    console.log(`Rendering item: ${item.title}, Is Parent: ${isParent}`); // Debugging line
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
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }} className="timeline">
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
  );
}

export default Tasks;
