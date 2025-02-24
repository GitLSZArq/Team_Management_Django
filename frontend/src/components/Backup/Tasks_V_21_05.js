import React, { useState, useEffect } from 'react';
import moment from 'moment';
import Timeline from 'react-calendar-timeline';
import 'react-calendar-timeline/lib/Timeline.css';
import { TimelineHeaders, SidebarHeader, DateHeader, TimelineMarkers, TodayMarker } from 'react-calendar-timeline';

function Tasks({ tasks }) {
  const [formattedTasks, setFormattedTasks] = useState([]);
  const [expandedTasks, setExpandedTasks] = useState([]);

  useEffect(() => {
    const formatted = tasks.map(task => ({
      id: task.id,
      group: task.project,
      title: task.name,
      start_time: moment(task.start_date).valueOf(),
      end_time: moment(task.deadline).valueOf(),
      parent: task.parent,
    }));
    setFormattedTasks(formatted);
  }, [tasks]);

  const groups = Array.from(new Set(tasks.map(task => task.project))).map(projectId => {
    const project = tasks.find(task => task.project === projectId);
    return { id: projectId, title: project.project_name };
  });

  const handleToggleExpand = (taskId) => {
    setExpandedTasks(prev =>
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const renderTaskItem = ({ item, itemContext, getItemProps }) => {
    const isParent = !item.parent;
    return (
      <div
        {...getItemProps()}
        style={{
          ...itemContext.style,
          backgroundColor: 'rgba(0, 102, 204, 0.7)',
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
      >
        <TimelineHeaders className="sticky">
          <SidebarHeader>
            {({ getRootProps }) => {
              return <div {...getRootProps()} style={{ backgroundColor: '#e0e0e0', padding: '8px' }}>Projects</div>;
            }}
          </SidebarHeader>
          <DateHeader unit="primaryHeader" style={{ backgroundColor: '#e0e0e0' }} />
          <DateHeader style={{ backgroundColor: '#e0e0e0' }} />
        </TimelineHeaders>
        <TimelineMarkers>
          <TodayMarker />
        </TimelineMarkers>
      </Timeline>
    </div>
  );
}

export default Tasks;
