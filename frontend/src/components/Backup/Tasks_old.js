import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';
import Timeline from 'react-calendar-timeline';
import 'react-calendar-timeline/lib/Timeline.css';
import { Typography, Paper, Box, Button } from '@mui/material';
import { TimelineHeaders, SidebarHeader, DateHeader, TimelineMarkers, TodayMarker } from 'react-calendar-timeline';

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [expandedTasks, setExpandedTasks] = useState({});

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/tasks/')
      .then(response => {
        console.log('Fetched tasks:', response.data);
        const formattedTasks = response.data.map(task => ({
          ...task,
          start_time: moment(task.start_date).valueOf(), // Ensure correct formatting
          end_time: moment(task.deadline).valueOf(), // Ensure correct formatting
          group: task.project,
          title: `${task.project_name} - ${task.name}`,
        }));
        setTasks(formattedTasks);
        console.log('Formatted tasks:', formattedTasks);
      })
      .catch(error => console.error('Error fetching tasks:', error));
  }, []);

  const handleSelectTask = (task) => {
    setSelectedTask(task);
  };

  const toggleExpand = (taskId) => {
    setExpandedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const groupedTasks = tasks.reduce((acc, task) => {
    if (!acc[task.project]) {
      acc[task.project] = [];
    }
    acc[task.project].push(task);
    return acc;
  }, {});

  console.log('Grouped tasks:', groupedTasks);

  const groups = Object.keys(groupedTasks).map((projectId) => ({
    id: parseInt(projectId),
    title: tasks.find(task => task.project === parseInt(projectId)).project_name,
  }));

  const items = tasks.map(task => ({
    id: task.id,
    group: task.project,
    title: task.name,
    start_time: moment(task.start_time), // Ensure correct formatting
    end_time: moment(task.end_time), // Ensure correct formatting
    canMove: false,
    canResize: false,
    canChangeGroup: false,
  }));

  console.log('Timeline groups:', groups);
  console.log('Timeline items:', items);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }} className="timeline">
      <Timeline
        groups={groups}
        items={items}
        defaultTimeStart={moment().add(-1, 'month')}
        defaultTimeEnd={moment().add(1, 'month')}
        lineHeight={50}
        stackItems
        itemRenderer={({ item, itemContext, getItemProps, getResizeProps }) => (
          <div
            {...getItemProps()}
            style={{
              ...itemContext.style,
              backgroundColor: 'rgba(0, 102, 204, 0.7)',
              borderRadius: '4px',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              color: 'white',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                padding: '3px',
              }}
            >
              {itemContext.title}
            </span>
          </div>
        )}
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

      {selectedTask && (
        <Paper style={{ marginTop: '20px', padding: '10px', borderRadius: '5px', width: '300px' }}>
          <Typography variant="h6">Task Details</Typography>
          <Box>
            <Typography variant="body1"><strong>Task Name:</strong> {selectedTask.title}</Typography>
            <Typography variant="body1"><strong>Project Name:</strong> {selectedTask.project_name}</Typography>
            <Typography variant="body1"><strong>Start Date:</strong> {moment(selectedTask.start_time).format('MMMM Do, YYYY')}</Typography>
            <Typography variant="body1"><strong>Deadline:</strong> {moment(selectedTask.end_time).format('MMMM Do, YYYY')}</Typography>
            <Typography variant="body1"><strong>Progress:</strong> {selectedTask.progress}%</Typography>
            <Typography variant="body1"><strong>Assigned To:</strong> {selectedTask.assigned_to_name}</Typography>
            {selectedTask.subtasks && selectedTask.subtasks.length > 0 && (
              <Box>
                <Button onClick={() => toggleExpand(selectedTask.id)}>
                  {expandedTasks[selectedTask.id] ? '-' : '+'} Sub-Tasks
                </Button>
                {expandedTasks[selectedTask.id] && (
                  <Box>
                    {selectedTask.subtasks.map(subtask => (
                      <Typography key={subtask.id} variant="body2">
                        {subtask.name} - {subtask.progress}%
                      </Typography>
                    ))}
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Paper>
      )}
    </div>
  );
}

export default Tasks;
