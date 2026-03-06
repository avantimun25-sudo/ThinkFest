import { Plus, ChevronRight, Calendar as CalendarIcon, ListTree } from "lucide-react";
import { format } from "date-fns";
import { useTasks, useUpdateTask, useCreateTask } from "@/hooks/use-tasks";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { type FilterType } from "./app-sidebar";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

interface TaskListPaneProps {
  filter: FilterType;
  selectedTaskId: number | null;
  onSelectTask: (id: number) => void;
}

export function TaskListPane({ filter, selectedTaskId, onSelectTask }: TaskListPaneProps) {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isAddingTask, setIsAddingTask] = useState(false);
  const updateTask = useUpdateTask();
  const createTask = useCreateTask();

  // Map FilterType to query params
  const queryFilters = (() => {
    if (filter.type === 'list' && filter.id) return { listId: filter.id };
    if (filter.type === 'today') return { date: new Date().toISOString().split('T')[0] };
    return {}; 
  })();

  const { data: tasks, isLoading } = useTasks(queryFilters);

  // Separate query for ALL tasks to show dots on calendar
  const { data: allTasks } = useTasks({});

  const title = (() => {
    switch (filter.type) {
      case 'upcoming': return 'Upcoming Tasks';
      case 'today': return 'Today';
      case 'calendar': return 'Calendar';
      case 'sticky': return 'Sticky Wall';
      case 'list': return filter.name || 'List';
      case 'tag': return `#${filter.name}` || 'Tag';
      default: return 'Tasks';
    }
  })();

  const handleToggleTask = (id: number, currentCompleted: boolean | null) => {
    updateTask.mutate({ id, completed: !currentCompleted });
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    createTask.mutate({
      title: newTaskTitle,
      listId: filter.type === 'list' ? filter.id : undefined,
    }, {
      onSuccess: () => {
        setNewTaskTitle("");
        setIsAddingTask(false);
      }
    });
  };

  if (filter.type === 'calendar') {
    const events = allTasks?.filter(t => t.dueDate).map(t => ({
      id: String(t.id),
      title: t.title,
      start: t.dueDate!,
      color: t.list?.color || '#3b82f6',
      extendedProps: { completed: t.completed }
    })) || [];

    return (
      <div className="flex flex-col h-full bg-background border-r border-border/50 p-8 overflow-y-auto">
        <h1 className="text-4xl font-display font-bold text-foreground mb-8">{title}</h1>
        <div className="calendar-container bg-card p-6 rounded-2xl border border-border shadow-sm">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={events}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: ''
            }}
            height="auto"
            dayMaxEvents={true}
            eventContent={(eventInfo) => (
              <div className="flex items-center gap-1.5 px-1 py-0.5 overflow-hidden">
                <div 
                  className="w-2 h-2 rounded-full shrink-0" 
                  style={{ backgroundColor: eventInfo.event.backgroundColor }}
                />
                <span className={`text-[10px] font-medium truncate ${eventInfo.event.extendedProps.completed ? 'line-through opacity-50' : ''}`}>
                  {eventInfo.event.title}
                </span>
              </div>
            )}
            eventClick={(info) => {
              onSelectTask(parseInt(info.event.id));
            }}
          />
        </div>
        <style dangerouslySetInnerHTML={{ __html: `
          .fc { --fc-border-color: hsl(var(--border) / 0.5); font-family: inherit; }
          .fc .fc-toolbar-title { font-size: 1.25rem; font-weight: 700; }
          .fc .fc-button { background: hsl(var(--secondary)); border: 1px solid hsl(var(--border)); color: hsl(var(--secondary-foreground)); font-weight: 600; text-transform: capitalize; padding: 0.5rem 1rem; border-radius: 0.5rem; }
          .fc .fc-button:hover { background: hsl(var(--accent)); }
          .fc .fc-button-primary:not(:disabled).fc-button-active, .fc .fc-button-primary:not(:disabled):active { background: hsl(var(--primary)); color: hsl(var(--primary-foreground)); border-color: hsl(var(--primary)); }
          .fc .fc-daygrid-day-number { font-size: 0.875rem; font-weight: 600; padding: 8px; color: hsl(var(--muted-foreground)); }
          .fc .fc-day-today { background: hsl(var(--primary) / 0.05) !important; }
          .fc .fc-col-header-cell-cushion { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: hsl(var(--muted-foreground)); padding: 12px 0; }
          .fc-theme-standard td, .fc-theme-standard th { border: 1px solid hsl(var(--border) / 0.3); }
          .fc .fc-scrollgrid { border-radius: 0.75rem; overflow: hidden; border: 1px solid hsl(var(--border) / 0.5); }
          .fc-daygrid-event { background: transparent !important; border: none !important; }
        `}} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background border-r border-border/50">
      <div className="p-8 pb-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-display font-bold text-foreground">{title}</h1>
            <div className="bg-secondary text-secondary-foreground px-4 py-1 rounded-lg text-2xl font-bold border border-border shadow-sm">
              {tasks?.length || 0}
            </div>
          </div>
          <Button 
            onClick={() => setIsAddingTask(!isAddingTask)}
            variant={isAddingTask ? "ghost" : "default"}
            className="rounded-xl px-6"
          >
            {isAddingTask ? "Cancel" : (
              <>
                <Plus className="mr-2 h-5 w-5" />
                Add Task
              </>
            )}
          </Button>
        </div>

        {isAddingTask && (
          <form onSubmit={handleCreateTask} className="relative group mb-8">
            <Plus className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              autoFocus
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Add new task" 
              className="pl-12 py-6 rounded-xl border-2 border-border/50 bg-card text-lg shadow-sm placeholder:text-muted-foreground/60 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
            />
          </form>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-8 pt-4 space-y-3">
        {isLoading ? (
          Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))
        ) : tasks?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <p className="text-lg">No tasks found</p>
            <p className="text-sm opacity-70">Enjoy your free time!</p>
          </div>
        ) : (
          tasks?.map((task) => (
            <div 
              key={task.id}
              onClick={() => onSelectTask(task.id)}
              className={`group flex items-center p-4 rounded-xl border transition-all cursor-pointer hover-elevate ${
                selectedTaskId === task.id 
                  ? 'bg-primary/5 border-primary/20 shadow-md ring-1 ring-primary/10' 
                  : 'bg-card border-border/50 shadow-sm hover:border-border'
              }`}
            >
              <div 
                className="mr-4 mt-0.5"
                onClick={(e) => e.stopPropagation()}
              >
                <Checkbox 
                  checked={!!task.completed} 
                  onCheckedChange={() => handleToggleTask(task.id, task.completed)}
                  className="h-5 w-5 rounded-md border-2 border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className={`text-lg font-medium truncate transition-all ${
                  task.completed ? 'text-muted-foreground line-through' : 'text-foreground'
                }`}>
                  {task.title}
                </p>
                <div className="flex items-center gap-4 mt-1">
                  {task.dueDate && (
                    <div className="flex items-center text-xs font-medium text-muted-foreground">
                      <CalendarIcon className="h-3.5 w-3.5 mr-1.5 opacity-70" />
                      {format(new Date(task.dueDate), 'MMM d, yyyy')}
                    </div>
                  )}
                  {task.subtasks?.length > 0 && (
                    <div className="flex items-center text-xs font-medium text-muted-foreground">
                      <ListTree className="h-3.5 w-3.5 mr-1.5 opacity-70" />
                      {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 ml-4">
                {task.list && (
                  <div 
                    className="w-3 h-3 rounded-sm shadow-sm"
                    style={{ backgroundColor: task.list.color || '#ccc' }}
                    title={task.list.name}
                  />
                )}
                <ChevronRight className={`h-5 w-5 transition-transform duration-300 ${
                  selectedTaskId === task.id ? 'text-primary translate-x-1' : 'text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5'
                }`} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
