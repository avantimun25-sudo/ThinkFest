import { Plus, ChevronRight, Calendar as CalendarIcon, ListTree } from "lucide-react";
import { format, startOfDay } from "date-fns";
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
  const updateTask = useUpdateTask();
  const createTask = useCreateTask();

  // Map FilterType to query params
  const queryFilters = (() => {
    if (filter.type === 'list' && filter.id) return { listId: filter.id };
    if (filter.type === 'today') return { date: new Date().toISOString() };
    return {}; // Other filters would need specific backend implementation or client-side filtering
  })();

  const { data: tasks, isLoading } = useTasks(queryFilters);

  // For calendar view, we want all tasks to show dots
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
      onSuccess: () => setNewTaskTitle("")
    });
  };

  if (filter.type === 'calendar') {
    const events = allTasks?.filter(t => t.dueDate).map(task => ({
      id: String(task.id),
      title: task.title,
      start: task.dueDate!,
      backgroundColor: task.list?.color || '#3b82f6',
      borderColor: task.list?.color || '#3b82f6',
      display: 'list-item'
    })) || [];

    return (
      <div className="flex flex-col h-full bg-background border-r border-border/50 p-8 overflow-y-auto">
        <div className="flex items-center gap-4 mb-8">
          <h1 className="text-4xl font-display font-bold text-foreground">{title}</h1>
        </div>
        <div className="flex-1 bg-card rounded-xl border border-border/50 shadow-sm p-4">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: ''
            }}
            events={events}
            eventClick={(info) => onSelectTask(parseInt(info.event.id))}
            height="auto"
            aspectRatio={1.35}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background border-r border-border/50">
      <div className="p-8 pb-4">
        <div className="flex items-center gap-4 mb-8">
          <h1 className="text-4xl font-display font-bold text-foreground">{title}</h1>
          <div className="bg-secondary text-secondary-foreground px-4 py-1 rounded-lg text-2xl font-bold border border-border shadow-sm">
            {tasks?.length || 0}
          </div>
        </div>

        <form onSubmit={handleCreateTask} className="relative group">
          <Plus className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Add new task" 
            className="pl-12 py-6 rounded-xl border-2 border-border/50 bg-card text-lg shadow-sm placeholder:text-muted-foreground/60 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
          />
        </form>
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
